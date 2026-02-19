// src/routes/user.routes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

// Public routes
router.get('/role/:wallet_address', userController.getRole);
router.get('/profile/:wallet_address', userController.getProfile);
router.get('/ngos', userController.getApprovedNgos);
router.get('/businesses', userController.getApprovedBusinesses);

// Registration routes
router.post('/register/ngo', userController.registerNgo);
router.post('/register/business', userController.registerBusiness);

// Profile update
router.put('/profile/:wallet_address', userController.updateProfile);

// Admin routes
router.get('/admin/pending', userController.getPendingRegistrations);
router.get('/admin/stats', userController.getAdminStats);
router.post('/admin/approve/:userId', userController.approveRegistration);
router.post('/admin/reject/:userId', userController.rejectRegistration);

module.exports = router;