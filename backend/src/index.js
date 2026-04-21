require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { initDB } = require('./db/database');
const healthcheck = require('./middleware/healthcheck');

const app = express();
const PORT = process.env.PORT || 4000;

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// ── RATE LIMITING ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Stricter for auth endpoints
  message: { error: 'Too many login attempts, please try again later.' },
});
app.use('/api', limiter);
app.use('/api/auth', authLimiter);

// ── STRIPE WEBHOOK (must come BEFORE express.json) ────────────────────────────
// Stripe requires the raw request body to verify signatures
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));

// ── BODY PARSER ───────────────────────────────────────────────────────────────
app.use(express.json());

// ── HEALTH SCORE RECALC ───────────────────────────────────────────────────────
app.use(healthcheck);

// ── ROUTES ────────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/export', require('./routes/export'));
app.use('/api/checkins', require('./routes/checkins'));

// ── HEALTH CHECK ──────────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ status: 'ok', version: '1.0.0', service: 'PulseBoard API' }));

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// ── ERROR HANDLER ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

initDB();
app.listen(PORT, () => console.log(`🚀 PulseBoard API running on port ${PORT}`));
