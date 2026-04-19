const { recalculateAllHealthScores } = require('../db/utils');

// Run health score recalc every 6 hours in production
// In dev, runs on every request (for testing)
let lastRecalc = 0;
const RECALC_INTERVAL = process.env.NODE_ENV === 'production' ? 6 * 60 * 60 * 1000 : 0;

module.exports = (req, res, next) => {
  const now = Date.now();
  if (RECALC_INTERVAL === 0 || now - lastRecalc > RECALC_INTERVAL) {
    lastRecalc = now;
    const updated = recalculateAllHealthScores();
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📊 Health scores recalculated (${updated} clients)`);
    }
  }
  next();
};
