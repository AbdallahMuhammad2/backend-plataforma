'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const columnExists = await queryInterface.describeTable('Achievements');
    if (!columnExists.createdAt) {
      await queryInterface.addColumn('Achievements', 'createdAt', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      });
    }
    if (!columnExists.updatedAt) {
      await queryInterface.addColumn('Achievements', 'updatedAt', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Achievements', 'createdAt');
    await queryInterface.removeColumn('Achievements', 'updatedAt');
  }
};