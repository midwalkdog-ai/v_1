const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/database');
const auth = require('../middleware/auth');
const { enforceClientLimit } = require('../middleware/subscription');

const router = express.Router();
router.use(auth);

// GET /api/clients
router.get('/', (req, res) => {
  const { status, search } = req.query;
  let query = 'SELECT * FROM clients WHERE user_id = ?';
  const params = [req.user.id];

  if (status && status !== 'all') { query += ' AND status = ?'; params.push(status); }
  if (search) { query += ' AND (name LIKE ? OR company LIKE ? OR email LIKE ?)'; const s = `%${search}%`; params.push(s, s, s); }

  query += ' ORDER BY health_score ASC';
  const clients = db.prepare(query).all(...params);
  res.json(clients);
});

// GET /api/clients/:id
router.get('/:id', (req, res) => {
  const client = db.prepare('SELECT * FROM clients WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!client) return res.status(404).json({ error: 'Client not found' });

  const projects = db.prepare('SELECT * FROM projects WHERE client_id = ? ORDER BY created_at DESC').all(req.params.id);
  const activities = db.prepare('SELECT * FROM activities WHERE client_id = ? ORDER BY created_at DESC LIMIT 10').all(req.params.id);
  res.json({ ...client, projects, activities });
});

// POST /api/clients
router.post('/', enforceClientLimit, (req, res) => {
  const { name, company, email, phone, mrr, contract_value, industry, renewal_date, start_date, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Client name required' });

  const id = uuidv4();
  db.prepare(`INSERT INTO clients (id, user_id, name, company, email, phone, mrr, contract_value, industry, renewal_date, start_date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, req.user.id, name, company || '', email || '', phone || '', mrr || 0, contract_value || 0, industry || '', renewal_date || '', start_date || '', notes || '');

  // Log activity
  db.prepare(`INSERT INTO activities (id, user_id, client_id, type, title) VALUES (?, ?, ?, ?, ?)`).run(uuidv4(), req.user.id, id, 'client_added', `Added client: ${name}`);

  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
  res.status(201).json(client);
});

// PUT /api/clients/:id
router.put('/:id', (req, res) => {
  const client = db.prepare('SELECT * FROM clients WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!client) return res.status(404).json({ error: 'Client not found' });

  const fields = ['name', 'company', 'email', 'phone', 'mrr', 'contract_value', 'industry', 'renewal_date', 'start_date', 'notes', 'status', 'health_score'];
  const updates = [];
  const params = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) { updates.push(`${f} = ?`); params.push(req.body[f]); }
  }
  if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(req.params.id, req.user.id);

  db.prepare(`UPDATE clients SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`).run(...params);
  const updated = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/clients/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM clients WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (!result.changes) return res.status(404).json({ error: 'Client not found' });
  res.json({ success: true });
});

module.exports = router;
