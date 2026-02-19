const axios = require('axios');
const FormData = require('form-data');
const logger = require('../utils/logger');

class IpfsController {
  async getMetadata(req, res, next) {
    try {
      const { ipfs_hash } = req.params;
      const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${ipfs_hash}`;
      const response = await axios.get(gatewayUrl);

      res.json({ success: true, data: response.data });
    } catch (error) {
      logger.error(`IPFS fetch failed for: ${req.params.ipfs_hash}`);
      res.status(404).json({ success: false, error: 'Metadata not found' });
    }
  }

  // FIX: Added the missing upload controller method
  async uploadFiles(req, res, next) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, error: 'No files uploaded' });
      }

      // Make sure these are in your backEnd/.env file!
      const pinataApiKey = process.env.PINATA_API_KEY;
      const pinataSecretApiKey = process.env.PINATA_SECRET_KEY;

      if (!pinataApiKey || !pinataSecretApiKey) {
        logger.error('Pinata keys are missing from .env');
        return res.status(500).json({ success: false, error: 'IPFS configuration error' });
      }

      // For simplicity in this step, we will upload the first file to Pinata
      // (If you want to upload all of them into a directory folder, the logic is slightly different)
      const fileToUpload = req.files[0];

      const formData = new FormData();
      formData.append('file', fileToUpload.buffer, {
        filename: fileToUpload.originalname,
        contentType: fileToUpload.mimetype,
      });

      // Send to Pinata via direct REST API
      const pinataRes = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          maxBodyLength: Infinity,
          headers: {
            'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
            'pinata_api_key': pinataApiKey,
            'pinata_secret_api_key': pinataSecretApiKey,
          },
        }
      );

      // Return the hash exactly as the frontend expects
      res.json({
        success: true,
        ipfsHash: pinataRes.data.IpfsHash
      });

    } catch (error) {
      logger.error('IPFS Upload Error:', error?.response?.data || error.message);
      res.status(500).json({ success: false, error: 'Failed to upload to IPFS' });
    }
  }
}

module.exports = new IpfsController();