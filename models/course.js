const { Model, DataTypes } = require('sequelize'); 
const { AppError } = require('../middleware/errorHandler'); // Added error handler import

module.exports = (sequelize) => {
  const levels = ['Iniciante', 'Intermediário', 'Avançado'];

  class Course extends Model {
    static associate(models) { 
      if (!models.User) { // Added validation for User model
        throw new AppError('User model is required for association', 500);
      }
      Course.belongsTo(models.User, {
        as: 'instructor',
        foreignKey: 'instructor_id'
      });
      Course.hasMany(models.Lesson, {
        as: 'lessons',
        foreignKey: 'course_id'
      });
    }
  }

  Course.init({
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    level: {
      type: DataTypes.ENUM(...levels),
      allowNull: false,
    },
    thumbnail_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    total_hours: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    instructor_id: { // Changed to match database convention
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Course',
    tableName: 'courses',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Course;
};
