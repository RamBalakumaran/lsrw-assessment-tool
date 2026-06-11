const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('./config/loadDatabaseEnv')();

const tenantMiddleware = require('./middleware/tenant');
const authRoute = require('./routes/auth');
const evaluateRoute = require('./routes/evaluate');
const writingRoute = require('./routes/writing');
const tasksRoute = require('./routes/tasks');
const groupsRoute = require('./routes/groups');
const attemptsRoute = require('./routes/attempts');
const dashboardRoute = require('./routes/dashboard');
const adminRoute = require('./routes/admin');
const bulkImportRoute = require('./routes/bulkImport');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(tenantMiddleware);

// Serve uploads static folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads folder if missing
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// REGISTER ROUTES
app.use('/api/auth', authRoute);
app.use('/api/evaluate', evaluateRoute);
app.use('/api/writing', writingRoute);
app.use('/api/tasks', tasksRoute);
app.use('/api/groups', groupsRoute);
app.use('/api/attempts', attemptsRoute);
app.use('/api/dashboard', dashboardRoute);
app.use('/api/admin', adminRoute);
app.use('/api/bulk-import', bulkImportRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
