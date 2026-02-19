// src/middleware/auth.js

const { User } = require('../models');

/**
 * Check if user is approved
 */
const requireApproval = async (req, res, next) => {
  try {
    const walletAddress = req.headers['x-wallet-address'] || req.body.walletAddress;
    
    if (!walletAddress) {
      return res.status(401).json({
        success: false,
        error: 'Wallet address required'
      });
    }

    // Admin bypass
    if (walletAddress === process.env.ADMIN_WALLET) {
      req.user = { role: 'admin', status: 'approved' };
      return next();
    }

    const user = await User.findOne({
      where: { wallet_address: walletAddress }
    });

    if (!user) {
      return res.status(403).json({
        success: false,
        error: 'Not registered',
        code: 'NOT_REGISTERED'
      });
    }

    if (user.status !== 'approved') {
      return res.status(403).json({
        success: false,
        error: 'Account not approved',
        code: 'NOT_APPROVED',
        status: user.status
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user is NGO
 */
const requireNgo = async (req, res, next) => {
  await requireApproval(req, res, () => {
    if (req.user.role !== 'ngo' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'NGO access required'
      });
    }
    next();
  });
};

/**
 * Check if user is Business
 */
const requireBusiness = async (req, res, next) => {
  await requireApproval(req, res, () => {
    if (req.user.role !== 'business' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Business access required'
      });
    }
    next();
  });
};

/**
 * Check if user is Admin
 */
const requireAdmin = async (req, res, next) => {
  const walletAddress = req.headers['x-wallet-address'] || req.body.adminWallet;
  
  if (walletAddress !== process.env.ADMIN_WALLET) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  
  req.user = { role: 'admin', status: 'approved' };
  next();
};

module.exports = {
  requireApproval,
  requireNgo,
  requireBusiness,
  requireAdmin
};