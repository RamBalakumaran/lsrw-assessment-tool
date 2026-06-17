const mysql = require('mysql2/promise');
require('dotenv').config();

async function createDb() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS
  });
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
  console.log(`Database ${process.env.DB_NAME} created or already exists.`);
  await connection.end();
}

createDb().catch(err => {
  console.error(err);
  process.exit(1);
});
