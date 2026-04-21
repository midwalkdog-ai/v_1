const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/database');
const authMiddleware = require('../middleware/auth');
const { sendWelcomeEmail } = require('../services/email');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'pulseboard_secret_change_in_prod';

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const match = bcrypt.compareSync(password, user.password);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'All fields required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be 6+ characters' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) return res.status(409).json({ error: 'Email already in use' });

  const id = uuidv4();
  const hashed = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)').run(id, email.toLowerCase().trim(), hashed, name);

  const token = jwt.sign({ id, email: email.toLowerCase().trim(), name }, JWT_SECRET, { expiresIn: '7d' });
  // Fire welcome email async — don't block response
  sendWelcomeEmail({ to: email.toLowerCase().trim(), name }).catch(() => {});
  res.status(201).json({ token, user: { id, email: email.toLowerCase().trim(), name, role: 'admin' } });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// PUT /api/auth/profile — update display name
router.put('/profile', authMiddleware, (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name.trim(), req.user.id);
  const user = db.prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

// PUT /api/auth/password — change password (requires current)
router.put('/password', authMiddleware, (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) return res.status(400).json({ error: 'current_password and new_password required' });
  if (new_password.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const match = bcrypt.compareSync(current_password, user.password);
  if (!match) return res.status(401).json({ error: 'Current password is incorrect' });

  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(bcrypt.hashSync(new_password, 10), req.user.id);
  res.json({ success: true });
});

// DELETE /api/auth/account — permanently delete account and all data
router.delete('/account', authMiddleware, (req, res) => {
  const uid = req.user.id;
  db.prepare('DELETE FROM alerts WHERE user_id = ?').run(uid);
  db.prepare('DELETE FROM activities WHERE user_id = ?').run(uid);
  db.prepare('DELETE FROM projects WHERE user_id = ?').run(uid);
  db.prepare('DELETE FROM clients WHERE user_id = ?').run(uid);
  db.prepare('DELETE FROM subscriptions WHERE user_id = ?').run(uid);
  db.prepare('DELETE FROM users WHERE id = ?').run(uid);
  res.json({ success: true });
});

module.exports = router;
