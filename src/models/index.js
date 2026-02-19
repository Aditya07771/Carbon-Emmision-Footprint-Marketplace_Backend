const sequelize = require('../config/database');

const Company = require('./Company');
const Project = require('./Project');
const Listing = require('./Listing');
const Retirement = require('./Retirement');

/* ========= Associations ========= */

Company.hasMany(Retirement, { foreignKey: 'company_id' });
Retirement.belongsTo(Company, { foreignKey: 'company_id' });

Project.hasMany(Retirement, { foreignKey: 'asa_id', sourceKey: 'asa_id' });
Retirement.belongsTo(Project, { foreignKey: 'asa_id', targetKey: 'asa_id' });

Project.hasMany(Listing, { foreignKey: 'asa_id', sourceKey: 'asa_id' });
Listing.belongsTo(Project, { foreignKey: 'asa_id', targetKey: 'asa_id' });

module.exports = {
  sequelize,
  Company,
  Project,
  Listing,
  Retirement
};
