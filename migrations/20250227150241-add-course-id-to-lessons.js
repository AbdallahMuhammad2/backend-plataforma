'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('lessons');
    if (!tableInfo.course_id) {
      await queryInterface.addColumn('lessons', 'course_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'courses', // Ensure this name matches your model
          key: 'id'
        }
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('lessons', 'course_id');
  }
};
