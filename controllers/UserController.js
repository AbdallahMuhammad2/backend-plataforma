const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const BaseController = require('./BaseController');
const { AppError } = require('../middleware/errorHandler');
const { User, Achievement, UserAchievement } = require('../models');

class UserController extends BaseController {
  constructor() {
    super('users');
  }

  async register(userData) {
    try {
      console.log('Registration attempt:', { ...userData, password: '[REDACTED]' });
      
      // Check if email already exists
      const existingUser = await User.findOne({
        where: { email: userData.email }
      });

      if (existingUser) {
        throw new AppError('Email already registered', 400);
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(userData.password, salt);

      // Create user
      const user = await User.create({
        name: userData.name,
        email: userData.email,
        passwordHash,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}`,
        bio: ''
      });

      console.log('User created successfully:', user.id);

      // Remove sensitive data before sending response
      const userResponse = {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        bio: user.bio
      };

      // Generate token
      const token = this.generateToken(userResponse);

      console.log('Token generated:', token); // Log the generated token
      return {
        user: userResponse,
        token 
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Registration error:', error); // Log the error details
      console.error('Error details:', error.message); // Additional logging for error details

      throw new AppError('Erro ao registrar usuário. Por favor, tente novamente.', 500);
    }
  }

  async login(email, password) {
    try {
      const user = await User.findOne({ where: { email } });

      if (!user) {
        throw new AppError('Email ou senha inválidos', 401);
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);

      if (!isMatch) {
        throw new AppError('Email ou senha inválidos', 401);
      }

      // Remove sensitive data before sending response
      const userResponse = {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        bio: user.bio
      };

      // Generate token
      const token = this.generateToken(userResponse);

      return {
        user: userResponse,
        token
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Login error:', error); // Log the error details
      console.error('Error details:', error.message); // Additional logging for error details

      throw new AppError('Erro ao fazer login. Por favor, tente novamente.', 500);
    }
  }

  generateToken(user) {
    try {
      return jwt.sign(
        { 
          id: user.id,
          email: user.email
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );
    } catch (error) {
      throw new AppError('Erro ao gerar token de autenticação', 500);
    }
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AppError('Token expirado', 401);
      }
      throw new AppError('Token inválido', 401);
    }
  }
}

module.exports = new UserController();