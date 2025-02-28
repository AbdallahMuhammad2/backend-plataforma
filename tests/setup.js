const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.test') });

// Create test database connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST ,
  database: process.env.DB_NAME || 'plataforma_video_test',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// Mock email service
jest.mock('../services/emailService', () => ({
  sendEmail: jest.fn(),
  sendWelcomeEmail: jest.fn(),
  sendSubmissionReceivedEmail: jest.fn(),
  sendCorrectionCompletedEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  sendAchievementUnlockedEmail: jest.fn(),
}));

// Mock payment service
jest.mock('../services/paymentService', () => ({
  createCustomer: jest.fn(),
  createSubscription: jest.fn(),
  createPayment: jest.fn(),
  getSubscription: jest.fn(),
  cancelSubscription: jest.fn(),
  getPayment: jest.fn(),
  getCustomerPayments: jest.fn(),
  refundPayment: jest.fn(),
}));

// Global test setup
global.beforeAll(async () => {
  // Create test database tables
  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
  const schema = require('fs').readFileSync(schemaPath, 'utf8');
  await pool.query(schema);
});

// Clean up database between tests
global.beforeEach(async () => {
  await pool.query(`
    TRUNCATE users, courses, modules, lessons, materials, 
    writing_submissions, achievements, user_achievements, 
    study_notes, user_progress CASCADE
  `);
});

// Global test teardown
global.afterAll(async () => {
  await pool.end();
});

// Test helpers
global.createTestUser = async (userData = {}) => {
  const defaultUser = {
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: '$2a$10$rVX5FNcY2NgCXYzVDTRMkODuQJX8H3Qv8KFXF.1/Xk7CQz.vGU2Uy',
    avatar_url: 'https://example.com/avatar.jpg',
    bio: 'Test user bio',
  };

  const user = { ...defaultUser, ...userData };
  const result = await pool.query(
    `INSERT INTO users (name, email, passwordHash, avatar_url, bio)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [user.name, user.email, user.passwordHash, user.avatar_url, user.bio]
  );

  return result.rows[0];
};

global.createTestCourse = async (courseData = {}) => {
  const defaultCourse = {
    title: 'Test Course',
    description: 'Test course description',
    thumbnail_url: 'https://example.com/thumb.jpg',
    level: 'Intermediário',
    category: 'ENEM',
    total_hours: 40,
    instructor_id: null,
  };

  const course = { ...defaultCourse, ...courseData };
  const result = await pool.query(
    `INSERT INTO courses (title, description, thumbnail_url, level, category, total_hours, instructor_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [course.title, course.description, course.thumbnail_url, course.level, 
     course.category, course.total_hours, course.instructor_id]
  );

  return result.rows[0];
};

// Test utilities
global.getAuthToken = (userId) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { id: userId, email: 'test@example.com' },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

// Custom test matchers
expect.extend({
  toBeValidUUID(received) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    return {
      message: () => `expected ${received} ${pass ? 'not ' : ''}to be a valid UUID`,
      pass,
    };
  },
});

// Export database pool for use in tests
module.exports = {
  pool,
};
