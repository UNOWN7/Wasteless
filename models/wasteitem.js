'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class WasteItem extends Model {
    static associate(models) {
      WasteItem.hasMany(models.Transaction, { foreignKey: 'wasteId' });
      WasteItem.belongsTo(models.User, { foreignKey: 'userId' });
    }
  }

  WasteItem.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Pending', // ✅ Fixes default value
        validate: {
          isIn: [['Pending', 'Accepted', 'Picked Up']], // ✅ Ensures valid status values
        },
      },
    },
    {
      sequelize,
      modelName: 'WasteItem',
    }
  );

  return WasteItem;
};
