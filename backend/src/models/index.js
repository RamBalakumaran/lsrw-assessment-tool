// src/models/index.js
require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  logging: false,
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = require('./user')(sequelize, Sequelize);
db.Group = require('./group')(sequelize, Sequelize);
db.Task = require('./task')(sequelize, Sequelize);
db.Response = require('./response')(sequelize, Sequelize);

db.Group.belongsToMany(db.User, { through: 'GroupMembers', as: 'members' });
db.User.belongsToMany(db.Group, { through: 'GroupMembers', as: 'groupMemberships' });

db.Group.belongsToMany(db.User, { through: 'GroupAdmins', as: 'admins' });
db.User.belongsToMany(db.Group, { through: 'GroupAdmins', as: 'administeredGroups' });

db.Task.belongsToMany(db.Group, { through: 'TaskGroups', as: 'targetGroups' });
db.Group.belongsToMany(db.Task, { through: 'TaskGroups', as: 'tasks' });

db.sequelize.sync({ alter: true })
  .then(() => console.log('Database synced'))
  .catch(err => console.error('DB sync error:', err));

module.exports = db;
