// src/controllers/company.controller.js (FIX IMPORTS)

const Company = require('../models/Company');
const Retirement = require('../models/Retirement');
const Project = require('../models/Project'); // ADD THIS LINE
const indexerService = require('../services/indexer.service');
const logger = require('../utils/logger');

class CompanyController {
  /**
   * Get company dashboard
   * GET /api/company/:walletAddress
   */
  async getDashboard(req, res, next) {
    try {
      const { walletAddress } = req.params;

      // Get company
      const company = await Company.findOne({
        where: { wallet_address: walletAddress }
      });

      if (!company) {
        return res.status(404).json({
          success: false,
          error: 'Company not found'
        });
      }

      // Get retirements
      const retirements = await Retirement.findAll({
        where: { company_id: company.id },
        include: [{
          model: Project,
          as: 'project',
          attributes: ['name', 'location', 'project_type', 'verifier']
        }],
        order: [['retired_at', 'DESC']]
      });

      // Get current credits from blockchain
      const currentCredits = await indexerService.getWalletAssets(walletAddress);

      res.json({
        success: true,
        data: {
          company: company.toJSON(),
          totalTonnesOffset: company.total_retired,
          retirements: retirements.map(r => ({
            ...r.toJSON(),
            certificateUrl: `https://gateway.pinata.cloud/ipfs/${r.ipfs_certificate}`,
            blockchainProof: `https://testnet.algoexplorer.io/tx/${r.txn_hash}`
          })),
          currentCredits
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Public explorer
   * GET /api/explorer/public/:walletAddress
   */
  async publicExplorer(req, res, next) {
    try {
      const { walletAddress } = req.params;

      const company = await Company.findOne({
        where: { wallet_address: walletAddress }
      });

      const retirements = company 
        ? await Retirement.findAll({
            where: { company_id: company.id },
            include: [{
              model: Project,
              as: 'project'
            }],
            order: [['retired_at', 'DESC']]
          })
        : [];

      const totalTonnesRetired = retirements.reduce((sum, r) => sum + parseFloat(r.tonnes || 0), 0);

      res.json({
        success: true,
        data: {
          company: company?.name || 'Unknown',
          walletAddress,
          totalTonnesRetired,
          retirements: retirements.map(r => ({
            tonnes: r.tonnes,
            retiredAt: r.retired_at,
            project: r.project?.name || 'Unknown Project',
            verifier: r.project?.verifier || 'Unknown',
            blockchainProof: `https://testnet.algoexplorer.io/tx/${r.txn_hash}`,
            certificate: r.ipfs_certificate 
              ? `https://gateway.pinata.cloud/ipfs/${r.ipfs_certificate}` 
              : null
          }))
        }
      });
    } catch (error) {
      logger.error('Public Explorer Error:', error);
      next(error);
    }
  }
}

module.exports = new CompanyController();