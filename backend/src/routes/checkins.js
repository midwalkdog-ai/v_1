const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/database');
const auth = require('../middleware/auth');
const { updateClientHealthScore } = require('../db/utils');

const router = express.Router();
router.use(auth);

// GET /api/checkins?client_id=xxx  — list check-ins for a client
router.get('/', (req, res) => {
  const { client_id, limit = 20 } = req.query;
  let query = `
    SELECT a.*, c.name as client_name
    FROM activities a
    LEFT JOIN clients c ON a.client_id = c.id
    WHERE a.user_id = ?
  `;
  const params = [req.user.id];

  if (client_id) { query += ' AND a.client_id = ?'; params.push(client_id); }
  query += ` AND a.type = 'checkin' ORDER BY a.created_at DESC LIMIT ?`;
  params.push(parseInt(limit));

  res.json(db.prepare(query).all(...params));
});

// POST /api/checkins — log a new check-in against a client
// Body: { client_id, title, description, mood }
// mood: 'positive' | 'neutral' | 'negative'
router.post('/', (req, res) => {
  const { client_id, title, description, mood = 'neutral' } = req.body;
  if (!client_id) return res.status(400).json({ error: 'client_id required' });
  if (!title || !title.trim()) return res.status(400).json({ error: 'title required' });

  // Verify client belongs to user
  const client = db.prepare('SELECT id, name FROM clients WHERE id = ? AND user_id = ?').get(client_id, req.user.id);
  if (!client) return res.status(404).json({ error: 'Client not found' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO activities (id, user_id, client_id, type, title, description)
    VALUES (?, ?, ?, 'checkin', ?, ?)
  `).run(id, req.user.id, client_id, title.trim(), description || '');

  // Adjust health score based on mood
  const MOOD_DELTA = { positive: 5, neutral: 0, negative: -10 };
  const delta = MOOD_DELTA[mood] || 0;
  if (delta !== 0) {
    const current = db.prepare('SELECT health_score FROM clients WHERE id = ?').get(client_id);
    const newScore = Math.max(0, Math.min(100, (current?.health_score || 50) + delta));
    db.prepare('UPDATE clients SET health_score = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newScore, client_id);
  }

  const checkin = db.prepare(`
    SELECT a.*, c.name as client_name FROM activities a
    LEFT JOIN clients c ON a.client_id = c.id
    WHERE a.id = ?
  `).get(id);

  res.status(201).json(checkin);
});

// DELETE /api/checkins/:id — delete a check-in
router.delete('/:id', (req, res) => {
  const result = db.prepare(`
    DELETE FROM activities WHERE id = ? AND user_id = ? AND type = 'checkin'
  `).run(req.params.id, req.user.id);
  if (!result.changes) return res.status(404).json({ error: 'Check-in not found' });
  res.json({ success: true });
});

module.exports = router;
