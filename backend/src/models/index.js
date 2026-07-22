// src/models/index.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { Sequelize } = require('sequelize');
Sequelize.DataTypes.UUID.prototype.toSql = function() { return 'CHAR(36)'; };

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  logging: false,
  define: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  }
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

db.Response.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });
db.User.hasMany(db.Response, { foreignKey: 'userId', as: 'responses' });

db.Response.belongsTo(db.Task, { foreignKey: 'taskId', as: 'task' });
db.Task.hasMany(db.Response, { foreignKey: 'taskId', as: 'responses' });

db.Task.belongsTo(db.User, { foreignKey: 'creatorId', as: 'creator' });
db.User.hasMany(db.Task, { foreignKey: 'creatorId', as: 'createdTasks' });

// Reading associations
db.ReadingPassage.hasMany(db.ReadingQuestion, { foreignKey: 'passageId' });
db.ReadingQuestion.belongsTo(db.ReadingPassage, { foreignKey: 'passageId' });

db.ReadingAttempt.belongsTo(db.ReadingPassage, { foreignKey: 'passageId' });
db.ReadingAttempt.hasMany(db.ReadingResponse, { foreignKey: 'attemptId' });

db.ReadingResponse.belongsTo(db.ReadingAttempt, { foreignKey: 'attemptId' });
db.ReadingResponse.belongsTo(db.ReadingQuestion, { foreignKey: 'questionId' });

// Response & User / Task associations
db.Response.belongsTo(db.Task, { foreignKey: 'taskId' });
db.Task.hasMany(db.Response, { foreignKey: 'taskId' });

db.Response.belongsTo(db.User, { foreignKey: 'userId' });
db.User.hasMany(db.Response, { foreignKey: 'userId' });

db.sequelize.sync()
  .then(async () => {
    console.log('Database synced');
    try {
      await db.sequelize.query("ALTER TABLE `users` ADD COLUMN `yearOfStudy` VARCHAR(255) NULL;");
      console.log('Added yearOfStudy column to users table');
    } catch (e) {}
    try {
      await db.sequelize.query("ALTER TABLE `groups` ADD COLUMN `status` VARCHAR(255) DEFAULT 'ACTIVE';");
      console.log('Added status column to groups table');
    } catch (e) {}
    try {
      await db.sequelize.query("ALTER TABLE `responses` ADD COLUMN `studentAnswers` JSON NULL;");
      console.log('Added studentAnswers column to responses table');
    } catch (e) {}
    try {
      await db.sequelize.query("ALTER TABLE `responses` ADD COLUMN `aiResults` JSON NULL;");
      console.log('Added aiResults column to responses table');
    } catch (e) {}
    try {
      await db.sequelize.query("ALTER TABLE `responses` ADD COLUMN `status` VARCHAR(255) DEFAULT 'COMPLETED';");
      console.log('Added status column to responses table');
    } catch (e) {}
    try {
      await db.sequelize.query("ALTER TABLE `tasks` ADD COLUMN `passage` TEXT NULL;");
      console.log('Added passage column to tasks table');
    } catch (e) {}
    try {
      await db.sequelize.query("ALTER TABLE `tasks` ADD COLUMN `audioUrl` VARCHAR(255) NULL;");
      console.log('Added audioUrl column to tasks table');
    } catch (e) {}
  })
  .catch(err => console.warn('DB sync warning (non-fatal):', err.message));

module.exports = db;
