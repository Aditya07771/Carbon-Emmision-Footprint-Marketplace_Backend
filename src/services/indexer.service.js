// src/services/indexer.service.js

const algosdk = require('algosdk');
const logger = require('../utils/logger');

const indexerClient = new algosdk.Indexer(
  '',
  process.env.INDEXER_SERVER || 'https://testnet-idx.algonode.cloud',
  ''
);

class IndexerService {
  /**
   * Check if a wallet owns a specific asset with balance > 0
   */
  async walletOwnsAsset(address, assetId) {
    try {
      const result = await indexerClient
        .lookupAccountAssets(address)
        .assetId(parseInt(assetId))
        .do();

      const asset = result.assets?.find(
        a => a['asset-id'] === parseInt(assetId)
      );

      return asset && asset.amount > 0;
    } catch (error) {
      logger.error(`Error checking asset ownership for ${address}:`, error);
      // If the indexer returns 404 (asset not opted in), treat as not owning
      return false;
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
   * Get marketplace activity (by app ID)
   */
  async getMarketplaceActivity() {
    try {
      const appId = parseInt(process.env.MARKETPLACE_APP_ID);
      if (!appId) return [];

      const txns = await indexerClient
        .searchForTransactions()
        .applicationID(appId)
        .do();

      return txns.transactions;
    } catch (error) {
      logger.error('Error fetching marketplace activity:', error);
      return [];
    }
  }

  /**
   * Get all retirement transactions (by app ID)
   */
  async getAllRetirements() {
    try {
      const appId = parseInt(process.env.RETIREMENT_APP_ID);
      if (!appId) return [];

      const txns = await indexerClient
        .searchForTransactions()
        .applicationID(appId)
        .do();

      return txns.transactions;
    } catch (error) {
      logger.error('Error fetching retirements:', error);
      return [];
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