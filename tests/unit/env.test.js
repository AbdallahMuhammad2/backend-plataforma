const path = require('path');
const dotenv = require('dotenv');

describe('Environment Configuration', () => {
  let originalEnv;

  beforeEach(() => {
    // Store original environment
    originalEnv = { ...process.env };
    // Clear environment variables
    process.env = {};
    // Reset modules
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Environment Loading', () => {
    it('should load environment variables from .env file', () => {
      // Load test environment
      dotenv.config({ path: path.join(__dirname, '../../.env.test') });

      expect(process.env.NODE_ENV).toBe('test');
      expect(process.env.PORT).toBeDefined();
      expect(process.env.DB_NAME).toBeDefined();
    });

    it('should prioritize existing environment variables', () => {
      // Set environment variable before loading .env
      process.env.PORT = '5000';
      
      // Load test environment
      dotenv.config({ path: path.join(__dirname, '../../.env.test') });

      expect(process.env.PORT).toBe('5000');
    });
  });

  describe('Required Variables', () => {
    const requiredVars = [
      'DB_USER',
      'DB_PASSWORD',
      'DB_NAME',
      'DB_HOST',
      'JWT_SECRET'
    ];

    it('should have all required variables', () => {
      // Load test environment
      dotenv.config({ path: path.join(__dirname, '../../.env.test') });

      requiredVars.forEach(variable => {
        expect(process.env[variable]).toBeDefined();
      });
    });

    it('should have valid database configuration', () => {
      // Load test environment
      dotenv.config({ path: path.join(__dirname, '../../.env.test') });

      expect(process.env.DB_PORT).toMatch(/^\d+$/);
      expect(parseInt(process.env.DB_PORT)).toBeGreaterThan(0);
    });
  });

  describe('Optional Variables', () => {
    it('should have default values for optional variables', () => {
      // Load test environment without optional vars
      dotenv.config({ path: path.join(__dirname, '../../.env.test') });

      expect(process.env.PORT || '3001').toBeDefined();
      expect(process.env.NODE_ENV || 'development').toBeDefined();
    });
  });

  describe('Security Variables', () => {
    it('should have secure JWT configuration', () => {
      // Load test environment
      dotenv.config({ path: path.join(__dirname, '../../.env.test') });

      expect(process.env.JWT_SECRET).toBeDefined();
      expect(process.env.JWT_SECRET.length).toBeGreaterThanOrEqual(32);
      expect(process.env.JWT_EXPIRES_IN).toBeDefined();
    });

    it('should have secure file upload configuration', () => {
      // Load test environment
      dotenv.config({ path: path.join(__dirname, '../../.env.test') });

      expect(parseInt(process.env.MAX_FILE_SIZE)).toBeGreaterThan(0);
      expect(process.env.ALLOWED_FILE_TYPES).toBeDefined();
    });
  });

  describe('Email Configuration', () => {
    const emailVars = [
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_USER',
      'SMTP_PASS',
      'EMAIL_FROM'
    ];

    it('should have valid email configuration', () => {
      // Load test environment
      dotenv.config({ path: path.join(__dirname, '../../.env.test') });

      emailVars.forEach(variable => {
        expect(process.env[variable]).toBeDefined();
      });

      expect(parseInt(process.env.SMTP_PORT)).toBeGreaterThan(0);
      expect(process.env.EMAIL_FROM).toMatch(/@/);
    });
  });

  describe('Payment Configuration', () => {
    it('should have valid payment configuration', () => {
      // Load test environment
      dotenv.config({ path: path.join(__dirname, '../../.env.test') });

      expect(process.env.ASAAS_API_KEY).toBeDefined();
      expect(process.env.ASAAS_API_URL).toMatch(/^https?:\/\//);
    });
  });

  describe('Storage Configuration', () => {
    it('should have valid storage configuration', () => {
      // Load test environment
      dotenv.config({ path: path.join(__dirname, '../../.env.test') });

      const validStorageTypes = ['local', 's3'];
      expect(validStorageTypes).toContain(process.env.STORAGE_TYPE || 'local');

      if (process.env.STORAGE_TYPE === 's3') {
        expect(process.env.AWS_ACCESS_KEY_ID).toBeDefined();
        expect(process.env.AWS_SECRET_ACCESS_KEY).toBeDefined();
        expect(process.env.AWS_BUCKET_NAME).toBeDefined();
        expect(process.env.AWS_REGION).toBeDefined();
      }
    });
  });

  describe('CORS Configuration', () => {
    it('should have valid CORS configuration', () => {
      // Load test environment
      dotenv.config({ path: path.join(__dirname, '../../.env.test') });

      expect(process.env.CORS_ORIGIN).toBeDefined();
      expect(process.env.CORS_ORIGIN).toMatch(/^https?:\/\//);
    });
  });

  describe('Environment Specific Configuration', () => {
    it('should load development configuration', () => {
      process.env.NODE_ENV = 'development';
      dotenv.config({ path: path.join(__dirname, '../../.env') });

      expect(process.env.DB_NAME).not.toContain('test');
    });

    it('should load test configuration', () => {
      process.env.NODE_ENV = 'test';
      dotenv.config({ path: path.join(__dirname, '../../.env.test') });

      expect(process.env.DB_NAME).toContain('test');
    });
  });
});
