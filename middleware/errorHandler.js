class AppError extends Error {
  constructor(message, statusCode = 500, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      errors: err.errors,
      stack: err.stack,
    });
  } else {
    // Production error response
    if (err.isOperational) {
      // Known operational errors
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        errors: err.errors,
      });
    } else {
      // Programming or unknown errors
      console.error('ERROR 💥', err);
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong',
      });
    }
  }
};

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Database error handler
const handleDatabaseError = (error) => {
  if (error.code === '23505') { // Unique violation
    return new AppError('Duplicate entry', 400);
  }
  if (error.code === '23503') { // Foreign key violation
    return new AppError('Referenced record not found', 400);
  }
  if (error.code === '23502') { // Not null violation
    return new AppError('Required field missing', 400);
  }
  return error;
};

// Validation error handler
const handleValidationError = (error) => {
  const errors = Object.values(error.errors).map(err => ({
    field: err.path,
    message: err.message
  }));
  return new AppError('Validation Error', 400, errors);
};

// JWT error handler
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired. Please log in again.', 401);

// Response utility functions
const sendResponse = (res, statusCode, data, message = '') => {
  const status = `${statusCode}`.startsWith('4') ? 'fail' : 'success';
  
  const response = {
    status,
    data,
  };

  if (message) {
    response.message = message;
  }

  res.status(statusCode).json(response);
};

const sendError = (res, statusCode = 500, message = 'Something went wrong', errors = []) => {
  res.status(statusCode).json({
    status: 'fail',
    message,
    errors,
  });
};

module.exports = {
  AppError,
  errorHandler,
  asyncHandler,
  handleDatabaseError,
  handleValidationError,
  handleJWTError,
  handleJWTExpiredError,
  sendResponse,
  sendError,
};
