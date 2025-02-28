'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define many-to-many relationship with Achievement through UserAchievement
      User.belongsToMany(models.Achievement, {
        through: models.UserAchievement,
        as: 'achievements',
        foreignKey: 'userId'
      });

      // Define many-to-many relationship with Lesson through UserProgress
      User.belongsToMany(models.Lesson, {
        through: models.UserProgress,
        as: 'completedLessons',
        foreignKey: 'userId'
      });

      // Define one-to-many relationship with Course (as instructor)
      User.hasMany(models.Course, {
        foreignKey: 'instructorId',
        as: 'instructedCourses'
      });
    }
  }
  User.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false
    },

    avatarUrl: DataTypes.STRING,
    bio: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};
