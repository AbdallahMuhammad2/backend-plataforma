const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { asyncHandler, AppError, sendResponse } = require('../middleware/errorHandler');

// Input validation middleware
const validateLoginInput = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email e senha são obrigatórios', 400);
  }

  if (typeof email !== 'string' || typeof password !== 'string') {
    throw new AppError('Formato de entrada inválido', 400);
  }

  if (!email.includes('@')) {
    throw new AppError('Formato de email inválido', 400);
  }

  next();
};

const validateRegisterInput = (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new AppError('Nome, email e senha são obrigatórios', 400);
  }

  if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
    throw new AppError('Formato de entrada inválido', 400);
  }

  if (!email.includes('@')) {
    throw new AppError('Formato de email inválido', 400);
  }

  if (password.length < 6) {
    throw new AppError('A senha deve ter pelo menos 6 caracteres', 400);
  }

  next();
};

// Registration route
router.post('/register', validateRegisterInput, asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  console.log('Registering user:', { name, email, password: '[REDACTED]' });
  try {
    const result = await UserController.register({
      name,
      email,
      password
    });

    sendResponse(res, 201, { 
      status: 'success',
      data: {
        token: result.token,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          avatar_url: result.user.avatarUrl,
          bio: result.user.bio
        }
      },
      message: 'Usuário registrado com sucesso'
    });
  } catch (error) {
    console.error('Error during registration:', error.message); // Log the error for debugging
    
    // Handle specific known errors
    if (error.message === 'Email already registered') {
      return sendResponse(res, 400, {
        status: 'fail',
        message: 'Este email já está registrado'
      });
    } else {
      // Generic error without exposing details to client
      return sendResponse(res, 500, {
        status: 'error',
        message: 'Erro ao registrar usuário. Por favor, tente novamente mais tarde.'
      });
    }
  }
}));

// Login route
router.post('/login', validateLoginInput, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await UserController.login(email, password);
    
    return sendResponse(res, 200, {
      token: result.token,  // Token no nível principal dos dados
      user: result.user     // Usuário no nível principal dos dados
    }, 'Login realizado com sucesso');
  } catch (error) {
    console.error('Error during login:', error); // Log for debugging
    
    // Handle specific errors with appropriate status codes
    if (error.message === 'Email ou senha inválidos') {
      return sendResponse(res, 401, {
        status: 'fail',
        message: 'Email ou senha inválidos'
      });
    } else {
      // Generic error without exposing details to client
      return sendResponse(res, 500, {
        status: 'error',
        message: 'Erro ao fazer login. Por favor, tente novamente mais tarde.'
      });
    }
  }
}));

module.exports = router;