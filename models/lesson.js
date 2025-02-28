const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Lesson extends Model {
    static associate(models) {
      Lesson.belongsTo(models.Course, {
        foreignKey: 'course_id',
        as: 'course'
      });
      Lesson.belongsToMany(models.User, {
        through: models.UserProgress,
        as: 'completedBy',
        foreignKey: 'lesson_id'
      });
    }
  }

  Lesson.init({
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    video_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    order_index: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'courses',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Lesson',
    tableName: 'lessons',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Lesson;
};
