// src/controllers/marketplace.controller.js

const { Listing, Project } = require('../models');
const algorandService = require('../services/algorand.service');
const indexerService = require('../services/indexer.service');
const logger = require('../utils/logger');

class MarketplaceController {
  /**
   * Get all active listings
   * GET /api/marketplace
   */
  async getListings(req, res, next) {
    try {
      const listings = await Listing.findAll({
        where: { status: 'active' },
        include: [{
          model: Project,
          as: 'project',
          attributes: ['name', 'location', 'verifier', 'project_type', 'vintage_year', 'ipfs_hash']
        }],
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        count: listings.length,
        data: listings
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new listing
   * POST /api/marketplace/list
   */
  async createListing(req, res, next) {
    try {
      const {
        asaId,
        sellerWallet,
        priceAlgo,
        co2Tonnes,
        vintageYear
      } = req.body;

      // Verify seller owns the asset
      const assets = await indexerService.getWalletAssets(sellerWallet);
      const ownsAsset = assets.find(a => a['asset-id'] === parseInt(asaId));

      if (!ownsAsset || ownsAsset.amount === 0) {
        return res.status(400).json({
          success: false,
          error: 'Seller does not own this credit'
        });
      }

      // Create listing
      const listing = await Listing.create({
        asa_id: asaId,
        seller_wallet: sellerWallet,
        price_algo: priceAlgo,
        co2_tonnes: co2Tonnes,
        vintage_year: vintageYear
      });

      logger.info(`✅ Listing created: ASA ${asaId} for ${priceAlgo} ALGO`);

      res.status(201).json({
        success: true,
        data: listing
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Purchase a credit
   * POST /api/marketplace/buy
   */
  async buyCredit(req, res, next) {
    try {
      const { txnHash, buyerWallet, asaId } = req.body;

      // Verify transaction on blockchain
      const verification = await algorandService.verifyTransaction(txnHash);

      if (!verification.confirmed) {
        return res.status(400).json({
          success: false,
          error: 'Transaction not confirmed on blockchain'
        });
      }

      // Update listing status
      const listing = await Listing.findOne({
        where: { asa_id: asaId, status: 'active' }
      });

      if (!listing) {
        return res.status(404).json({
          success: false,
          error: 'Listing not found or already sold'
        });
      }

      listing.status = 'sold';
      listing.txn_hash = txnHash;
      await listing.save();

      // Update project status
      await Project.update(
        { status: 'sold' },
        { where: { asa_id: asaId } }
      );

      logger.info(`✅ Credit purchased: ASA ${asaId} by ${buyerWallet}`);

      res.json({
        success: true,
        data: {
          txnHash,
          explorerUrl: `https://testnet.algoexplorer.io/tx/${txnHash}`
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel listing
   * POST /api/marketplace/cancel
   */
  async cancelListing(req, res, next) {
    try {
      const { asaId, sellerWallet } = req.body;

      const listing = await Listing.findOne({
        where: {
          asa_id: asaId,
          seller_wallet: sellerWallet,
          status: 'active'
        }
      });

      if (!listing) {
        return res.status(404).json({
          success: false,
          error: 'Listing not found'
        });
      }

      listing.status = 'cancelled';
      await listing.save();

      res.json({
        success: true,
        message: 'Listing cancelled successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MarketplaceController();