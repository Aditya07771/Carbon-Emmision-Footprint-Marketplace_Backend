const axios = require('axios');
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
}

module.exports = new IpfsController();