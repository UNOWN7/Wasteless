const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/config.json').development;

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
});

const db = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.User = require('./user')(sequelize, DataTypes);
db.WasteItem = require('./wasteitem')(sequelize, DataTypes);
db.Company = require('./company')(sequelize, DataTypes);
db.Transaction = require('./transaction')(sequelize, DataTypes);

db.Transaction.belongsTo(db.WasteItem, { foreignKey: 'wasteId' });
db.WasteItem.hasMany(db.Transaction, { foreignKey: 'wasteId' });

db.Company.hasMany(db.Transaction, { foreignKey: 'companyId' });
db.Transaction.belongsTo(db.Company, { foreignKey: 'companyId' });

db.User.hasMany(db.Transaction, { foreignKey: 'userId' });
db.Transaction.belongsTo(db.User, { foreignKey: 'userId' });

db.User.hasMany(db.WasteItem, { foreignKey: 'userId' });
db.WasteItem.belongsTo(db.User, { foreignKey: 'userId' });

db.WasteItem.belongsTo(db.User, { foreignKey: 'userId' });
db.User.hasMany(db.WasteItem, { foreignKey: 'userId' });

db.WasteItem.belongsTo(db.Company, { foreignKey: 'companyId' });
db.Company.hasMany(db.WasteItem, { foreignKey: 'companyId' });

module.exports = db;
