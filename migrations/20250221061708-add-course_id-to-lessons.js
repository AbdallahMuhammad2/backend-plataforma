'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Lessons', 'course_id', {
      type: Sequelize.INTEGER,
      allowNull: false // Set to NOT NULL to ensure every lesson has a course_id
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Lessons', 'course_id');
  }
};
