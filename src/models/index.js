const sequelize = require('../config/database');

const Company = require('./Company');
const Project = require('./Project');
const Listing = require('./Listing');
const Retirement = require('./Retirement');
const User = require('./User');

/* ========= Associations ========= */

Company.hasMany(Retirement, { foreignKey: 'company_id', as: 'retirements' });
Retirement.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

Project.hasMany(Retirement, { foreignKey: 'asa_id', sourceKey: 'asa_id', as: 'retirementRecords' });
Retirement.belongsTo(Project, { foreignKey: 'asa_id', targetKey: 'asa_id', as: 'project' });

Project.hasMany(Listing, { foreignKey: 'asa_id', sourceKey: 'asa_id', as: 'listings' });
Listing.belongsTo(Project, { foreignKey: 'asa_id', targetKey: 'asa_id', as: 'project' });

module.exports = {
  sequelize,
  Company,
  Project,
  Listing,
  Retirement,
  User
};
