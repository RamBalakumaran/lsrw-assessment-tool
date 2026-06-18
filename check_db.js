const db = require('./backend/src/models');
db.sequelize.query('DESCRIBE tasks;').then(res => console.log(res[0])).catch(console.error);
