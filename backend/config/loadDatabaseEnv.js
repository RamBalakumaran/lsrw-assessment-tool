const path = require('path');
const dotenv = require('dotenv');

let isLoaded = false;

function loadDatabaseEnv() {
    if (isLoaded) {
        return process.env.DATABASE_URL;
    }

    dotenv.config({ path: path.resolve(__dirname, '../.env') });

    const host = process.env.DB_HOST;
    const port = process.env.DB_PORT || '3306';
    const user = process.env.DB_USER;
    const password = process.env.DB_PASS ?? process.env.DB_PASSWORD;
    const database = process.env.DB_NAME;

    if (host && user && typeof password === 'string' && database) {
        const safeUser = encodeURIComponent(user);
        const safePassword = encodeURIComponent(password);
        const safeDatabase = encodeURIComponent(database);

        process.env.DATABASE_URL = `mysql://${safeUser}:${safePassword}@${host}:${port}/${safeDatabase}`;
    }

    isLoaded = true;
    return process.env.DATABASE_URL;
}

module.exports = loadDatabaseEnv;
