/**
 * GradeSync Desktop Backend Server
 * Express server embedded inside the Electron app.
 * Serves both the API and the built React frontend.
 */
require('express-async-errors');

const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const path      = require('path');

// Route handlers
const comparisonRoutes = require('./src/routes/comparison.routes');
const templateRoutes   = require('./src/routes/template.routes');
const { errorHandler } = require('./src/middlewares/error.middleware');
const { initDatabase, isDatabaseConfigured } = require('./src/config/database');

const app = express();

// ── Security ─────────────────────────────────────────────────────────────────
// Tắt một số header CSP của helmet vì Electron load từ localhost
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/comparisons', comparisonRoutes);
app.use('/api/templates',   templateRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mode: 'desktop', timestamp: new Date().toISOString() });
});

// ── Frontend Static Files ─────────────────────────────────────────────────────
const frontendPath = path.join(__dirname, 'public');
app.use(express.static(frontendPath));

// SPA Fallback: mọi route không phải /api đều trả về index.html
app.get('*', (req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
function startServer() {
  const PORT = parseInt(process.env.PORT || '5000', 10);

  return new Promise((resolve, reject) => {
    const server = app.listen(PORT, '127.0.0.1', () => {
      console.log(`[GradeSync] Server running at http://localhost:${PORT}`);

      // Kết nối Database (không bắt buộc — có fallback in-memory)
      initDatabase()
        .then((ready) => {
          if (ready) {
            console.log('[GradeSync] Database connected.');
          } else if (isDatabaseConfigured()) {
            console.log('[GradeSync] Database configured but not reachable. Using memory fallback.');
          } else {
            console.log('[GradeSync] No DATABASE_URL — using in-memory storage.');
          }
        })
        .catch(() => {
          console.log('[GradeSync] Database error — using in-memory storage.');
        });

      resolve(server);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // Port đã bị dùng → thử port tiếp theo
        console.log(`[GradeSync] Port ${PORT} in use, trying ${PORT + 1}...`);
        process.env.PORT = String(PORT + 1);
        server.close(() => resolve(startServer()));
      } else {
        reject(err);
      }
    });
  });
}

module.exports = { startServer };
