require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const cycleRoutes = require('./src/routes/cycles');
const kpaRoutes = require('./src/routes/kpa');
const midYearRoutes = require('./src/routes/midYear');
const appraisalRoutes = require('./src/routes/appraisal');
const reportRoutes = require('./src/routes/reports');
const auditRoutes = require('./src/routes/audit');
const attributeRoutes = require('./src/routes/attributes');
const ceoRoutes = require('./src/routes/ceo');

const { errorHandler, notFound } = require('./src/middleware/errorHandler');
const { initCycleScheduler } = require('./src/cron/cycleScheduler');

const app = express();

// Initialize cron jobs
initCycleScheduler();

// Security middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

// Body parsing & logging
app.use(express.json({ limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cycles', cycleRoutes);
app.use('/api/kpa', kpaRoutes);
app.use('/api/mid-year', midYearRoutes);
app.use('/api/appraisal', appraisalRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/attributes', attributeRoutes);
app.use('/api/ceo', ceoRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`e-PMS Backend running on port ${PORT} [${process.env.NODE_ENV}]`);
});

module.exports = app;
