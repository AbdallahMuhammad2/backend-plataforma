'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const columnExists = await queryInterface.describeTable('Achievements');
    if (!columnExists.criteria) {
      await queryInterface.addColumn('Achievements', 'criteria', {
        type: Sequelize.STRING,
        allowNull: false,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Achievements', 'criteria');
  }
};