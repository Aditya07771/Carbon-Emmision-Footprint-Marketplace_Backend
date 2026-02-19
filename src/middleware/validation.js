// src/middleware/validation.js

const Joi = require('joi');

const validateIssuance = (req, res, next) => {
  const schema = Joi.object({
    projectId: Joi.string().required(),
    name: Joi.string().required(),
    location: Joi.string().required(),
    projectType: Joi.string().valid(
      'Reforestation', 'Solar', 'Wind', 'Biogas',
      'Methane Capture', 'Ocean Conservation', 'Other'
    ).required(),
    verifier: Joi.string().required(),
    co2Tonnes: Joi.number().integer().min(1).required(),
    vintageYear: Joi.number().integer().min(2000).max(2100).required(),
    asaId: Joi.number().integer().required(),
    issuerWallet: Joi.string().length(58).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  next();
};

module.exports = { validateIssuance };