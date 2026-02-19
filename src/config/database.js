// src/config/database.js

const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

// Test connection
sequelize.authenticate()
  .then(() => logger.info('✅ Database connected successfully'))
  .catch(err => logger.error('❌ Database connection failed:', err));

module.exports = sequelize;