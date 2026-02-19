const express = require('express');
const router = express.Router();
const multer = require('multer');
const ipfsController = require('../controllers/ipfs.controller');

// Use memory storage so we can directly forward the buffer to Pinata
const upload = multer({ storage: multer.memoryStorage() });

router.get('/metadata/:ipfs_hash', ipfsController.getMetadata);

// FIX: Add the POST route for file uploads
// 'files' MUST match what you called formData.append('files', ...) in the frontend
router.post('/upload', upload.array('files', 10), ipfsController.uploadFiles);

module.exports = router;