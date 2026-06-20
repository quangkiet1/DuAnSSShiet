/**
 * GradeSync Backend - Express App Entry Point
 * Dùng cho web deployment (Vercel, Railway, v.v.)
 * Cho dev local: frontend (port 5173) → proxy → backend (port 5000)
 */
require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const path    = require('path');

const comparisonRoutes = require('./src/routes/comparison.routes');
const templateRoutes   = require('./src/routes/template.routes');
const { errorHandler } = require('./src/middlewares/error.middleware');
const { initDatabase, isDatabaseConfigured } = require('./src/config/database');

const app = express();

// ── Security & Middleware ─────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) { callback(null, true); },
  credentials: true,
  exposedHeaders: ['Content-Disposition', 'Content-Type', 'Content-Length'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/comparisons', comparisonRoutes);
app.use('/api/templates',   templateRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Serve Frontend (Production / Local Offline) ───────────────────────────────
const frontendPath = path.join(__dirname, '../gradesync-frontend/dist');
app.use(express.static(frontendPath));

// SPA Fallback — mọi route không phải /api đều trả về React index.html
app.get('*', (req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ── Error Handler (phải là middleware cuối cùng) ──────────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`GradeSync Backend running on http://localhost:${PORT}`);

  initDatabase().then((ready) => {
    if (ready) {
      console.log('✅ PostgreSQL storage is ready.');
    } else if (isDatabaseConfigured()) {
      console.log('⚠️  PostgreSQL configured but not reachable — using memory fallback.');
    } else {
      console.log('ℹ️  DATABASE_URL not set — using in-memory storage.');
    }
  });
});

module.exports = app;
