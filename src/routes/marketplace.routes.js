// src/routes/marketplace.routes.js

const express = require('express');
const router = express.Router();
const marketplaceController = require('../controllers/marketplace.controller');

router.get('/', marketplaceController.getListings);
router.post('/list', marketplaceController.createListing);
router.post('/buy', marketplaceController.buyCredit);
router.post('/cancel', marketplaceController.cancelListing);

module.exports = router;