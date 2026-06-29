// src/models/index.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
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

// Reading module models
db.ReadingPassage = require('./reading_passage')(sequelize, Sequelize);
db.ReadingQuestion = require('./reading_question')(sequelize, Sequelize);
db.ReadingAttempt = require('./reading_attempt')(sequelize, Sequelize);
db.ReadingResponse = require('./reading_response')(sequelize, Sequelize);
db.TenantConfig = require('./tenant_config')(sequelize, Sequelize);

db.Group.belongsToMany(db.User, { through: 'GroupMembers', as: 'members' });
db.User.belongsToMany(db.Group, { through: 'GroupMembers', as: 'groupMemberships' });

db.Group.belongsToMany(db.User, { through: 'GroupAdmins', as: 'admins' });
db.User.belongsToMany(db.Group, { through: 'GroupAdmins', as: 'administeredGroups' });

db.Task.belongsToMany(db.Group, { through: 'TaskGroups', as: 'targetGroups' });
db.Group.belongsToMany(db.Task, { through: 'TaskGroups', as: 'tasks' });

// Reading associations
db.ReadingPassage.hasMany(db.ReadingQuestion, { foreignKey: 'passageId' });
db.ReadingQuestion.belongsTo(db.ReadingPassage, { foreignKey: 'passageId' });

db.ReadingAttempt.belongsTo(db.ReadingPassage, { foreignKey: 'passageId' });
db.ReadingAttempt.hasMany(db.ReadingResponse, { foreignKey: 'attemptId' });

db.ReadingResponse.belongsTo(db.ReadingAttempt, { foreignKey: 'attemptId' });
db.ReadingResponse.belongsTo(db.ReadingQuestion, { foreignKey: 'questionId' });

// TenantConfig belongs to tenant concept via tenantId but no Tenant model exists; it's standalone

db.sequelize.sync({ alter: true })
  .then(() => console.log('Database synced'))
  .catch(err => console.error('DB sync error:', err));

module.exports = db;
