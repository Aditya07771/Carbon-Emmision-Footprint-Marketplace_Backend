const express = require('express');
const router = express.Router();
const ipfsController = require('../controllers/ipfs.controller');

router.get('/metadata/:ipfs_hash', ipfsController.getMetadata);

module.exports = router;