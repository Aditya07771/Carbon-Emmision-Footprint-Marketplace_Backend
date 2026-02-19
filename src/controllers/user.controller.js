// src/controllers/user.controller.js

const { User } = require('../models');
const ipfsService = require('../services/ipfs.service');
const logger = require('../utils/logger');

class UserController {
  
  /**
   * Get user role and status
   * GET /api/users/role/:wallet_address
   */
  async getRole(req, res, next) {
    try {
      const { wallet_address } = req.params;
      
      // Check if admin wallet
      if (wallet_address === process.env.ADMIN_WALLET) {
        return res.json({
          success: true,
          wallet: wallet_address,
          role: 'admin',
          status: 'approved',
          isRegistered: true
        });
      }
      
      // Find user in database
      const user = await User.findOne({
        where: { wallet_address }
      });
      
      if (!user) {
        return res.json({
          success: true,
          wallet: wallet_address,
          role: 'public',
          status: 'none',
          isRegistered: false
        });
      }
      
      res.json({
        success: true,
        wallet: wallet_address,
        role: user.role,
        status: user.status,
        isRegistered: true,
        organizationName: user.organization_name,
        rejectionReason: user.rejection_reason
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Register as NGO
   * POST /api/users/register/ngo
   */
  async registerNgo(req, res, next) {
    try {
      const {
        walletAddress,
        organizationName,
        email,
        phone,
        country,
        website,
        description,
        registrationNumber,
        ngoType,
        operatingRegions,
        certifications
      } = req.body;

      // Check if already registered
      const existing = await User.findOne({
        where: { wallet_address: walletAddress }
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'Wallet already registered'
        });
      }

      // Create NGO registration
      const user = await User.create({
        wallet_address: walletAddress,
        role: 'ngo',
        status: 'pending',
        organization_name: organizationName,
        email,
        phone,
        country,
        website,
        description,
        registration_number: registrationNumber,
        ngo_type: ngoType,
        operating_regions: operatingRegions || [],
        certifications: certifications || []
      });

      logger.info(`📝 NGO Registration submitted: ${organizationName} (${walletAddress})`);

      res.status(201).json({
        success: true,
        message: 'Registration submitted for review',
        data: {
          id: user.id,
          status: user.status,
          organizationName: user.organization_name
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Register as Business
   * POST /api/users/register/business
   */
  async registerBusiness(req, res, next) {
    try {
      const {
        walletAddress,
        organizationName,
        email,
        phone,
        country,
        website,
        description,
        companyType,
        industry,
        employeeCount,
        annualRevenue,
        sustainabilityGoals
      } = req.body;

      // Check if already registered
      const existing = await User.findOne({
        where: { wallet_address: walletAddress }
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'Wallet already registered'
        });
      }

      // Create Business registration
      const user = await User.create({
        wallet_address: walletAddress,
        role: 'business',
        status: 'pending',
        organization_name: organizationName,
        email,
        phone,
        country,
        website,
        description,
        company_type: companyType,
        industry,
        employee_count: employeeCount,
        annual_revenue: annualRevenue,
        sustainability_goals: sustainabilityGoals
      });

      logger.info(`📝 Business Registration submitted: ${organizationName} (${walletAddress})`);

      res.status(201).json({
        success: true,
        message: 'Registration submitted for review',
        data: {
          id: user.id,
          status: user.status,
          organizationName: user.organization_name
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get pending registrations (Admin only)
   * GET /api/users/admin/pending
   */
  async getPendingRegistrations(req, res, next) {
    try {
      const pendingUsers = await User.findAll({
        where: { status: 'pending' },
        order: [['createdAt', 'ASC']]
      });

      const ngos = pendingUsers.filter(u => u.role === 'ngo');
      const businesses = pendingUsers.filter(u => u.role === 'business');

      res.json({
        success: true,
        count: pendingUsers.length,
        data: {
          ngos,
          businesses
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve registration (Admin only)
   * POST /api/users/admin/approve/:userId
   */
  async approveRegistration(req, res, next) {
    try {
      const { userId } = req.params;
      const { adminWallet } = req.body;

      // Verify admin
      if (adminWallet !== process.env.ADMIN_WALLET) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      user.status = 'approved';
      user.reviewed_at = new Date();
      await user.save();

      logger.info(`✅ Registration approved: ${user.organization_name} (${user.wallet_address})`);

      res.json({
        success: true,
        message: 'Registration approved',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject registration (Admin only)
   * POST /api/users/admin/reject/:userId
   */
  async rejectRegistration(req, res, next) {
    try {
      const { userId } = req.params;
      const { adminWallet, reason } = req.body;

      // Verify admin
      if (adminWallet !== process.env.ADMIN_WALLET) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      user.status = 'rejected';
      user.reviewed_at = new Date();
      user.rejection_reason = reason || 'Application did not meet requirements';
      await user.save();

      logger.info(`❌ Registration rejected: ${user.organization_name}`);

      res.json({
        success: true,
        message: 'Registration rejected',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all approved NGOs
   * GET /api/users/ngos
   */
  async getApprovedNgos(req, res, next) {
    try {
      const ngos = await User.findAll({
        where: { role: 'ngo', status: 'approved' },
        attributes: ['id', 'organization_name', 'wallet_address', 'country', 'ngo_type', 'website']
      });

      res.json({
        success: true,
        count: ngos.length,
        data: ngos
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all approved Businesses
   * GET /api/users/businesses
   */
  async getApprovedBusinesses(req, res, next) {
    try {
      const businesses = await User.findAll({
        where: { role: 'business', status: 'approved' },
        attributes: ['id', 'organization_name', 'wallet_address', 'country', 'industry', 'website']
      });

      res.json({
        success: true,
        count: businesses.length,
        data: businesses
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user profile
   * GET /api/users/profile/:wallet_address
   */
  async getProfile(req, res, next) {
    try {
      const { wallet_address } = req.params;

      const user = await User.findOne({
        where: { wallet_address },
        attributes: { exclude: ['reviewed_by'] }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   * PUT /api/users/profile/:wallet_address
   */
  async updateProfile(req, res, next) {
    try {
      const { wallet_address } = req.params;
      const updates = req.body;

      const user = await User.findOne({
        where: { wallet_address }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Don't allow updating role/status via this endpoint
      delete updates.role;
      delete updates.status;
      delete updates.wallet_address;

      await user.update(updates);

      res.json({
        success: true,
        message: 'Profile updated',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get dashboard stats (Admin)
   * GET /api/users/admin/stats
   */
  async getAdminStats(req, res, next) {
    try {
      const [
        totalUsers,
        pendingCount,
        approvedNgos,
        approvedBusinesses
      ] = await Promise.all([
        User.count(),
        User.count({ where: { status: 'pending' } }),
        User.count({ where: { role: 'ngo', status: 'approved' } }),
        User.count({ where: { role: 'business', status: 'approved' } })
      ]);

      res.json({
        success: true,
        data: {
          totalUsers,
          pendingCount,
          approvedNgos,
          approvedBusinesses
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();