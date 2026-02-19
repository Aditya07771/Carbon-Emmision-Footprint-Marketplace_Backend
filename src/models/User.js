// src/models/User.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  wallet_address: {
    type: DataTypes.STRING(58),
    allowNull: false,
    unique: true
  },
  
  // Role: 'ngo', 'business', 'admin', 'public'
  role: {
    type: DataTypes.ENUM('public', 'ngo', 'business', 'admin'),
    defaultValue: 'public'
  },
  
  // Status: pending, approved, rejected
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'none'),
    defaultValue: 'none'
  },
  
  // Common Fields
  organization_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: { isEmail: true }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // NGO Specific Fields
  registration_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ngo_type: {
    type: DataTypes.STRING, // Environmental, Conservation, etc.
    allowNull: true
  },
  operating_regions: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: []
  },
  certifications: {
    type: DataTypes.ARRAY(DataTypes.STRING), // Verra, Gold Standard certified
    allowNull: true,
    defaultValue: []
  },
  
  // Business Specific Fields
  company_type: {
    type: DataTypes.STRING, // Corporation, SME, Startup
    allowNull: true
  },
  industry: {
    type: DataTypes.STRING,
    allowNull: true
  },
  employee_count: {
    type: DataTypes.STRING, // '1-10', '11-50', '51-200', '200+'
    allowNull: true
  },
  annual_revenue: {
    type: DataTypes.STRING, // Optional range
    allowNull: true
  },
  sustainability_goals: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // Documents (IPFS hashes)
  logo_ipfs: {
    type: DataTypes.STRING,
    allowNull: true
  },
  registration_doc_ipfs: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  // Admin fields
  reviewed_by: {
    type: DataTypes.UUID,
    allowNull: true
  },
  reviewed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true
});

module.exports = User;