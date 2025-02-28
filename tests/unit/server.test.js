const request = require('supertest');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { errorHandler } = require('../../middleware/errorHandler');

// Mock middleware and routes
jest.mock('cors', () => jest.fn(() => (req, res, next) => next()));
jest.mock('morgan', () => jest.fn(() => (req, res, next) => next()));
jest.mock('../../middleware/errorHandler', () => ({
  errorHandler: jest.fn((err, req, res, next) => {
    res.status(err.statusCode || 500).json({ message: err.message });
  })
}));

// Mock route handlers
jest.mock('../../routes/auth', () => {
  const router = express.Router();
  router.post('/login', (req, res) => res.json({ message: 'Auth route' }));
  return router;
});

jest.mock('../../routes/users', () => {
  const router = express.Router();
  router.get('/profile', (req, res) => res.json({ message: 'Users route' }));
  return router;
});

jest.mock('../../routes/courses', () => {
  const router = express.Router();
  router.get('/', (req, res) => res.json({ message: 'Courses route' }));
  return router;
});

jest.mock('../../routes/submissions', () => {
  const router = express.Router();
  router.post('/', (req, res) => res.json({ message: 'Submissions route' }));
  return router;
});

describe('Server Configuration', () => {
  let app;

  beforeEach(() => {
    // Clear require cache to get fresh instance
    jest.resetModules();
    app = require('../../server');
  });

  describe('Middleware Setup', () => {
    it('should use CORS middleware', () => {
      expect(cors).toHaveBeenCalled();
    });

    it('should use Morgan logger in development', () => {
      expect(morgan).toHaveBeenCalledWith('dev');
    });

    it('should parse JSON bodies', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password' });

      expect(response.status).not.toBe(400);
    });
  });

  describe('Route Configuration', () => {
    it('should mount auth routes', async () => {
      const response = await request(app)
        .post('/api/auth/login');

      expect(response.body.message).toBe('Auth route');
    });

    it('should mount user routes', async () => {
      const response = await request(app)
        .get('/api/users/profile');

      expect(response.body.message).toBe('Users route');
    });

    it('should mount course routes', async () => {
      const response = await request(app)
        .get('/api/courses');

      expect(response.body.message).toBe('Courses route');
    });

    it('should mount submission routes', async () => {
      const response = await request(app)
        .post('/api/submissions');

      expect(response.body.message).toBe('Submissions route');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors', async () => {
      const response = await request(app)
        .get('/nonexistent-route');

      expect(response.status).toBe(404);
    });

    it('should use global error handler', async () => {
      // Create a route that throws an error
      app.get('/error-test', () => {
        throw new Error('Test error');
      });

      const response = await request(app)
        .get('/error-test');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Test error');
    });
  });

  describe('Security Headers', () => {
    it('should set security headers', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options', 'SAMEORIGIN');
      expect(response.headers).toHaveProperty('x-xss-protection', '1; mode=block');
    });
  });

  describe('Health Check', () => {
    it('should respond to health check', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Environment Configuration', () => {
    it('should use correct port from environment', () => {
      const originalPort = process.env.PORT;
      process.env.PORT = '4000';

      const server = require('../../server');
      expect(server.get('port')).toBe('4000');

      process.env.PORT = originalPort;
    });

    it('should use development error handler in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const server = require('../../server');
      const error = new Error('Test error');
      const req = {};
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      server._router.handle(error, req, res, next);

      expect(res.json.mock.calls[0][0]).toHaveProperty('stack');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Static File Serving', () => {
    it('should serve static files from uploads directory', async () => {
      const response = await request(app)
        .get('/uploads/test.jpg');

      // Should not throw 500 error, only 404 if file doesn't exist
      expect(response.status).toBe(404);
    });
  });

  describe('Request Parsing', () => {
    it('should parse URL-encoded bodies', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send('email=test@example.com&password=password')
        .set('Content-Type', 'application/x-www-form-urlencoded');

      expect(response.status).not.toBe(400);
    });

    it('should handle large payloads', async () => {
      const largeData = 'x'.repeat(1024 * 1024); // 1MB of data
      const response = await request(app)
        .post('/api/submissions')
        .send({ content: largeData });

      expect(response.status).not.toBe(413); // Payload Too Large
    });
  });
});
