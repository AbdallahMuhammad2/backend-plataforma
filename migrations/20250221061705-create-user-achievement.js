'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserAchievements', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      achievementId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Achievements',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      unlockedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add unique constraint to prevent duplicate user-achievement pairs
    await queryInterface.addConstraint('UserAchievements', {
      fields: ['userId', 'achievementId'],
      type: 'unique',
      name: 'unique_user_achievement'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('UserAchievements');
  }
};
