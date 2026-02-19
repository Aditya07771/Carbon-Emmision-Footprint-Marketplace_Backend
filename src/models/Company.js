// src/models/Company.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // 👈 IMPORT INSTANCE

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  wallet_address: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'companies',
  timestamps: true
});

module.exports = Company;
