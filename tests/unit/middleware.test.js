const { authMiddleware, optionalAuth, authorize } = require('../../middleware/auth');
const { errorHandler, AppError } = require('../../middleware/errorHandler');
const { validate, validateQuery } = require('../../middleware/validation');
const jwt = require('jsonwebtoken');

describe('Middleware', () => {
  describe('Authentication Middleware', () => {
    let mockReq;
    let mockRes;
    let nextFunction;

    beforeEach(() => {
      mockReq = {
        header: jest.fn(),
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      nextFunction = jest.fn();
    });

    describe('authMiddleware', () => {
      it('should pass valid token', () => {
        const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET || 'test-secret');
        mockReq.header.mockReturnValue(`Bearer ${token}`);

        authMiddleware(mockReq, mockRes, nextFunction);

        expect(nextFunction).toHaveBeenCalled();
        expect(mockReq.user).toBeDefined();
        expect(mockReq.user.id).toBe(1);
      });

      it('should reject missing token', () => {
        mockReq.header.mockReturnValue(null);

        authMiddleware(mockReq, mockRes, nextFunction);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'No authentication token provided'
        });
      });

      it('should reject invalid token', () => {
        mockReq.header.mockReturnValue('Bearer invalid-token');

        authMiddleware(mockReq, mockRes, nextFunction);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Invalid authentication token'
        });
      });
    });

    describe('optionalAuth', () => {
      it('should pass with valid token', () => {
        const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET || 'test-secret');
        mockReq.header.mockReturnValue(`Bearer ${token}`);

        optionalAuth(mockReq, mockRes, nextFunction);

        expect(nextFunction).toHaveBeenCalled();
        expect(mockReq.user).toBeDefined();
      });

      it('should pass without token', () => {
        mockReq.header.mockReturnValue(null);

        optionalAuth(mockReq, mockRes, nextFunction);

        expect(nextFunction).toHaveBeenCalled();
        expect(mockReq.user).toBeUndefined();
      });
    });

    describe('authorize', () => {
      it('should authorize correct role', () => {
        mockReq.user = { role: 'instructor' };
        const middleware = authorize(['instructor']);

        middleware(mockReq, mockRes, nextFunction);

        expect(nextFunction).toHaveBeenCalled();
      });

      it('should reject incorrect role', () => {
        mockReq.user = { role: 'student' };
        const middleware = authorize(['instructor']);

        middleware(mockReq, mockRes, nextFunction);

        expect(mockRes.status).toHaveBeenCalledWith(403);
      });
    });
  });

  describe('Error Handler', () => {
    let mockReq;
    let mockRes;
    let nextFunction;

    beforeEach(() => {
      mockReq = {};
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      nextFunction = jest.fn();
    });

    it('should handle AppError', () => {
      const error = new AppError('Test error', 400);
      
      errorHandler(error, mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error'
        })
      );
    });

    it('should handle validation errors', () => {
      const error = new AppError('Validation Error', 400, [
        { field: 'email', message: 'Invalid email' }
      ]);

      errorHandler(error, mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json.mock.calls[0][0]).toHaveProperty('errors');
    });

    it('should handle unknown errors in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Unknown error');
      errorHandler(error, mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Something went wrong'
      });

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Validation Middleware', () => {
    let mockReq;
    let mockRes;
    let nextFunction;

    beforeEach(() => {
      mockReq = {
        body: {},
        query: {}
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      nextFunction = jest.fn();
    });

    it('should validate request body', () => {
      const schema = {
        validate: jest.fn().mockReturnValue({ error: null })
      };

      const middleware = validate(schema);
      middleware(mockReq, mockRes, nextFunction);

      expect(schema.validate).toHaveBeenCalledWith(mockReq.body, {
        abortEarly: false,
        stripUnknown: true
      });
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should handle validation errors', () => {
      const schema = {
        validate: jest.fn().mockReturnValue({
          error: {
            details: [
              { path: ['email'], message: 'Invalid email' }
            ]
          }
        })
      };

      const middleware = validate(schema);
      
      expect(() => {
        middleware(mockReq, mockRes, nextFunction);
      }).toThrow(AppError);
    });

    it('should validate query parameters', () => {
      const schema = {
        validate: jest.fn().mockReturnValue({ error: null })
      };

      const middleware = validateQuery(schema);
      middleware(mockReq, mockRes, nextFunction);

      expect(schema.validate).toHaveBeenCalledWith(mockReq.query, {
        abortEarly: false,
        stripUnknown: true
      });
      expect(nextFunction).toHaveBeenCalled();
    });
  });
});
