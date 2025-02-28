'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const columnExists = await queryInterface.describeTable('Achievements').then(table => table.userId !== undefined);
    if (columnExists) {
        await queryInterface.removeColumn('Achievements', 'userId');
    }

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('Achievements', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    });
  }
};
