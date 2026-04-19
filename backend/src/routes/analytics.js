const express = require('express');
const { db } = require('../db/database');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// GET /api/analytics/overview
router.get('/overview', (req, res) => {
  const uid = req.user.id;

  const totalClients = db.prepare('SELECT COUNT(*) as count FROM clients WHERE user_id = ?').get(uid);
  const atRisk = db.prepare("SELECT COUNT(*) as count FROM clients WHERE user_id = ? AND status = 'at-risk'").get(uid);
  const totalMRR = db.prepare('SELECT SUM(mrr) as total FROM clients WHERE user_id = ? AND status != ?').get(uid, 'churned');
  const totalARR = db.prepare('SELECT SUM(contract_value) as total FROM clients WHERE user_id = ? AND status != ?').get(uid, 'churned');
  const avgHealth = db.prepare('SELECT AVG(health_score) as avg FROM clients WHERE user_id = ?').get(uid);
  const activeProjects = db.prepare("SELECT COUNT(*) as count FROM projects WHERE user_id = ? AND status = 'active'").get(uid);
  const delayedProjects = db.prepare("SELECT COUNT(*) as count FROM projects WHERE user_id = ? AND status IN ('delayed', 'at-risk')").get(uid);

  const alerts = db.prepare(`
    SELECT a.*, c.name as client_name FROM alerts a 
    LEFT JOIN clients c ON a.client_id = c.id
    WHERE a.user_id = ? AND a.resolved = 0 
    ORDER BY CASE a.severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END, a.created_at DESC
    LIMIT 10
  `).all(uid);

  const recentActivity = db.prepare(`
    SELECT ac.*, c.name as client_name FROM activities ac
    LEFT JOIN clients c ON ac.client_id = c.id
    WHERE ac.user_id = ?
    ORDER BY ac.created_at DESC
    LIMIT 8
  `).all(uid);

  const healthDistribution = db.prepare(`
    SELECT 
      CASE 
        WHEN health_score >= 80 THEN 'Healthy'
        WHEN health_score >= 60 THEN 'Moderate'
        WHEN health_score >= 40 THEN 'At Risk'
        ELSE 'Critical'
      END as category,
      COUNT(*) as count
    FROM clients WHERE user_id = ?
    GROUP BY category
  `).all(uid);

  const topClients = db.prepare(`
    SELECT id, name, company, mrr, health_score, status 
    FROM clients WHERE user_id = ?
    ORDER BY mrr DESC LIMIT 5
  `).all(uid);

  res.json({
    metrics: {
      totalClients: totalClients.count,
      atRisk: atRisk.count,
      mrr: totalMRR.total || 0,
      arr: totalARR.total || 0,
      avgHealth: Math.round(avgHealth.avg || 0),
      activeProjects: activeProjects.count,
      delayedProjects: delayedProjects.count,
    },
    alerts,
    recentActivity,
    healthDistribution,
    topClients,
  });
});

// PATCH /api/analytics/alerts/:id/resolve
router.patch('/alerts/:id/resolve', (req, res) => {
  db.prepare('UPDATE alerts SET resolved = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ success: true });
});

module.exports = router;
