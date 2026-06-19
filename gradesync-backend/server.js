/**
 * GradeSync Backend - Express App Entry Point
 */
require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const comparisonRoutes = require('./src/routes/comparison.routes');
const templateRoutes = require('./src/routes/template.routes');
const { errorHandler } = require('./src/middlewares/error.middleware');
const { initDatabase, isDatabaseConfigured } = require('./src/config/database');

const app = express();

// Security & Middleware
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) { callback(null, true); }, // Cho phép mọi domain (kể cả Vercel)
  credentials: true,
  exposedHeaders: ['Content-Disposition', 'Content-Type', 'Content-Length'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
app.use('/api/comparisons', comparisonRoutes);
app.use('/api/templates', templateRoutes);

// Phục vụ giao diện Frontend (Local Mode)
const path = require('path');
const frontendDist = path.join(__dirname, '../gradesync-frontend/dist');
app.use(express.static(frontendDist));

app.get('*', (req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve Frontend (cho phép chạy local offline trên máy thầy cô)
const frontendPath = path.join(__dirname, '../gradesync-frontend/dist');
app.use(express.static(frontendPath));

// Bắt tất cả các route khác (không phải /api) và trả về Frontend React (hỗ trợ React Router)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`GradeSync Backend running on http://localhost:${PORT}`);
  console.log('Uploads and result files are processed in memory, not saved to local folders.');

  initDatabase().then((ready) => {
    if (ready) {
      console.log('PostgreSQL storage is ready.');
    } else if (isDatabaseConfigured()) {
      console.log('PostgreSQL is configured but not reachable; using memory fallback for now.');
    } else {
      console.log('DATABASE_URL is not configured; using memory fallback.');
    }
  });
});

module.exports = app;
