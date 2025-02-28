#!/usr/bin/env node
require('dotenv').config();
const { sequelize } = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

async function initializeDatabase() {
  try {
    // Check if the database exists
    const dbName = process.env.DB_NAME;
    const [results] = await sequelize.query(`SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '${dbName}'`);

    if (results.length === 0) {
      await sequelize.query(`CREATE DATABASE \`${dbName}\`;`);
      console.log(`✅ Database "${dbName}" created`);
    } else {
      console.log(`✅ Database "${dbName}" already exists`);
    }

    // Read and execute schema.sql
    console.log('📦 Creating tables...');
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schemaSql = await fs.readFile(schemaPath, 'utf8');
    await sequelize.query(schemaSql);
    console.log('✅ Tables created successfully');

    // Create necessary directories
    const dirs = [
      path.join(__dirname, '..', 'uploads'),
      path.join(__dirname, '..', 'uploads', 'writings'),
      path.join(__dirname, '..', 'uploads', 'avatars'),
      path.join(__dirname, '..', 'uploads', 'materials'),
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
    console.log('✅ Upload directories created');

    console.log(`🚀 Database initialization completed successfully!`);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeDatabase().catch(console.error);
