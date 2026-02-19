// src/config/algorand.js

const algosdk = require('algosdk');
const logger = require('../utils/logger');

const algodClient = new algosdk.Algodv2(
  '',
  process.env.ALGORAND_NODE,
  443
);

const indexerClient = new algosdk.Indexer(
  '',
  process.env.ALGORAND_INDEXER,
  443
);

// Test connection
algodClient.status().do()
  .then(status => {
    logger.info('✅ Algorand node connected');
    logger.info(`   Network: ${process.env.ALGORAND_NETWORK}`);
    logger.info(`   Round: ${status['last-round']}`);
  })
  .catch(err => logger.error('❌ Algorand connection failed:', err));

// Platform wallet
const platformAccount = algosdk.mnemonicToSecretKey(
  process.env.PLATFORM_WALLET_MNEMONIC
);

module.exports = {
  algodClient,
  indexerClient,
  platformAccount,
  appIds: {
    issuance: parseInt(process.env.ISSUANCE_APP_ID),
    marketplace: parseInt(process.env.MARKETPLACE_APP_ID),
    retirement: parseInt(process.env.RETIREMENT_APP_ID)
  }
};