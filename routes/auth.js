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
        token: result.token, // Ensure token is included in the response

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
    if (error.message === 'Email already registered') {
      sendResponse(res, 400, {
        status: 'fail',
        message: 'Este email já está registrado'
      });
    } else {
      sendResponse(res, 500, {
        status: 'error',
        message: 'Erro ao registrar usuário'
      });
    }
  }
}));

router.post('/login', validateLoginInput, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await UserController.login(email, password);
    res.status(200).json({ 
        token: result.token, // Ensure token is included in the response

      status: 'success',
      data: {
        token: result.token,
        user: result.user
      },
      message: 'Login realizado com sucesso'
    });
  } catch (error) {
    console.error('Error during login:', error);  // Log detalhado do erro
    if (error.message === 'Invalid email or password') {
      throw new AppError('Email ou senha inválidos', 401);
    }
    throw error;
  }
}));

module.exports = router;
