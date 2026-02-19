// src/routes/retirement.routes.js

const express = require('express');
const router = express.Router();
const retirementController = require('../controllers/retirement.controller');

router.post('/retire', retirementController.retireCredits);
router.get('/', retirementController.getAllRetirements);
router.get('/verify/:certificateId', retirementController.verifyCertificate);

module.exports = router;