// src/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const groupRoutes = require('./routes/groups');
const responseRoutes = require('./routes/responses');
const bulkImportRoutes = require('./routes/bulkImport');
const analyticsRoutes = require('./routes/analytics');
const userRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
app.use(cors());
app.use(express.json());

const evaluateRoutes = require('../routes/evaluate');
const writingRoutes = require('../routes/writing');
const attemptsRoutes = require('../routes/attempts');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin/users', userRoutes); // alias for backwards compatibility
app.use('/api/tasks', taskRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/bulk-import', bulkImportRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/evaluate', evaluateRoutes);
app.use('/api/writing', writingRoutes);
app.use('/api/attempts', attemptsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));

module.exports = app;
