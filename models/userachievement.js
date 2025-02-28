'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserAchievement extends Model {
    static associate(models) {
      // associations can be defined here
    }
  }
  
  UserAchievement.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    achievementId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Achievements',
        key: 'id'
      }
    },
    unlockedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'UserAchievement',
    tableName: 'user_achievements'

  });

  return UserAchievement;
};
