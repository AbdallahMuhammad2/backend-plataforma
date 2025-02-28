const path = require('path');
const fs = require('fs').promises;
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env.test') });

async function globalSetup() {
  console.log('\n🚀 Setting up test environment...');

  try {
    // Create test database if it doesn't exist
    const mainPool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT
    });

    try {
      await mainPool.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      console.log('✅ Test database created');
    } catch (error) {
      if (error.code === '42P04') { // Database already exists
        console.log('ℹ️  Test database already exists');
      } else {
        throw error;
      }
    }

    // Connect to test database
    const testPool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME
    });

    // Load and execute schema
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    await testPool.query(schema);
    console.log('✅ Database schema applied');

    // Create test directories
    const directories = [
      path.join(__dirname, '../uploads'),
      path.join(__dirname, '../uploads/test'),
      path.join(__dirname, '../uploads/test/writings'),
      path.join(__dirname, '../uploads/test/avatars'),
      path.join(__dirname, '../uploads/test/materials')
    ];

    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
    }
    console.log('✅ Test directories created');

    // Create test fixtures directory
    const fixturesDir = path.join(__dirname, 'fixtures');
    await fs.mkdir(fixturesDir, { recursive: true });

    // Create sample test files
    const testFiles = {
      'test.pdf': 'Test PDF content',
      'test.doc': 'Test DOC content',
      'test.jpg': Buffer.from('Test image content'),
      'test.xlsx': 'Test spreadsheet content'
    };

    for (const [filename, content] of Object.entries(testFiles)) {
      await fs.writeFile(path.join(fixturesDir, filename), content);
    }
    console.log('✅ Test fixtures created');

    // Close database connections
    await testPool.end();
    await mainPool.end();

    console.log('✨ Test environment setup complete!\n');
  } catch (error) {
    console.error('❌ Error setting up test environment:', error);
    process.exit(1);
  }
}

// Cleanup function
async function cleanup() {
  try {
    // Remove test uploads
    const testUploadsDir = path.join(__dirname, '../uploads/test');
    await fs.rm(testUploadsDir, { recursive: true, force: true });

    // Remove test fixtures
    const fixturesDir = path.join(__dirname, 'fixtures');
    await fs.rm(fixturesDir, { recursive: true, force: true });

    console.log('✅ Test environment cleaned up');
  } catch (error) {
    console.error('❌ Error cleaning up test environment:', error);
  }
}

// Handle process termination
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

module.exports = globalSetup;

// Export cleanup function for manual usage
module.exports.cleanup = cleanup;

// Export test database configuration
module.exports.testDbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
};

// Export test environment configuration
module.exports.testConfig = {
  uploadDir: path.join(__dirname, '../uploads/test'),
  fixturesDir: path.join(__dirname, 'fixtures'),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
  allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx').split(','),
  jwtSecret: process.env.JWT_SECRET || 'test-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  testUsers: {
    admin: {
      email: 'admin@example.com',
      password: 'Admin123!',
      role: 'admin'
    },
    instructor: {
      email: 'instructor@example.com',
      password: 'Instructor123!',
      role: 'instructor'
    },
    student: {
      email: 'student@example.com',
      password: 'Student123!',
      role: 'student'
    }
  }
};

// Export test helper functions
module.exports.helpers = {
  async createTestFile(filename, content) {
    const filePath = path.join(__dirname, 'fixtures', filename);
    await fs.writeFile(filePath, content);
    return filePath;
  },

  async cleanTestFiles() {
    const fixturesDir = path.join(__dirname, 'fixtures');
    const files = await fs.readdir(fixturesDir);
    await Promise.all(
      files.map(file => fs.unlink(path.join(fixturesDir, file)))
    );
  },

  getTestFilePath(filename) {
    return path.join(__dirname, 'fixtures', filename);
  }
};
