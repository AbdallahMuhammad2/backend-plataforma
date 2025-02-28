const { Sequelize } = require('sequelize');
require('dotenv').config({ path: './backend/.env.production' }); // Load environment variables

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  logging: console.log,
  host: process.env.DB_HOST,
  dialect: 'mysql',
  port: process.env.DB_PORT || 3306,
});

async function listForeignKeys() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // List foreign keys for relevant tables
    const [results, metadata] = await sequelize.query(`
      SELECT 
        TABLE_NAME, 
        CONSTRAINT_NAME, 
        REFERENCED_TABLE_NAME, 
        REFERENCED_COLUMN_NAME 
      FROM 
        information_schema.KEY_COLUMN_USAGE 
      WHERE 
        TABLE_SCHEMA = '${process.env.DB_NAME}' 
        AND (TABLE_NAME = 'UserAchievements' OR TABLE_NAME = 'UserProgresses' OR TABLE_NAME = 'Lessons');
    `);
    
    console.log('Foreign Keys:', results);
  } catch (error) {
    console.error('Unable to connect to the database or list foreign keys:', error);
  } finally {
    await sequelize.close();
  }
}

listForeignKeys();
