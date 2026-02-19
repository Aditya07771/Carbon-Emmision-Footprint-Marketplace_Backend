// src/services/ipfs.service.js

const pinata = require('../config/ipfs');
const logger = require('../utils/logger');

class IPFSService {
  /**
   * Upload project verification document
   */
  async uploadProjectDocument(projectData) {
    try {
      const metadata = {
        certificate_type: "Carbon Credit Issuance",
        project_id: projectData.projectId,
        project_name: projectData.name,
        location: projectData.location,
        verifier: projectData.verifier,
        verification_standard: projectData.standard,
        co2_tonnes: projectData.co2Tonnes,
        vintage_year: projectData.vintageYear,
        project_type: projectData.projectType,
        certification_date: new Date().toISOString(),
        issuer_wallet: projectData.issuerWallet
      };

      const result = await pinata.pinJSONToIPFS(metadata, {
        pinataMetadata: {
          name: `CCT-${projectData.projectId}`,
          keyvalues: {
            type: 'issuance',
            projectId: projectData.projectId
          }
        }
      });

      logger.info(`✅ Project document uploaded to IPFS: ${result.IpfsHash}`);
      return result.IpfsHash;
    } catch (error) {
      logger.error('Error uploading to IPFS:', error);
      throw error;
    }
  }

  /**
   * Upload retirement certificate
   */
  async uploadRetirementCertificate(retirementData) {
    try {
      const certificate = {
        certificate_type: "Carbon Credit Retirement",
        certificate_id: retirementData.certificateId,
        company_name: retirementData.companyName,
        company_wallet: retirementData.companyWallet,
        project_name: retirementData.projectName,
        credits_retired: retirementData.tonnes,
        asa_id: retirementData.asaId,
        retirement_date: new Date().toISOString(),
        blockchain_proof: {
          network: 'Algorand Testnet',
          transaction_hash: retirementData.txnHash,
          explorer_url: `https://testnet.algoexplorer.io/tx/${retirementData.txnHash}`
        },
        verification: {
          verifier: retirementData.verifier,
          vintage_year: retirementData.vintageYear,
          project_type: retirementData.projectType
        }
      };

      const result = await pinata.pinJSONToIPFS(certificate, {
        pinataMetadata: {
          name: `Retirement-${retirementData.certificateId}`,
          keyvalues: {
            type: 'retirement',
            company: retirementData.companyName,
            tonnes: retirementData.tonnes.toString()
          }
        }
      });

      logger.info(`✅ Retirement certificate uploaded: ${result.IpfsHash}`);
      return result.IpfsHash;
    } catch (error) {
      logger.error('Error uploading retirement certificate:', error);
      throw error;
    }
  }

  /**
   * Retrieve document from IPFS
   */
  async getDocument(ipfsHash) {
    try {
      const url = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      logger.error(`Error retrieving IPFS document ${ipfsHash}:`, error);
      throw error;
    }
  }
}

module.exports = new IPFSService();