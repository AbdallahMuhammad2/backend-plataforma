#!/usr/bin/env node
require('dotenv').config();
const { sequelize } = require('../config/database');
const fs = require('fs').promises;
const { sequelize } = require('../config/database');
const { Umzug, SequelizeStorage } = require('umzug');

const path = require('path');

const umzug = new Umzug({
  migrations: { glob: 'migrations/*.js' },
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

async function migrateDatabase() {
  await umzug.up();

  try {
    console.log('✅ Database migration completed successfully.');

    console.log('✅ Database migration completed successfully.');
  } catch (error) {
    console.error('❌ Error during migration:', error);
  }
}

migrateDatabase();
