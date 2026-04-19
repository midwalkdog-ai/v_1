require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./db/database');
const healthcheck = require('./middleware/healthcheck');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());
app.use(healthcheck);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/analytics', require('./routes/analytics'));

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', version: '1.0.0', service: 'PulseBoard API' }));

// 404
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

initDB();
app.listen(PORT, () => console.log(`🚀 PulseBoard API running on port ${PORT}`));
