const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Achievement extends Model {
    static associate(models) {
      // Define many-to-many relationship with User through UserAchievement
      Achievement.belongsToMany(models.User, {
        through: models.UserAchievement,
        as: 'users',
        foreignKey: 'achievementId'
      });
    }
  }

  Achievement.init({
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    criteria: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    achieved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    }
  }, {
    sequelize,
    modelName: 'Achievement',
  });

  return Achievement;
};
