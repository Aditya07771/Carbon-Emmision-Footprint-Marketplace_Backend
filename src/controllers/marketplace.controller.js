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
      const { status = 'active' } = req.query;
      const where = status === 'all' ? {} : { status };

      let listings;
      try {
        // Try with project join first
        listings = await Listing.findAll({
          where,
          include: [{
            model: Project,
            as: 'project',
            required: false,
            attributes: ['name', 'location', 'verifier', 'project_type', 'vintage_year', 'ipfs_hash']
          }],
          order: [['createdAt', 'DESC']]
        });
      } catch (joinError) {
        logger.warn('Project join failed, falling back to listings without project data:', joinError.message);
        // Fallback: return listings without project data
        listings = await Listing.findAll({
          where,
          order: [['createdAt', 'DESC']]
        });
      }

      res.json({
        success: true,
        count: listings.length,
        data: listings
      });
    } catch (error) {
      logger.error('Get listings error:', error);
      next(error);
    }
  }

  /**
   * Create a new listing
   * POST /api/marketplace/list
   */
  async createListing(req, res, next) {
    try {
      const { asaId, sellerWallet, priceAlgo, co2Tonnes, vintageYear } = req.body;

      // Validation
      if (!asaId || !sellerWallet || !priceAlgo) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: asaId, sellerWallet, priceAlgo'
        });
      }

      // Verify seller owns the asset
      const ownsAsset = await indexerService.walletOwnsAsset(sellerWallet, asaId);

      if (!ownsAsset) {
        return res.status(400).json({
          success: false,
          error: 'You do not own this asset or have insufficient balance'
        });
      }

      // Check for existing active listing
      const existingListing = await Listing.findOne({
        where: { asa_id: asaId, status: 'active' }
      });

      if (existingListing) {
        return res.status(400).json({
          success: false,
          error: 'This credit is already listed'
        });
      }

      // Create listing
      const listing = await Listing.create({
        asa_id: parseInt(asaId),
        seller_wallet: sellerWallet,
        price_algo: parseFloat(priceAlgo),
        co2_tonnes: co2Tonnes,
        vintage_year: vintageYear,
        status: 'active'
      });

      logger.success(`✅ Listing created: ASA ${asaId} for ${priceAlgo} ALGO`);

      res.status(201).json({
        success: true,
        data: listing
      });
    } catch (error) {
      logger.error('Create listing error:', error);
      next(error);
    }
  }

  /**
   * Purchase a credit
   * POST /api/marketplace/buy
   */
  async buyCredit(req, res, next) {
    try {
      const {
        txnHash,
        buyerWallet,
        asaId,
        priceAlgo,
        sellerWallet,
        optInTxnHash
      } = req.body;

      // Validation
      if (!txnHash || !buyerWallet || !asaId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: txnHash, buyerWallet, asaId'
        });
      }

      logger.info(`📦 Processing purchase: ASA ${asaId} by ${buyerWallet}`);

      // Find the listing
      const listing = await Listing.findOne({
        where: { asa_id: parseInt(asaId), status: 'active' },
        include: [{ model: Project, as: 'project' }]
      });

      if (!listing) {
        return res.status(404).json({
          success: false,
          error: 'Listing not found or already sold'
        });
      }

      // Verify the payment transaction
      logger.info(`🔍 Verifying payment transaction: ${txnHash}`);

      let verification = await algorandService.verifyTransaction(txnHash);

      // If not confirmed, wait a bit and retry
      if (!verification.confirmed) {
        logger.info('⏳ Transaction not confirmed, waiting...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        verification = await algorandService.verifyTransaction(txnHash);
      }

      if (!verification.confirmed) {
        return res.status(400).json({
          success: false,
          error: 'Payment transaction not confirmed on blockchain',
          details: verification.error
        });
      }

      logger.success(`✅ Payment verified at round ${verification.round}`);

      // Verify transaction details
      if (verification.sender !== buyerWallet) {
        logger.warn(`⚠️ Sender mismatch: expected ${buyerWallet}, got ${verification.sender}`);
      }

      if (verification.receiver !== listing.seller_wallet) {
        logger.warn(`⚠️ Receiver mismatch: expected ${listing.seller_wallet}, got ${verification.receiver}`);
      }

      // Verify amount (allow 1% tolerance for fees)
      if (priceAlgo) {
        const expectedAmount = parseFloat(priceAlgo);
        const actualAmount = verification.amount;
        const tolerance = expectedAmount * 0.01;

        if (Math.abs(actualAmount - expectedAmount) > tolerance) {
          logger.warn(`⚠️ Amount mismatch: expected ${expectedAmount}, got ${actualAmount}`);
        }
      }

      // Update listing to sold
      listing.status = 'sold';
      listing.buyer_wallet = buyerWallet;
      listing.txn_hash = txnHash;
      listing.sold_at = new Date();
      await listing.save();

      logger.success(`✅ Listing marked as sold`);

      // Update project status
      if (listing.project) {
        await Project.update(
          {
            status: 'sold',
            current_owner: buyerWallet
          },
          { where: { asa_id: parseInt(asaId) } }
        );
        logger.success(`✅ Project ownership transferred`);
      }

      res.json({
        success: true,
        message: 'Purchase completed successfully',
        data: {
          listingId: listing.id,
          asaId: listing.asa_id,
          txnHash,
          optInTxnHash,
          confirmedRound: verification.round,
          explorerUrl: `https://testnet.algoexplorer.io/tx/${txnHash}`,
          seller: listing.seller_wallet,
          buyer: buyerWallet,
          price: listing.price_algo
        }
      });
    } catch (error) {
      logger.error('❌ Buy credit error:', error);
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

      if (!asaId || !sellerWallet) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: asaId, sellerWallet'
        });
      }

      const listing = await Listing.findOne({
        where: {
          asa_id: parseInt(asaId),
          seller_wallet: sellerWallet,
          status: 'active'
        }
      });

      if (!listing) {
        return res.status(404).json({
          success: false,
          error: 'Active listing not found'
        });
      }

      listing.status = 'cancelled';
      await listing.save();

      logger.info(`🚫 Listing cancelled: ASA ${asaId}`);

      res.json({
        success: true,
        message: 'Listing cancelled successfully'
      });
    } catch (error) {
      logger.error('Cancel listing error:', error);
      next(error);
    }
  }
}

module.exports = new MarketplaceController();