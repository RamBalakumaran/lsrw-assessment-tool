const db = require('./backend/src/models');
db.sequelize.query('DESCRIBE tasks;').then(res => console.log('tasks columns:', res[0])).catch(console.error);
