require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

const connectDB = require('./config/db');
const { initCronJobs } = require('./jobs/cron');

const authRoutes = require('./routes/auth.routes');
const articlesRoutes = require('./routes/articles.routes');
const searchRoutes = require('./routes/search.routes');
const tagsRoutes = require('./routes/tags.routes');
const reportsRoutes = require('./routes/reports.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// --- Core middleware ---
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// Static file serving for locally-generated PDF reports / uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic rate limiting on the whole API
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));

// --- Health check ---
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/admin', adminRoutes);

// --- 404 handler ---
app.use('/api', (req, res) => res.status(404).json({ error: 'Route not found' }));

// --- Global error handler ---
app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

(async () => {
  await connectDB();
  if (process.env.NODE_ENV !== 'test') initCronJobs();
  app.listen(PORT, () => console.log(`[server] Listening on port ${PORT}`));
})();

module.exports = app;
