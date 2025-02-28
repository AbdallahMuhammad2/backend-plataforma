const Joi = require('joi');
const { AppError } = require('./errorHandler');

// Validation schemas
const schemas = {
  // Auth validation schemas
  register: Joi.object({
    name: Joi.string().required().min(3).max(50),
    email: Joi.string().required().email(),
    password: Joi.string().required().min(6),
    avatar_url: Joi.string().uri().optional(),
    bio: Joi.string().optional().max(500)
  }),

  login: Joi.object({
    email: Joi.string().required().email(),
    password: Joi.string().required()
  }),

  // User validation schemas
  updateProfile: Joi.object({
    name: Joi.string().min(3).max(50),
    bio: Joi.string().max(500),
    avatar_url: Joi.string().uri(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/)
  }).min(1),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().required().min(6)
  }),

  // Writing submission schemas
  createSubmission: Joi.object({
    title: Joi.string().required().min(3).max(100),
    content: Joi.string().required().min(100),
    file_url: Joi.string().uri().optional()
  }),

  reviewSubmission: Joi.object({
    feedback: Joi.string().required().min(10),
    score: Joi.number().required().min(0).max(1000),
    corrections: Joi.array().items(Joi.string())
  }),

  // Course schemas
  createCourse: Joi.object({
    title: Joi.string().required().min(3).max(100),
    description: Joi.string().required(),
    thumbnail_url: Joi.string().uri(),
    level: Joi.string().valid('Iniciante', 'Intermediário', 'Avançado'),
    category: Joi.string().required(),
    total_hours: Joi.number().required().min(1)
  }),

  createModule: Joi.object({
    title: Joi.string().required().min(3).max(100),
    description: Joi.string().required(),
    order_index: Joi.number().required().min(0)
  }),

  createLesson: Joi.object({
    title: Joi.string().required().min(3).max(100),
    description: Joi.string().required(),
    video_url: Joi.string().uri().required(),
    duration: Joi.number().required().min(1),
    order_index: Joi.number().required().min(0)
  }),

  // Material schemas
  createMaterial: Joi.object({
    title: Joi.string().required().min(3).max(100),
    type: Joi.string().required().valid('pdf', 'doc', 'docx', 'xlsx'),
    url: Joi.string().uri().required()
  })
};

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(err => ({
        field: err.path[0],
        message: err.message
      }));
      
      throw new AppError('Validation Error', 400, errors);
    }

    next();
  };
};

// Query validation middleware
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(err => ({
        field: err.path[0],
        message: err.message
      }));
      
      throw new AppError('Invalid Query Parameters', 400, errors);
    }

    next();
  };
};

// Params validation middleware
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(err => ({
        field: err.path[0],
        message: err.message
      }));
      
      throw new AppError('Invalid URL Parameters', 400, errors);
    }

    next();
  };
};

module.exports = {
  schemas,
  validate,
  validateQuery,
  validateParams
};
