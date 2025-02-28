const { Sequelize } = require('sequelize');

console.log('Database User:', process.env.DB_USER);
console.log('Database Name:', process.env.DB_NAME);
console.log('Database Password:', process.env.DB_PASSWORD);
console.log('Database Host:', process.env.DB_HOST);
console.log('Database Port:', process.env.DB_PORT);

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {

  host: process.env.DB_HOST,
  dialect: 'mysql', // Change to MySQL
  port: process.env.DB_PORT || 3306, // Default MySQL port
});

module.exports = {
  sequelize, // Export the sequelize instance
};
