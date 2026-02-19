// src/models/Retirement.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Retirement = sequelize.define('Retirement', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
company_id: {
  type: DataTypes.UUID,
  allowNull: false
},

  asa_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  tonnes: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  txn_hash: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  certificate_id: {
    type: DataTypes.STRING,
    unique: true
  },
  ipfs_certificate: {
    type: DataTypes.STRING
  },
  retired_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

module.exports = Retirement;