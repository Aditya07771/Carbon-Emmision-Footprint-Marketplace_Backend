// src/services/algorand.service.js

const algosdk = require('algosdk');
const { algodClient, indexerClient, platformAccount, appIds } = require('../config/algorand');
const logger = require('../utils/logger');

class AlgorandService {
  /**
   * Get account information
   */
  async getAccountInfo(address) {
    try {
      const info = await algodClient.accountInformation(address).do();
      return {
        address,
        balance: info.amount / 1_000_000, // Convert to ALGO
        assets: info.assets || []
      };
    } catch (error) {
      logger.error('Error fetching account info:', error);
      throw error;
    }
  }

  /**
   * Get asset (NFT) information
   */
  async getAssetInfo(assetId) {
    try {
      const info = await algodClient.getAssetByID(assetId).do();
      return {
        assetId,
        creator: info.params.creator,
        total: info.params.total,
        decimals: info.params.decimals,
        unitName: info.params['unit-name'],
        name: info.params.name,
        url: info.params.url,
        reserve: info.params.reserve
      };
    } catch (error) {
      logger.error(`Error fetching asset ${assetId}:`, error);
      throw error;
    }
  }

  /**
   * Verify a transaction was confirmed
   */
  async verifyTransaction(txnHash) {
    try {
      const txn = await algodClient.pendingTransactionInformation(txnHash).do();
      
      if (txn['confirmed-round']) {
        return {
          confirmed: true,
          round: txn['confirmed-round'],
          timestamp: new Date()
        };
      }
      
      return { confirmed: false };
    } catch (error) {
      logger.error(`Error verifying transaction ${txnHash}:`, error);
      return { confirmed: false, error: error.message };
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForConfirmation(txnHash, timeout = 10) {
    const start = Date.now();
    
    while (Date.now() - start < timeout * 1000) {
      const result = await this.verifyTransaction(txnHash);
      if (result.confirmed) return result;
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Transaction confirmation timeout');
  }

  /**
   * Get application (smart contract) info
   */
  async getApplicationInfo(appId) {
    try {
      const app = await algodClient.getApplicationByID(appId).do();
      return app;
    } catch (error) {
      logger.error(`Error fetching app ${appId}:`, error);
      throw error;
    }
  }
}

module.exports = new AlgorandService();