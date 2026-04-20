const { DatabaseSync: Database } = require('node:sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/pulseboard.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(DB_PATH);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      stripe_customer_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      stripe_subscription_id TEXT UNIQUE,
      stripe_customer_id TEXT,
      plan_name TEXT NOT NULL,
      price_id TEXT,
      status TEXT DEFAULT 'trialing',
      current_period_start DATETIME,
      current_period_end DATETIME,
      trial_ends_at DATETIME,
      cancel_at_period_end INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      company TEXT,
      email TEXT,
      phone TEXT,
      status TEXT DEFAULT 'active',
      health_score INTEGER DEFAULT 100,
      mrr REAL DEFAULT 0,
      contract_value REAL DEFAULT 0,
      start_date TEXT,
      renewal_date TEXT,
      industry TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      progress INTEGER DEFAULT 0,
      due_date TEXT,
      budget REAL DEFAULT 0,
      spent REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      client_id TEXT,
      project_id TEXT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      client_id TEXT,
      severity TEXT DEFAULT 'warning',
      message TEXT NOT NULL,
      resolved INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Seed demo user if empty
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@pulseboard.io');
  if (!existing) {
    const userId = uuidv4();
    const hashed = bcrypt.hashSync('demo1234', 10);
    db.prepare(`INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)`).run(userId, 'demo@pulseboard.io', hashed, 'Alex Rivera');

    const clients = [
      { id: uuidv4(), name: 'Nexus Corp', company: 'Nexus Corp', email: 'cto@nexus.io', health: 92, mrr: 4500, cv: 54000, status: 'active', industry: 'SaaS', renewal: '2025-12-01' },
      { id: uuidv4(), name: 'Bright Media', company: 'Bright Media', email: 'ops@brightmedia.com', health: 67, mrr: 2200, cv: 26400, status: 'at-risk', industry: 'Media', renewal: '2025-06-15' },
      { id: uuidv4(), name: 'Forge Logistics', company: 'Forge Logistics', email: 'pm@forge.co', health: 85, mrr: 3100, cv: 37200, status: 'active', industry: 'Logistics', renewal: '2025-09-30' },
      { id: uuidv4(), name: 'Vela Health', company: 'Vela Health', email: 'ceo@velahealth.com', health: 45, mrr: 5800, cv: 69600, status: 'at-risk', industry: 'Healthcare', renewal: '2025-05-20' },
      { id: uuidv4(), name: 'Arc Design Studio', company: 'Arc Design Studio', email: 'hello@arcstudio.co', health: 98, mrr: 1800, cv: 21600, status: 'active', industry: 'Design', renewal: '2026-01-15' },
      { id: uuidv4(), name: 'Summit Analytics', company: 'Summit Analytics', email: 'data@summitagency.com', health: 78, mrr: 6200, cv: 74400, status: 'active', industry: 'Analytics', renewal: '2025-08-01' },
    ];

    const insertClient = db.prepare(`INSERT INTO clients (id, user_id, name, company, email, health_score, mrr, contract_value, status, industry, renewal_date, start_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, date('now', '-' || (abs(random()) % 365) || ' days'))`);
    for (const c of clients) {
      insertClient.run(c.id, userId, c.name, c.company, c.email, c.health, c.mrr, c.cv, c.status, c.industry, c.renewal);
    }

    // Seed projects
    const projects = [
      { id: uuidv4(), cid: clients[0].id, name: 'Platform Rebrand', status: 'active', progress: 72, budget: 12000, spent: 8640 },
      { id: uuidv4(), cid: clients[0].id, name: 'API Integration v2', status: 'active', progress: 35, budget: 8000, spent: 2800 },
      { id: uuidv4(), cid: clients[1].id, name: 'Content Automation', status: 'delayed', progress: 20, budget: 6000, spent: 1200 },
      { id: uuidv4(), cid: clients[2].id, name: 'Route Optimization Tool', status: 'active', progress: 90, budget: 15000, spent: 13500 },
      { id: uuidv4(), cid: clients[3].id, name: 'Patient Portal MVP', status: 'at-risk', progress: 15, budget: 22000, spent: 3300 },
      { id: uuidv4(), cid: clients[4].id, name: 'Brand System Refresh', status: 'completed', progress: 100, budget: 9000, spent: 8100 },
    ];
    const insertProject = db.prepare(`INSERT INTO projects (id, client_id, user_id, name, status, progress, budget, spent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    for (const p of projects) insertProject.run(p.id, p.cid, userId, p.name, p.status, p.progress, p.budget, p.spent);

    // Seed alerts
    const insertAlert = db.prepare(`INSERT INTO alerts (id, user_id, client_id, severity, message) VALUES (?, ?, ?, ?, ?)`);
    insertAlert.run(uuidv4(), userId, clients[3].id, 'critical', 'Vela Health: Health score dropped below 50. Renewal in 30 days.');
    insertAlert.run(uuidv4(), userId, clients[1].id, 'warning', 'Bright Media: Project "Content Automation" is 2 weeks behind schedule.');
    insertAlert.run(uuidv4(), userId, clients[3].id, 'warning', 'Vela Health: No check-in logged in 21 days.');
  }

  console.log('✅ Database initialized');
}

module.exports = { db, initDB };
