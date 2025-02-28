const { Sequelize } = require('sequelize');
require('dotenv').config({ path: './backend/.env.production' }); // Load environment variables

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  logging: console.log,
  host: process.env.DB_HOST,
  dialect: 'mysql',
  port: process.env.DB_PORT || 3306,
});

async function dropTables() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // Drop duplicate tables
    await sequelize.query("DROP TABLE IF EXISTS Courses;");
    await sequelize.query("DROP TABLE IF EXISTS Achievements;");
    await sequelize.query("DROP TABLE IF EXISTS Lessons;");
    await sequelize.query("DROP TABLE IF EXISTS UserAchievements;");
    await sequelize.query("DROP TABLE IF EXISTS UserProgresses;");
    await sequelize.query("DROP TABLE IF EXISTS Users;");

    console.log('Duplicate tables dropped successfully!');
  } catch (error) {
    console.error('Unable to connect to the database or drop tables:', error);
  } finally {
    await sequelize.close();
  }
}

dropTables();
