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
// Importar rotas
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

// Definir as rotas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/submissions', submissionRoutes);

// Handle favicon requests
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Middleware para capturar rotas inexistentes
app.use((req, res, next) => {
  res.status(404).json({ 
    status: 'error',
    message: 'Endpoint não encontrado' 
  });
});

// Middleware global de tratamento de erros (DEVE ser o último middleware)
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
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
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
