# Development Guide

## Prerequisites

- Node.js 20+
- npm 10+
- SQLite 3+ (usually pre-installed)
- Docker + Docker Compose (optional, for testing full stack)

## Quick Start

### 1. Setup

```bash
# Clone repo
git clone https://github.com/yourusername/pulseboard.git
cd pulseboard

# Copy environment config
cp .env.example .env

# Install dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2. Run Locally

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:4000
# Includes hot-reload via nodemon
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
# Includes hot-reload via Vite
```

Visit `http://localhost:3000`

**Demo credentials:**
- Email: `demo@pulseboard.io`
- Password: `demo1234`

---

## Project Structure

```
pulseboard/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── database.js       ← SQLite schema + seeding
│   │   │   └── utils.js          ← Health score calculation
│   │   ├── middleware/
│   │   │   ├── auth.js           ← JWT verification
│   │   │   └── healthcheck.js    ← Auto health recalc
│   │   ├── routes/
│   │   │   ├── auth.js           ← Auth endpoints
│   │   │   ├── clients.js        ← Client CRUD
│   │   │   ├── projects.js       ← Project CRUD
│   │   │   └── analytics.js      ← Dashboard data
│   │   └── index.js              ← Express app
│   ├── package.json
│   ├── nodemon.json              ← Dev auto-reload config
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── pages/                ← React pages
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Clients.jsx
│   │   │   ├── ClientDetail.jsx
│   │   │   ├── Projects.jsx
│   │   │   └── Analytics.jsx
│   │   ├── components/
│   │   │   └── Sidebar.jsx       ← Navigation
│   │   ├── context/
│   │   │   └── AuthContext.jsx   ← Auth state + login logic
│   │   ├── services/
│   │   │   └── api.js            ← Axios API client
│   │   ├── App.jsx               ← Router
│   │   ├── main.jsx              ← Entry point
│   │   └── index.css             ← Tailwind styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── Dockerfile
│
├── nginx/
│   └── nginx.conf                ← Reverse proxy config
├── .github/workflows/
│   └── deploy.yml                ← CI/CD pipeline
├── README.md
├── API.md                        ← Endpoint reference
├── DEPLOYMENT.md                 ← Production guide
└── Makefile                      ← Convenient commands
```

---

## Common Development Tasks

### Add a New API Endpoint

**1. Create route handler** in `backend/src/routes/newfeature.js`:
```javascript
const express = require('express');
const { db } = require('../db/database');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth); // Protect all routes

router.get('/', (req, res) => {
  const data = db.prepare('SELECT * FROM table WHERE user_id = ?').all(req.user.id);
  res.json(data);
});

module.exports = router;
```

**2. Register route** in `backend/src/index.js`:
```javascript
app.use('/api/newfeature', require('./routes/newfeature'));
```

**3. Create API service** in `frontend/src/services/api.js`:
```javascript
export const newfeatureAPI = {
  list: () => api.get('/newfeature'),
  get: (id) => api.get(`/newfeature/${id}`),
  create: (data) => api.post('/newfeature', data),
  update: (id, data) => api.put(`/newfeature/${id}`, data),
  delete: (id) => api.delete(`/newfeature/${id}`),
};
```

**4. Use in React component:**
```javascript
import { newfeatureAPI } from '../services/api';

export default function MyComponent() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    newfeatureAPI.list().then(res => setData(res.data));
  }, []);
  
  return <div>{/* render data */}</div>;
}
```

---

### Add a New Page

**1. Create page** in `frontend/src/pages/NewPage.jsx`:
```javascript
import { useEffect, useState } from 'react';
import { someAPI } from '../services/api';

export default function NewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    someAPI.list()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-white">New Page</h1>
      {/* Content here */}
    </div>
  );
}
```

**2. Add route** in `frontend/src/App.jsx`:
```javascript
import NewPage from './pages/NewPage';

// Inside Routes:
<Route path="/newpage" element={<ProtectedRoute><NewPage /></ProtectedRoute>} />
```

**3. Add nav link** in `frontend/src/components/Sidebar.jsx`:
```javascript
const NAV = [
  // ... existing items
  { to: '/newpage', label: 'New Page', icon: <svg>...</svg> },
];
```

---

### Modify Database Schema

**1. Edit migration** in `backend/src/db/database.js`:
```javascript
function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS newtable (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
  // ... rest of schema
}
```

**2. Re-seed** (will drop and recreate on `npm run dev`):
```bash
cd backend
rm /tmp/*.db  # or wherever your DB is
npm run dev
```

---

### Style Components with Tailwind

PulseBoard uses a custom dark theme. Key colors in `frontend/tailwind.config.js`:

```javascript
colors: {
  pulse: {
    bg:        '#0A0B0F',    // Background
    card:      '#111318',    // Card backgrounds
    border:    '#1E2130',    // Borders
    accent:    '#00E5A0',    // Green accent
    accentDim: '#00E5A015',  // Transparent accent
    warn:      '#FF6B35',    // Orange warning
    crit:      '#FF2D55',    // Red critical
    blue:      '#4A9EFF',    // Blue accent
    text:      '#E8EAF0',    // Main text
    muted:     '#6B7280',    // Secondary text
  },
}
```

**Usage:**
```jsx
<div className="bg-pulse-card border border-pulse-border rounded-xl p-5 text-pulse-text">
  <span className="text-pulse-accent">Highlighted text</span>
</div>
```

---

## Testing

### Manual Testing

1. **Auth flow:** Register, login, check token stored in localStorage
2. **CRUD:** Create/edit/delete clients, projects
3. **Search & filter:** Test search box, status filters
4. **Responsive:** Test on mobile (DevTools)
5. **Dark mode:** Verify all colors in dark background

### Browser DevTools

```javascript
// Test API calls
fetch('/api/clients', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('pb_token')}` }
}).then(r => r.json()).then(console.log);
```

---

## Code Style

### Backend (Node.js)
- Use `const` > `let`
- Prefer arrow functions
- SQL queries: parameterized (prevent SQL injection)
- Error handling: try/catch or `.catch()`
- Logging: `console.log()` with context

### Frontend (React)
- Functional components + hooks only
- Custom hooks for logic reuse
- Props > context (unless needed globally)
- Tailwind classes over inline styles
- Error boundaries in pages (future improvement)

---

## Debugging

### Backend
```bash
# Verbose logging
DEBUG=* npm run dev

# Inspect database
sqlite3 /path/to/pulseboard.db
sqlite> .tables
sqlite> SELECT * FROM clients LIMIT 1;
sqlite> .exit
```

### Frontend
```javascript
// In Chrome DevTools:
// 1. Network tab → see API calls
// 2. Storage tab → see localStorage (auth token)
// 3. Console tab → logs from React
// 4. React DevTools extension → component tree, props
```

---

## Committing Changes

```bash
# Before commit
npm run build  # Frontend
cd backend && npm run lint  # (future)

# Commit
git add .
git commit -m "feat: add new feature description"
git push origin feature-branch
```

**Commit message format:**
- `feat:` new feature
- `fix:` bug fix
- `refactor:` code cleanup
- `docs:` documentation
- `test:` tests (future)

---

## Deployment to Testing Environment

```bash
# Build images locally
docker compose build

# Start full stack
docker compose up -d

# Tail logs
docker compose logs -f

# Stop
docker compose down
```

---

## Performance Tips

### Frontend
- Use `React.memo()` for expensive components (future)
- Code-split pages with `React.lazy()` (future)
- Minimize re-renders with `useCallback()` (future)

### Backend
- Index frequently queried columns (future)
- Cache health scores (already done)
- Use connection pooling if switching to PostgreSQL

---

## Common Errors & Solutions

**"CORS error"**
- Check `CORS_ORIGIN` in `.env`
- In dev, set to `*`

**"JWT token invalid"**
- Token might be expired (7 day lifetime)
- Check `localStorage.getItem('pb_token')`
- Clear and re-login

**"Database is locked"**
- Multiple processes accessing SQLite
- Restart backend: `npm run dev` in terminal

**"Port already in use"**
```bash
# Find process on port
lsof -i :4000
# Kill it
kill -9 <PID>
```

---

## Resources

- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Vite](https://vitejs.dev)
- [Express.js](https://expressjs.com)
- [SQLite](https://www.sqlite.org)
- [Recharts](https://recharts.org)

---

## Getting Help

- Check `/API.md` for endpoint signatures
- Look at existing pages for component patterns
- Run `make help` for quick commands
