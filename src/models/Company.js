// src/models/Company.js (ADD MISSING FIELD)

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

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
    allowNull: false,
    unique: true
  },
  total_retired: {  // ADD THIS FIELD
    type: DataTypes.DECIMAL(20, 2),
    defaultValue: 0,
    allowNull: false
  }
}, {
  tableName: 'companies',
  timestamps: true
});

module.exports = Company;