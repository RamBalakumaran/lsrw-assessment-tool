const path = require('path');
const { spawnSync } = require('child_process');
const loadDatabaseEnv = require('../config/loadDatabaseEnv');

loadDatabaseEnv();

let prismaCli;

try {
    prismaCli = require.resolve('prisma/build/index.js');
} catch (error) {
    console.error('Prisma CLI is not installed. Run npm install inside backend first.');
    process.exit(1);
}

const result = spawnSync(
    process.execPath,
    [prismaCli, ...process.argv.slice(2)],
    {
        cwd: path.resolve(__dirname, '..'),
        env: process.env,
        stdio: 'inherit',
    }
);

if (result.error) {
    console.error(result.error.message);
    process.exit(1);
}

process.exit(result.status ?? 0);
