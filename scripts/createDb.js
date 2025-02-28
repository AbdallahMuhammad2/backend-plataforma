#!/usr/bin/env node
require('dotenv').config();
const mysql = require('mysql2');
const fs = require('fs').promises;

async function createDatabase() {
  const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
  });

  const dbName = process.env.DB_NAME || 'plataforma_video_dev';

  connection.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL server.');

    connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`, (err) => {
      if (err) throw err;
      console.log(`Database ${dbName} created or already exists.`);
      connection.end();
    });
  });
}

createDatabase();
