const express = require('express');
const errorHandler = require('./middleware/errorHandler');
const app = express();

// Configurações e rotas
// ...

// Middleware para capturar rotas inexistentes
app.use((req, res, next) => {
  res.status(404).json({ 
    status: 'error',
    message: 'Endpoint não encontrado' 
  });
});

// Middleware global de tratamento de erros (DEVE ser o último middleware)
app.use(errorHandler);

// Define a classe AppError para uso em toda a aplicação
class AppError extends Error {
  constructor(message, statusCode = 500, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Middleware para tratamento de erros global
const globalErrorHandler = (err, req, res, next) => {
  console.error('Global error handler caught:', err);
  
  // Se já enviamos uma resposta, apenas passe para o próximo middleware
  if (res.headersSent) {
    return next(err);
  }

  // Determina o status do erro (padrão: 500)
  const statusCode = err.statusCode || 500;
  
  // Retorna sempre resposta JSON
  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Ocorreu um erro no servidor.',
    // Adicione stack trace apenas em ambiente de desenvolvimento
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Middleware para capturar erros em callbacks assíncronos
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

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

// Função auxiliar para enviar respostas formatadas
const sendResponse = (res, statusCode, data, message = null) => {
  const response = {
    status: statusCode >= 200 && statusCode < 400 ? 'success' : 'error'
  };

  if (data) {
    response.data = data;
  }

  if (message) {
    response.message = message;
  }

  return res.status(statusCode).json(response);
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
  errorHandler: globalErrorHandler, // Renomeado para evitar conflito
  asyncHandler,
  handleDatabaseError,
  handleValidationError,
  handleJWTError,
  handleJWTExpiredError,
  sendResponse,
  sendError,
};
