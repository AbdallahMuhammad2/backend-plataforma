const { Sequelize } = require('sequelize');
require('dotenv').config({ path: './backend/.env.production' }); // Load environment variables

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  logging: console.log,
  host: process.env.DB_HOST,
  dialect: 'mysql',
  port: process.env.DB_PORT || 3306,
});

async function listTables() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    const [results, metadata] = await sequelize.query("SHOW TABLES;");
    console.log('Existing tables:', results);
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  } finally {
    await sequelize.close();
  }
}

listTables();
