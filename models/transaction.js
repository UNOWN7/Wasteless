module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
      userId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
              model: 'Users',
              key: 'id',
          },
      },
      companyId: {
          type: DataTypes.INTEGER,
          allowNull: true, 
          references: {
              model: 'Companies',
              key: 'id',
          },
      },
      wasteId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
              model: 'WasteItems',
              key: 'id',
          },
      },
      status: {
          type: DataTypes.STRING,
          defaultValue: 'Pending', 
      },
      rewardPoints: {
          type: DataTypes.INTEGER,
          defaultValue: 10,
      },
  });

  return Transaction;
};
