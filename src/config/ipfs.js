// src/config/ipfs.js

const pinataSDK = require('@pinata/sdk');
const logger = require('../utils/logger');

const pinata = new pinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_SECRET_KEY
);

// Test connection
pinata.testAuthentication()
  .then(() => logger.info('✅ IPFS (Pinata) connected'))
  .catch(err => logger.error('❌ Pinata connection failed:', err));

module.exports = pinata;