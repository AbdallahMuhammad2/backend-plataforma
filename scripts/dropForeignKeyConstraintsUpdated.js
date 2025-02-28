const { Sequelize } = require('sequelize');
require('dotenv').config({ path: './backend/.env.production' }); // Load environment variables

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  logging: console.log,
  host: process.env.DB_HOST,
  dialect: 'mysql',
  port: process.env.DB_PORT || 3306,
});

async function dropForeignKeys() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // Drop foreign key constraints
    await sequelize.query("ALTER TABLE UserAchievements DROP FOREIGN KEY UserAchievements_ibfk_1;");
    await sequelize.query("ALTER TABLE UserAchievements DROP FOREIGN KEY UserAchievements_ibfk_2;");
    await sequelize.query("ALTER TABLE lessons DROP FOREIGN KEY lessons_ibfk_1;");

    console.log('Foreign key constraints dropped successfully!');
  } catch (error) {
    console.error('Unable to connect to the database or drop foreign keys:', error);
  } finally {
    await sequelize.close();
  }
}

dropForeignKeys();
