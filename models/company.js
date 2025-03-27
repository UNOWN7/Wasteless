'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Company extends Model {
    static associate(models) {
      Company.hasMany(models.Transaction, { foreignKey: 'companyId', onDelete: 'CASCADE' });
    }
  }

  Company.init(
    {
      name: DataTypes.STRING,
      email: DataTypes.STRING,
      password: DataTypes.STRING,
      location: DataTypes.STRING,
      contactNumber: DataTypes.STRING
    },
    {
      sequelize,
      modelName: 'Company',
    }
  );

  return Company;
};
