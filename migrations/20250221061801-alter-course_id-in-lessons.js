'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Lessons', 'course_id', {
      type: Sequelize.INTEGER,
      allowNull: true // Allow null values
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Lessons', 'course_id', {
      type: Sequelize.INTEGER,
      allowNull: false // Revert to not allowing null values
    });
  }
};
