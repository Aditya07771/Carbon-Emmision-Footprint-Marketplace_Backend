// src/config/database.js
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// Fallback to prevent immediate crash if env var is missing during build step
const dbUrl = process.env.DATABASE_URL || 'postgres://user:pass@localhost:5432/dummy';

const sequelize = new Sequelize(dbUrl, {
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

module.exports = sequelize;