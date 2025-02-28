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
    await sequelize.query("ALTER TABLE UserAchievements DROP FOREIGN KEY fk_user_achievements;");
    await sequelize.query("ALTER TABLE UserProgresses DROP FOREIGN KEY fk_user_progresses;");
    await sequelize.query("ALTER TABLE Lessons DROP FOREIGN KEY fk_lessons_courses;");

    console.log('Foreign key constraints dropped successfully!');
  } catch (error) {
    console.error('Unable to connect to the database or drop foreign keys:', error);
  } finally {
    await sequelize.close();
  }
}

dropForeignKeys();
