// src/routes/explorer.routes.js

const express = require('express');
const router = express.Router();
const companyController = require('../controllers/company.controller');

router.get('/company/:walletAddress', companyController.getDashboard);
router.get('/public/:walletAddress', companyController.publicExplorer);

module.exports = router;