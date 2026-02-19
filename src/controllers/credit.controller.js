// src/controllers/credit.controller.js

const Project = require('../models/Project');
const algorandService = require('../services/algorand.service');
const logger = require('../utils/logger');

class CreditController {
  /**
   * Issue new carbon credits
   * POST /api/credits/issue
   */
  async issueCredits(req, res, next) {
    try {
      const {
        projectId,
        name,
        location,
        projectType,
        verifier,
        co2Tonnes,
        vintageYear,
        asaId,
        issuerWallet,
        ipfsHash,   // ← already uploaded by the frontend before calling this
        description,
      } = req.body;

      // Optional: verify ASA exists on blockchain (can be slow – skip if not needed)
      // const assetInfo = await algorandService.getAssetInfo(asaId);

      // Save to database
      const project = await Project.create({
        project_id: projectId,
        name,
        location,
        project_type: projectType,
        verifier,
        co2_tonnes: co2Tonnes,
        vintage_year: vintageYear,
        asa_id: asaId,
        ipfs_hash: ipfsHash,
        issuer_wallet: issuerWallet,
        description,
      });

      logger.info(`✅ Credits issued: Project ${projectId}, ASA ${asaId}`);

      res.status(201).json({
        success: true,
        data: {
          projectId: project.id,
          asaId,
          ipfsHash,
          ipfsUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
          explorerUrl: `https://testnet.algoexplorer.io/asset/${asaId}`,
        }
      });
    } catch (error) {
      next(error);
    }
  }


  /**
   * Get credit details
   * GET /api/credits/:asaId
   */
  async getCreditDetails(req, res, next) {
    try {
      const { asaId } = req.params;

      // Get from database
      const project = await Project.findOne({ where: { asa_id: asaId } });
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Credit not found'
        });
      }

      // Get blockchain data
      const assetInfo = await algorandService.getAssetInfo(asaId);

      res.json({
        success: true,
        data: {
          ...project.toJSON(),
          blockchain: assetInfo
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all issued credits
   * GET /api/credits
   */
  async getAllCredits(req, res, next) {
    try {
      const { status, verifier, projectType } = req.query;

      const where = {};
      if (status) where.status = status;
      if (verifier) where.verifier = verifier;
      if (projectType) where.project_type = projectType;

      const credits = await Project.findAll({ where });

      res.json({
        success: true,
        count: credits.length,
        data: credits
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CreditController();