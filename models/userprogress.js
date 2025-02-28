const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserProgress extends Model {
    static associate(models) {
      // associations are defined in User and Lesson models
    }
  }

  UserProgress.init({
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    lesson_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'lessons',
        key: 'id'
      }
    },
    completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'UserProgress',
    tableName: 'user_progress',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return UserProgress;
};
