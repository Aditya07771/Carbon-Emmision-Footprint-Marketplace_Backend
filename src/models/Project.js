// src/models/Project.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  project_id: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING
  },
  project_type: {
    type: DataTypes.ENUM(
      'Reforestation',
      'Solar',
      'Wind',
      'Biogas',
      'Methane Capture',
      'Ocean Conservation',
      'Other'
    ),
    allowNull: false
  },
  verifier: {
    type: DataTypes.STRING, // "Gold Standard", "Verra", etc.
    allowNull: false
  },
  co2_tonnes: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  vintage_year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  asa_id: {
    type: DataTypes.BIGINT,
    unique: true,
    allowNull: false
  },
  ipfs_hash: {
    type: DataTypes.STRING
  },
  issuer_wallet: {
    type: DataTypes.STRING,
    allowNull: false
  },
  current_owner: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.ENUM('active', 'listed', 'sold', 'retired'),
    defaultValue: 'active'
  }
});

module.exports = Project;