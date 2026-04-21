const express = require('express');
const { db } = require('../db/database');
const auth = require('../middleware/auth');
const { requirePaidPlan } = require('../middleware/subscription');

const router = express.Router();
router.use(auth);

// Helper — convert array of objects to CSV string
function toCSV(rows, columns) {
  if (!rows.length) return columns.join(',') + '\n';
  const escape = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.join(',');
  const body = rows.map(row => columns.map(col => escape(row[col])).join(','));
  return [header, ...body].join('\n');
}

// GET /api/export/clients.csv
router.get('/clients.csv', requirePaidPlan, (req, res) => {
  const clients = db.prepare(`
    SELECT
      name, company, email, phone, status, health_score,
      mrr, contract_value, industry, start_date, renewal_date,
      notes, created_at
    FROM clients
    WHERE user_id = ?
    ORDER BY name ASC
  `).all(req.user.id);

  const columns = ['name','company','email','phone','status','health_score','mrr','contract_value','industry','start_date','renewal_date','notes','created_at'];
  const csv = toCSV(clients, columns);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="pulseboard-clients-${Date.now()}.csv"`);
  res.send(csv);
});

// GET /api/export/projects.csv
router.get('/projects.csv', requirePaidPlan, (req, res) => {
  const projects = db.prepare(`
    SELECT
      p.name, c.name as client_name, p.status, p.progress,
      p.budget, p.spent, p.due_date, p.created_at
    FROM projects p
    LEFT JOIN clients c ON p.client_id = c.id
    WHERE p.user_id = ?
    ORDER BY c.name ASC, p.name ASC
  `).all(req.user.id);

  const columns = ['name','client_name','status','progress','budget','spent','due_date','created_at'];
  const csv = toCSV(projects, columns);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="pulseboard-projects-${Date.now()}.csv"`);
  res.send(csv);
});

// GET /api/export/activities.csv
router.get('/activities.csv', requirePaidPlan, (req, res) => {
  const activities = db.prepare(`
    SELECT
      a.type, a.title, a.description, c.name as client_name, a.created_at
    FROM activities a
    LEFT JOIN clients c ON a.client_id = c.id
    WHERE a.user_id = ?
    ORDER BY a.created_at DESC
  `).all(req.user.id);

  const columns = ['type','title','description','client_name','created_at'];
  const csv = toCSV(activities, columns);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="pulseboard-activity-${Date.now()}.csv"`);
  res.send(csv);
});

module.exports = router;
