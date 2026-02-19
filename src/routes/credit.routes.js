// src/routes/credit.routes.js

const express = require('express');
const router = express.Router();
const creditController = require('../controllers/credit.controller');
const { validateIssuance } = require('../middleware/validation');
const { requireNgo } = require('../middleware/auth');

// Public routes
router.get('/:asaId', creditController.getCreditDetails);
router.get('/', creditController.getAllCredits);

// Protected routes (NGO only)
router.post('/issue', requireNgo, validateIssuance, creditController.issueCredits);

module.exports = router;