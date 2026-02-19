// src/models/Listing.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Listing = sequelize.define('Listing', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  asa_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  seller_wallet: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price_algo: {
    type: DataTypes.DECIMAL(20, 6),
    allowNull: false
  },
  co2_tonnes: {
    type: DataTypes.INTEGER
  },
  vintage_year: {
    type: DataTypes.INTEGER
  },
  status: {
    type: DataTypes.ENUM('active', 'sold', 'cancelled'),
    defaultValue: 'active'
  },
  txn_hash: {
    type: DataTypes.STRING
  }
});

module.exports = Listing;