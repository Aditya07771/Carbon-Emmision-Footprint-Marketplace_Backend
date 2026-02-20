// src/services/algorand.service.js

const algosdk = require('algosdk');
const logger = require('../utils/logger');

const algodClient = new algosdk.Algodv2(
  '',
  process.env.ALGOD_SERVER || 'https://testnet-api.algonode.cloud',
  ''
);

class AlgorandService {
  /**
   * Verify a transaction on the blockchain
   */
  async verifyTransaction(txnHash) {
    try {
      logger.info(`🔍 Verifying transaction: ${txnHash}`);

      // Get transaction info
      const txnInfo = await algodClient.pendingTransactionInformation(txnHash).do();

      // Check if confirmed
      const confirmedRound = txnInfo['confirmed-round'];
      if (!confirmedRound || confirmedRound === 0) {
        logger.warn(`Transaction ${txnHash} not yet confirmed`);
        return {
          confirmed: false,
          error: 'Transaction not confirmed yet'
        };
      }

      // Extract transaction details
      const txn = txnInfo.txn?.txn || txnInfo;
      
      const sender = txn.snd ? algosdk.encodeAddress(txn.snd) : null;
      const receiver = txn.rcv ? algosdk.encodeAddress(txn.rcv) : null;
      const amount = txn.amt || 0;

      logger.info(`✅ Transaction verified at round ${confirmedRound}`);

      return {
        confirmed: true,
        round: confirmedRound,
        sender,
        receiver,
        amount: amount / 1_000_000, // Convert microAlgos to Algos
        amountMicroAlgos: amount,
        txn: txnInfo
      };
    } catch (error) {
      logger.error(`❌ Transaction verification failed: ${error.message}`);
      
      // If transaction not found in pending pool, try to get it from confirmed transactions
      try {
        const indexerClient = new algosdk.Indexer(
          '',
          process.env.INDEXER_SERVER || 'https://testnet-idx.algonode.cloud',
          ''
        );
        
        const txnResult = await indexerClient.lookupTransactionByID(txnHash).do();
        const txn = txnResult.transaction;

        if (!txn) {
          return {
            confirmed: false,
            error: 'Transaction not found'
          };
        }

        const sender = txn.sender;
        const receiver = txn['payment-transaction']?.receiver;
        const amount = txn['payment-transaction']?.amount || 0;

        return {
          confirmed: true,
          round: txn['confirmed-round'],
          sender,
          receiver,
          amount: amount / 1_000_000,
          amountMicroAlgos: amount,
          txn: txnResult
        };
      } catch (indexerError) {
        logger.error(`❌ Indexer lookup failed: ${indexerError.message}`);
        return {
          confirmed: false,
          error: error.message || 'Transaction verification failed'
        };
      }
    }
  }

  /**
   * Get asset information
   */
  async getAssetInfo(assetId) {
    try {
      const assetInfo = await algodClient.getAssetByID(assetId).do();
      return {
        id: assetInfo.index,
        params: assetInfo.params,
        createdAtRound: assetInfo['created-at-round']
      };
    } catch (error) {
      logger.error(`Failed to get asset info for ${assetId}:`, error);
      throw new Error(`Asset ${assetId} not found on blockchain`);
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForConfirmation(txId, timeout = 10) {
    try {
      const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, timeout);
      return {
        confirmed: true,
        round: confirmedTxn['confirmed-round']
      };
    } catch (error) {
      logger.error(`Confirmation timeout for ${txId}`);
      return {
        confirmed: false,
        error: 'Confirmation timeout'
      };
    }
  }
}

module.exports = new AlgorandService();