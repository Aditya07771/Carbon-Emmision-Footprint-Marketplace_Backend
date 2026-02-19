// src/routes/credit.routes.js

const express = require('express');
const router = express.Router();
const creditController = require('../controllers/credit.controller');
const { validateIssuance } = require('../middleware/validation');

router.post('/issue', validateIssuance, creditController.issueCredits);
router.get('/:asaId', creditController.getCreditDetails);
router.get('/', creditController.getAllCredits);

module.exports = router;