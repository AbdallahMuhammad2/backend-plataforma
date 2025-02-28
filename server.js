require('dotenv').config({ path: `.env.production` });

console.log('Current Working Directory:', process.cwd());
console.log('Loading environment variables from: .env.production');
console.log('Database User:', 'cursoredac_add1');
console.log('Database Name:', 'cursoredacaopr');
console.log('Database Password:', 'kUz6Zq24yc@TnUz');
console.log('Database Host:', 'mysql.cursoredacaoprofecris.kinghost.net');
console.log('Database Port:', 3306);

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');
const submissionRoutes = require('./routes/submissions');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/submissions', submissionRoutes);

// Error handling
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

app.use(errorHandler);

// Database connection check
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('cursoredacaopr', 'cursoredac_add1', 'kUz6Zq24yc@TnUz', {
  host: 'mysql.cursoredacaoprofecris.kinghost.net',
  dialect: 'mysql',
  port: 3306,
});

// Log database configuration for debugging
console.log('Database User:', 'cursoredac_add1');
console.log('Database Name:', 'cursoredacaopr');
console.log('Database Password:', 'kUz6Zq24yc@TnUz');
console.log('Database Host:', 'mysql.cursoredacaoprofecris.kinghost.net');
console.log('Database Port:', 3306);

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