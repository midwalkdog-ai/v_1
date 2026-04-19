# PulseBoard — Getting Started

## 🎯 What is PulseBoard?

**Client Health & Revenue Intelligence for Agencies.**

Track health scores, MRR, project status, and alerts for all your clients in one place. Zero blind spots.

---

## ⚡ Quick Start (5 minutes)

### Option 1: Docker (Recommended)

**Requirements:** Docker + Docker Compose

```bash
# 1. Clone & setup
git clone https://github.com/yourusername/pulseboard.git
cd pulseboard
cp .env.example .env

# 2. Start (one command!)
docker compose up -d --build

# 3. Open browser
open http://localhost

# Demo login:
# Email:    demo@pulseboard.io
# Password: demo1234
```

**That's it.** Everything runs in Docker. No local Node install needed.

### Option 2: Local Development

**Requirements:** Node.js 20+, npm 10+

```bash
# Terminal 1 — Backend
cd backend && npm install && npm run dev
# Runs on :4000

# Terminal 2 — Frontend
cd frontend && npm install && npm run dev
# Runs on :3000 → open http://localhost:3000

# Demo login (same as above)
```

---

## 📚 Documentation

| Guide | For | Read |
|-------|-----|------|
| **README.md** | Overview | Start here |
| **API.md** | Backend devs | Endpoint reference |
| **DEVELOPMENT.md** | Developers | Setup + contribution guide |
| **DEPLOYMENT.md** | DevOps | Production deployment |

---

## 🏗️ Architecture

```
Browser (React 18 + Vite)
        ↓
  Nginx Reverse Proxy
    ↙         ↘
Frontend   Backend
(SPA)      (Express)
             ↓
          SQLite
```

- **Frontend:** React 18 + Vite + Tailwind CSS + Recharts
- **Backend:** Node.js + Express + SQLite
- **Proxy:** Nginx (routes `/api` → backend, `/` → frontend)
- **Deploy:** Docker Compose + GitHub Actions

---

## 🔑 Key Features

### 📊 Dashboard
- Real-time metrics (MRR, ARR, health scores)
- Active alerts with severity levels
- Recent activity feed
- Client health distribution pie chart
- Top clients by revenue

### 👥 Client Management
- Full CRUD with search/filter
- Health score tracking (auto-calculated)
- Contract renewal dates
- Project assignments
- Notes and activity history
- Bulk import/export (future)

### 📋 Project Tracking
- Kanban-style grouped board
- Budget tracking with spend alerts
- Progress monitoring
- Status management (active, delayed, completed, at-risk)
- Client mapping

### 📈 Analytics
- MRR trend chart (6-month history)
- Revenue by client bar chart
- Health score distribution
- Portfolio breakdown (pie chart)
- Full client health table

### 🔐 Security
- JWT authentication (7-day tokens)
- Password hashing (bcryptjs)
- Per-user data isolation
- CORS protection
- SQL injection prevention

---

## 🚀 Common Workflows

### I just want to try it

```bash
docker compose up -d
open http://localhost
# Demo: demo@pulseboard.io / demo1234
```

### I want to deploy to production

1. Read **DEPLOYMENT.md** (15 min)
2. Configure GitHub secrets
3. Push to `main` branch
4. GitHub Actions auto-deploys

### I want to add a feature

1. Read **DEVELOPMENT.md** (setup guide)
2. Create feature branch
3. Make changes (backend + frontend)
4. Test locally
5. Push & create PR

### I want to customize the branding

Edit these files:
- **Colors:** `frontend/tailwind.config.js`
- **Fonts:** `frontend/index.html` (Google Fonts link)
- **Logo:** `frontend/src/components/Sidebar.jsx`

---

## 📁 Project Files

```
pulseboard/
├── README.md                  Main overview
├── API.md                     API endpoint reference
├── DEVELOPMENT.md             Developer setup + guide
├── DEPLOYMENT.md              Production deployment
├── docker-compose.yml         Full stack orchestration
├── Makefile                   Quick commands (make help)
├── .env.example               Environment template
│
├── backend/                   Node.js + Express API
│   ├── src/
│   │   ├── db/                SQLite schema + health calc
│   │   ├── middleware/        JWT auth + health checks
│   │   ├── routes/            API endpoints (auth, clients, projects, analytics)
│   │   └── index.js           Express server
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                  React 18 + Vite SPA
│   ├── src/
│   │   ├── pages/             Login, Dashboard, Clients, Projects, Analytics, ClientDetail
│   │   ├── components/        Sidebar, Modals
│   │   ├── context/           AuthContext (JWT + user state)
│   │   ├── services/          Axios API client
│   │   └── App.jsx            Router + protected routes
│   ├── Dockerfile
│   ├── index.html
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── nginx/                     Reverse proxy
│   └── nginx.conf             Routes /api → backend, / → frontend
│
└── .github/workflows/         CI/CD pipeline
    └── deploy.yml             Auto-build, test, deploy on push
```

---

## 🔌 API Quick Reference

All endpoints require `Authorization: Bearer {token}` except login/register.

```bash
# Auth
POST   /api/auth/login
POST   /api/auth/register
GET    /api/auth/me

# Clients (full CRUD)
GET    /api/clients
GET    /api/clients/{id}
POST   /api/clients
PUT    /api/clients/{id}
DELETE /api/clients/{id}

# Projects (full CRUD)
GET    /api/projects
POST   /api/projects
PUT    /api/projects/{id}
DELETE /api/projects/{id}

# Analytics & Stats
GET    /api/analytics/overview
PATCH  /api/analytics/alerts/{id}/resolve

# Health Check
GET    /api/health
```

See **API.md** for full details.

---

## 💾 Database

Uses **SQLite** (embedded, zero setup). File location:
- **Docker:** `/app/data/pulseboard.db` (mounted as volume)
- **Local:** `./data/pulseboard.db` (created automatically)

### Backup

```bash
# Manual backup
cp data/pulseboard.db backups/pulseboard_$(date +%Y%m%d).db

# Restore
cp backups/pulseboard_YYYYMMDD.db data/pulseboard.db
```

See **DEPLOYMENT.md** for automated backups.

---

## 🌍 Deployment

### On Your Server (Ubuntu)

```bash
# SSH into server
ssh ubuntu@your.server.ip

# Clone repo
cd /opt/pulseboard && git clone <repo> .

# Setup .env
cp .env.example .env
nano .env  # Set JWT_SECRET, PORT, etc.

# Deploy
docker compose up -d --build

# Enable HTTPS (Let's Encrypt)
# See DEPLOYMENT.md for details
```

### Auto-Deploy via GitHub Actions

1. Add secrets to GitHub repo:
   - `DEPLOY_HOST` — server IP/domain
   - `DEPLOY_USER` — SSH user
   - `DEPLOY_SSH_KEY` — private key
   - `DEPLOY_PATH` — `/opt/pulseboard`

2. Push to `main` → auto-deploys

See **DEPLOYMENT.md** for detailed guide.

---

## ⚙️ Useful Commands

```bash
# Quick reference
make help

# Local development
make dev        # Start backend (:4000) + frontend (:3000)
make build      # Build Docker images
make up         # Start Docker Compose
make down       # Stop containers
make logs       # View logs
make restart    # Restart services
make clean      # Remove containers & volumes (destructive)

# Manual
docker compose ps              # View running services
docker compose logs -f         # Tail logs
docker compose exec backend sh # Shell into backend container
```

---

## 🐛 Troubleshooting

### Backend won't start
```bash
docker compose logs backend
# Check for port conflicts or database lock
```

### Frontend shows "Cannot GET"
```bash
# Make sure backend is running and reachable
curl http://localhost:4000/api/health
```

### Stuck on login screen
```bash
# Check browser console (F12)
# Clear localStorage: 
localStorage.clear()
# Reload page
```

### Permission denied on Linux
```bash
# Add user to docker group
sudo usermod -aG docker $USER
# Re-login or:
newgrp docker
```

---

## 🔐 Security Checklist

- [ ] Change default `JWT_SECRET` in `.env`
- [ ] Set `CORS_ORIGIN` to your domain (not `*` in prod)
- [ ] Enable HTTPS/SSL
- [ ] Set strong database backups
- [ ] Keep Docker images updated
- [ ] Use environment variables (never hardcode secrets)

---

## 📞 Support & Contributing

### Need Help?
- Check relevant doc: README, API, DEVELOPMENT, DEPLOYMENT
- See **Troubleshooting** section above
- Open an issue on GitHub

### Want to Contribute?
1. Read **DEVELOPMENT.md** (setup guide)
2. Create feature branch: `git checkout -b feature/your-feature`
3. Make changes (backend + frontend)
4. Test locally
5. Push & create PR

---

## 📊 Demo Data

On first startup, the database is seeded with:
- 1 demo user: `demo@pulseboard.io` / `demo1234`
- 6 sample clients (various health scores & status)
- 6 sample projects (mixed statuses)
- 3 sample alerts (critical + warning)

Use this to explore all features. Create real accounts as needed.

---

## 🎓 Learning Resources

- **Frontend:** [React](https://react.dev) + [Tailwind CSS](https://tailwindcss.com) + [Recharts](https://recharts.org)
- **Backend:** [Express.js](https://expressjs.com) + [SQLite](https://www.sqlite.org)
- **DevOps:** [Docker](https://docker.com) + [GitHub Actions](https://docs.github.com/en/actions)

---

## 📈 Roadmap (Future Features)

- [ ] Webhook alerts (Slack, email)
- [ ] Bulk client import/export (CSV)
- [ ] Client feedback surveys
- [ ] NPS tracking
- [ ] Integration: Stripe (for billing sync)
- [ ] Mobile app (React Native)
- [ ] PostgreSQL support (scale beyond SQLite)
- [ ] Role-based access control (RBAC)
- [ ] Audit logs
- [ ] Advanced reporting + PDF export

---

## 📝 License

MIT — Use freely, modify, distribute. See LICENSE file.

---

## 🚀 Quick Checklist

### First Time?
- [ ] Read this file (Getting Started)
- [ ] Run `docker compose up` (or `make dev`)
- [ ] Log in with demo credentials
- [ ] Explore Dashboard, Clients, Projects, Analytics

### Developer?
- [ ] Read DEVELOPMENT.md
- [ ] Clone repo + `npm install`
- [ ] Make changes locally
- [ ] Test with `docker compose up`

### DevOps/Production?
- [ ] Read DEPLOYMENT.md
- [ ] Prepare server (Ubuntu 20.04+)
- [ ] Set up GitHub secrets
- [ ] Push to `main` → auto-deploys

---

**Questions?** Check the relevant doc or open an issue. Happy building! 🚀
