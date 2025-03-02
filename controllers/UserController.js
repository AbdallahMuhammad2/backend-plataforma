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

      return { 
        user: userResponse,
        token 
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Registration error:', error);
      throw new AppError('Erro ao registrar usuário. Por favor, tente novamente.', 500);
    }
  }

  async login(email, password) {
    try {
      console.log('Login attempt:', { email, password: '[REDACTED]' });
      
      // Find user by email
      const user = await User.findOne({
        where: { email },
        attributes: ['id', 'name', 'email', 'passwordHash', 'avatarUrl', 'bio']
      });

      if (!user) {
        console.log('User not found');
        throw new AppError('Invalid email or password', 401);
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      console.log('Password comparison result:', isValidPassword);
      
      if (!isValidPassword) {
        throw new AppError('Invalid email or password', 401);
      }

      console.log('Login successful for user:', user.id);

      // Prepare user response without sensitive data
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
      console.error('Login error:', error);
      throw new AppError('Erro durante o login. Por favor, tente novamente.', 500);
    }
  }

  async updateProfile(userId, userData) {
    try {
      if (userData.email) {
        const existingUser = await User.findOne({
          where: { 
            email: userData.email,
            id: { [Op.ne]: userId }
          }
        });

        if (existingUser) {
          throw new AppError('Este email já está em uso', 400);
        }
      }

      if (userData.password) {
        const salt = await bcrypt.genSalt(10);
        userData.passwordHash = await bcrypt.hash(userData.password, salt);
        delete userData.password;
      }

      const user = await User.findByPk(userId);
      if (!user) {
        throw new AppError('Usuário não encontrado', 404);
      }

      await user.update(userData);

      // Remove sensitive data before sending response
      const userResponse = {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        bio: user.bio
      };

      return userResponse;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Profile update error:', error);
      throw new AppError('Erro ao atualizar perfil', 500);
    }
  }

  async getUserStats(req, res) {
    try {
      const userId = req.user.id;
      // Lógica para obter as estatísticas do usuário
      const stats = await User.getStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw new AppError('Error fetching user stats', 500);
    }
  }

  async getRecentAchievements(req, res) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit, 10) || 3;
      // Lógica para obter as conquistas recentes do usuário
      const achievements = await Achievement.getRecent(userId, limit);
      res.json(achievements);
    } catch (error) {
      console.error('Error fetching recent achievements:', error);
      throw new AppError('Error fetching recent achievements', 500);
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
      console.error('Token generation error:', error);
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
