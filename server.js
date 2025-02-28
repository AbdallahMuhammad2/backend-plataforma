require('dotenv').config({ path: `.env.production` });

console.log('Current Working Directory:', process.cwd());
console.log('Loading environment variables from: .env.production');

// Import dependencies
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/errorHandler');

// Create an instance of express
const app = express();

// Import routes
const authRoutes = require('./routes/auth');  // Verifique se o caminho está correto
const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');
const submissionRoutes = require('./routes/submissions');

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to the API!',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      courses: '/api/courses',
      submissions: '/api/submissions'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/submissions', submissionRoutes);

// Handle favicon requests
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Error handling
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});
app.use(errorHandler);

// Database connection setup
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  port: process.env.DB_PORT,
});

// Log database configuration for debugging (be careful with sensitive data)
console.log('Database User:', process.env.DB_USER);
console.log('Database Host:', process.env.DB_HOST);
console.log('Database Port:', process.env.DB_PORT);

// Test database connection
sequelize.authenticate()
  .then(() => {
    console.log('Database connection successful');
  })
  .catch(err => {
    console.error('Error connecting to the database:', err);
    process.exit(1);
  });

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`
    🚀 Server is running on port ${PORT}
    
    Available endpoints:
    - Auth:
      POST /api/auth/register
      POST /api/auth/login
    
    - Users:
      GET  /api/users/profile
      PUT  /api/users/profile
      GET  /api/users/progress
      GET  /api/users/achievements
    
    - Courses:
      GET  /api/courses
      GET  /api/courses/:id
      GET  /api/courses/:id/modules
      GET  /api/courses/modules/:moduleId/lessons
      POST /api/courses/lessons/:lessonId/complete
    
    - Writing Submissions:
      POST /api/submissions
      GET  /api/submissions
      GET  /api/submissions/:id
      POST /api/submissions/:id/review
    
    Environment: production
  `);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  process.exit(1);
});

module.exports = app;
