/**
 * GradeSync Backend - Express App Entry Point
 */
require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
