const { Sequelize } = require('sequelize');
const config = require('../config/config.json')['production'];

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
});

async function listTables() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    const [results, metadata] = await sequelize.query("SHOW TABLES;");
    console.log('Tables in the database:', results);

    for (const table of results) {
      const tableName = table[`Tables_in_${config.database}`]; // Adjust based on your database name
      const [columns] = await sequelize.query(`SHOW COLUMNS FROM ${tableName};`);
      console.log(`Columns in table ${tableName}:`, columns);
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  } finally {
    await sequelize.close();
  }
}

listTables();
