const { AppError, errorHandler, handleDatabaseError, handleValidationError, handleJWTError, handleJWTExpiredError, sendResponse, sendError } = require('../../middleware/errorHandler');

describe('Error Handling', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    // Reset NODE_ENV before each test
    process.env.NODE_ENV = 'development';
  });

  describe('AppError', () => {
    it('should create operational error', () => {
      const error = new AppError('Test error', 400);
      
      expect(error.statusCode).toBe(400);
      expect(error.status).toBe('fail');
      expect(error.message).toBe('Test error');
      expect(error.isOperational).toBe(true);
    });

    it('should include validation errors', () => {
      const validationErrors = [
        { field: 'email', message: 'Invalid email' }
      ];
      const error = new AppError('Validation Error', 400, validationErrors);

      expect(error.errors).toEqual(validationErrors);
    });
  });

  describe('errorHandler middleware', () => {
    it('should handle AppError in development', () => {
      const error = new AppError('Test error', 400);
      
      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'fail',
          message: 'Test error',
          stack: expect.any(String)
        })
      );
    });

    it('should handle AppError in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new AppError('Test error', 400);
      
      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Test error',
        errors: []
      });
      expect(mockRes.json.mock.calls[0][0]).not.toHaveProperty('stack');
    });

    it('should handle unknown errors in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Unknown error');
      
      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Something went wrong'
      });
    });
  });

  describe('Database Error Handler', () => {
    it('should handle unique violation', () => {
      const dbError = { code: '23505' };
      const error = handleDatabaseError(dbError);

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain('Duplicate');
    });

    it('should handle foreign key violation', () => {
      const dbError = { code: '23503' };
      const error = handleDatabaseError(dbError);

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain('Referenced record');
    });

    it('should handle not null violation', () => {
      const dbError = { code: '23502' };
      const error = handleDatabaseError(dbError);

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain('Required field');
    });
  });

  describe('Validation Error Handler', () => {
    it('should format validation errors', () => {
      const validationError = {
        errors: {
          email: { path: 'email', message: 'Invalid email' },
          password: { path: 'password', message: 'Too short' }
        }
      };

      const error = handleValidationError(validationError);

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(400);
      expect(error.errors).toHaveLength(2);
      expect(error.errors[0]).toHaveProperty('field');
      expect(error.errors[0]).toHaveProperty('message');
    });
  });

  describe('JWT Error Handlers', () => {
    it('should handle invalid JWT', () => {
      const error = handleJWTError();

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(401);
      expect(error.message).toContain('Invalid token');
    });

    it('should handle expired JWT', () => {
      const error = handleJWTExpiredError();

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(401);
      expect(error.message).toContain('expired');
    });
  });

  describe('Response Utilities', () => {
    it('should send success response', () => {
      sendResponse(mockRes, 200, { data: 'test' }, 'Success message');

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Success message',
        data: { data: 'test' }
      });
    });

    it('should send error response', () => {
      sendError(mockRes, 400, 'Error message', [{ field: 'test', message: 'error' }]);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Error message',
        errors: [{ field: 'test', message: 'error' }]
      });
    });

    it('should handle response without message', () => {
      sendResponse(mockRes, 200, { data: 'test' });

      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: { data: 'test' }
      });
    });
  });

  describe('Error Stack Traces', () => {
    it('should include stack trace in development', () => {
      const error = new Error('Test error');
      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.json.mock.calls[0][0]).toHaveProperty('stack');
    });

    it('should exclude stack trace in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Test error');
      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.json.mock.calls[0][0]).not.toHaveProperty('stack');
    });
  });
});
