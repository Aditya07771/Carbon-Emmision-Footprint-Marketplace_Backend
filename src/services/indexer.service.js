// src/services/indexer.service.js

const { indexerClient, appIds } = require('../config/algorand');
const logger = require('../utils/logger');

class IndexerService {
  /**
   * Get complete transaction history for an asset
   */
  async getAssetTransactions(assetId) {
    try {
      const txns = await indexerClient
        .lookupAssetTransactions(assetId)
        .do();
      
      return txns.transactions.map(txn => ({
        id: txn.id,
        type: txn['tx-type'],
        sender: txn.sender,
        receiver: txn['payment-transaction']?.receiver,
        amount: txn['asset-transfer-transaction']?.amount,
        timestamp: new Date(txn['round-time'] * 1000),
        round: txn['confirmed-round']
      }));
    } catch (error) {
      logger.error(`Error fetching asset transactions for ${assetId}:`, error);
      throw error;
    }
  }

  /**
   * Get all assets owned by a wallet
   */
  async getWalletAssets(address) {
    try {
      const account = await indexerClient
        .lookupAccountAssets(address)
        .do();
      
      return account.assets.filter(asset => asset.amount > 0);
    } catch (error) {
      logger.error(`Error fetching wallet assets for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get all retirement transactions
   */
  async getAllRetirements() {
    try {
      const txns = await indexerClient
        .searchForTransactions()
        .applicationID(appIds.retirement)
        .do();
      
      return txns.transactions;
    } catch (error) {
      logger.error('Error fetching retirements:', error);
      throw error;
    }
  }

  /**
   * Get marketplace activity
   */
  async getMarketplaceActivity() {
    try {
      const txns = await indexerClient
        .searchForTransactions()
        .applicationID(appIds.marketplace)
        .do();
      
      return txns.transactions;
    } catch (error) {
      logger.error('Error fetching marketplace activity:', error);
      throw error;
    }
  }

  /**
   * Search transactions by address
   */
  async getAddressTransactions(address, limit = 100) {
    try {
      const txns = await indexerClient
        .searchForTransactions()
        .address(address)
        .limit(limit)
        .do();
      
      return txns.transactions;
    } catch (error) {
      logger.error(`Error fetching transactions for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get credit provenance (full lifecycle)
   */
  async getCreditProvenance(assetId) {
    try {
      const txns = await this.getAssetTransactions(assetId);
      const assetInfo = await indexerClient.lookupAssetByID(assetId).do();
      
      return {
        assetId,
        creator: assetInfo.asset.params.creator,
        created: new Date(assetInfo.asset['created-at-round'] * 1000),
        transactions: txns,
        currentHolder: txns[txns.length - 1]?.receiver || null
      };
    } catch (error) {
      logger.error(`Error fetching provenance for ${assetId}:`, error);
      throw error;
    }
  }
}

module.exports = new IndexerService();