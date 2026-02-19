// src/controllers/retirement.controller.js

const Retirement = require('../models/Retirement');
const Company = require('../models/Company');
const Project = require('../models/Project');
const algorandService = require('../services/algorand.service');
const ipfsService = require('../services/ipfs.service');
const logger = require('../utils/logger');

class RetirementController {
  /**
   * Retire carbon credits
   * POST /api/credits/retire
   */
  async retireCredits(req, res, next) {
    try {
      const {
        txnHash,
        companyWallet,
        companyName,
        asaId,
        tonnes,
        certificateId
      } = req.body;

      // Verify retirement transaction
      const verification = await algorandService.verifyTransaction(txnHash);
      
      if (!verification.confirmed) {
        return res.status(400).json({
          success: false,
          error: 'Retirement transaction not confirmed'
        });
      }

      // Get project details
      const project = await Project.findOne({ where: { asa_id: asaId } });
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }

      // Get or create company
      let company = await Company.findOne({
        where: { wallet_address: companyWallet }
      });

      if (!company) {
        company = await Company.create({
          name: companyName,
          wallet_address: companyWallet
        });
      }

      // Upload retirement certificate to IPFS
      const ipfsHash = await ipfsService.uploadRetirementCertificate({
        certificateId,
        companyName,
        companyWallet,
        projectName: project.name,
        tonnes,
        asaId,
        txnHash,
        verifier: project.verifier,
        vintageYear: project.vintage_year,
        projectType: project.project_type
      });

      // Save retirement
      const retirement = await Retirement.create({
        company_id: company.id,
        asa_id: asaId,
        tonnes,
        txn_hash: txnHash,
        certificate_id: certificateId,
        ipfs_certificate: ipfsHash
      });

      // Update company stats
      company.total_retired += tonnes;
      await company.save();

      // Update project status
      project.status = 'retired';
      await project.save();

      logger.info(`✅ Credits retired: ${tonnes} tonnes by ${companyName}`);

      res.status(201).json({
        success: true,
        data: {
          retirementId: retirement.id,
          certificate: {
            ipfsHash,
            ipfsUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
            blockchainProof: `https://testnet.algoexplorer.io/tx/${txnHash}`,
            tonnes,
            retiredAt: retirement.retired_at
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all retirements
   * GET /api/retirements
   */
  async getAllRetirements(req, res, next) {
    try {
      const retirements = await Retirement.findAll({
        include: [
          {
            model: Company,
            as: 'company',
            attributes: ['name', 'wallet_address']
          },
          {
            model: Project,
            as: 'project',
            attributes: ['name', 'project_type', 'verifier', 'vintage_year']
          }
        ],
        order: [['retired_at', 'DESC']]
      });

      const totalTonnes = retirements.reduce(
        (sum, r) => sum + r.tonnes, 0
      );

      res.json({
        success: true,
        count: retirements.length,
        totalTonnes,
        data: retirements
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify retirement certificate
   * GET /api/retirements/verify/:certificateId
   */
  async verifyCertificate(req, res, next) {
    try {
      const { certificateId } = req.params;

      const retirement = await Retirement.findOne({
        where: { certificate_id: certificateId },
        include: [
          { model: Company, as: 'company' },
          { model: Project, as: 'project' }
        ]
      });

      if (!retirement) {
        return res.status(404).json({
          success: false,
          error: 'Certificate not found'
        });
      }

      // Verify on blockchain
      const verification = await algorandService.verifyTransaction(
        retirement.txn_hash
      );

      res.json({
        success: true,
        data: {
          ...retirement.toJSON(),
          blockchainVerification: verification,
          certificateUrl: `https://gateway.pinata.cloud/ipfs/${retirement.ipfs_certificate}`
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RetirementController();