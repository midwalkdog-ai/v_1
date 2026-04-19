const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/database');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// GET /api/projects
router.get('/', (req, res) => {
  const { client_id, status } = req.query;
  let query = `SELECT p.*, c.name as client_name, c.company FROM projects p LEFT JOIN clients c ON p.client_id = c.id WHERE p.user_id = ?`;
  const params = [req.user.id];
  if (client_id) { query += ' AND p.client_id = ?'; params.push(client_id); }
  if (status) { query += ' AND p.status = ?'; params.push(status); }
  query += ' ORDER BY p.created_at DESC';
  res.json(db.prepare(query).all(...params));
});

// POST /api/projects
router.post('/', (req, res) => {
  const { client_id, name, status, due_date, budget } = req.body;
  if (!client_id || !name) return res.status(400).json({ error: 'client_id and name required' });

  const client = db.prepare('SELECT id FROM clients WHERE id = ? AND user_id = ?').get(client_id, req.user.id);
  if (!client) return res.status(404).json({ error: 'Client not found' });

  const id = uuidv4();
  db.prepare(`INSERT INTO projects (id, client_id, user_id, name, status, due_date, budget) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(id, client_id, req.user.id, name, status || 'active', due_date || '', budget || 0);

  db.prepare(`INSERT INTO activities (id, user_id, client_id, project_id, type, title) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(uuidv4(), req.user.id, client_id, id, 'project_created', `New project: ${name}`);

  res.status(201).json(db.prepare(`SELECT p.*, c.name as client_name FROM projects p LEFT JOIN clients c ON p.client_id = c.id WHERE p.id = ?`).get(id));
});

// PUT /api/projects/:id
router.put('/:id', (req, res) => {
  const proj = db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!proj) return res.status(404).json({ error: 'Project not found' });

  const fields = ['name', 'status', 'progress', 'due_date', 'budget', 'spent'];
  const updates = []; const params = [];
  for (const f of fields) { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); params.push(req.body[f]); } }
  if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(req.params.id, req.user.id);
  db.prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`).run(...params);
  res.json(db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id));
});

// DELETE /api/projects/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM projects WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (!result.changes) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

module.exports = router;
