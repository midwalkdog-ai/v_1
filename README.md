# PulseBoard — Client Intelligence Platform

> **Track client health, revenue, projects, and alerts in one place.**  
> Zero blind spots for agencies.

[![Build Status](https://img.shields.io/github/actions/workflow/status/yourusername/pulseboard/deploy.yml?branch=main)](https://github.com/yourusername/pulseboard/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D%2020-brightgreen)](https://nodejs.org/)

---

## 🎯 Quick Start

### Docker (Recommended)
```bash
git clone https://github.com/yourusername/pulseboard.git
cd pulseboard
cp .env.example .env
docker compose up -d
open http://localhost
```

### Local Development
```bash
# Backend
cd backend && npm install && npm run dev  # :4000

# Frontend (new terminal)
cd frontend && npm install && npm run dev  # :3000
```

**Demo credentials:** `demo@pulseboard.io` / `demo1234`

**→ [Full Getting Started Guide →](GETTING_STARTED.md)**

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **[GETTING_STARTED.md](GETTING_STARTED.md)** | **Start here** — 5-min quick start + overview |
| **[API.md](API.md)** | Complete API endpoint reference |
| **[DEVELOPMENT.md](DEVELOPMENT.md)** | Developer setup, architecture, contribution guide |
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | Production deployment to your server |

---

## 🎨 Features

✅ **Dashboard** — Real-time metrics, alerts, activity feed  
✅ **Client Management** — CRUD, health tracking, notes  
✅ **Project Tracking** — Kanban board, budgets, progress  
✅ **Analytics** — Revenue charts, health distribution  
✅ **Authentication** — JWT-based, secure  
✅ **Responsive** — Mobile-friendly dark UI  
✅ **One-Click Deploy** — Docker + GitHub Actions  

---

## 🏗️ Stack

```
Frontend          Backend             Database
React 18          Node.js + Express   SQLite
+ Vite            + Middleware        (embedded)
+ Tailwind        + Routes            
+ Recharts        + Auth              
```

**Deployment:**  
`Docker Compose` → `Nginx` → `GitHub Actions → GHCR → SSH Deploy`

---

## 📦 What's Included

- ✅ Full-stack React + Node.js application
- ✅ SQLite database with seed data (6 demo clients)
- ✅ Docker Compose orchestration
- ✅ Nginx reverse proxy configuration
- ✅ GitHub Actions CI/CD pipeline
- ✅ Production-ready security headers
- ✅ Dark mode SaaS UI (Tailwind CSS)
- ✅ Real charts & dashboards (Recharts)
- ✅ Comprehensive documentation

---

## 🚀 Deployment

### Docker (Local)
```bash
make up
# Container running on http://localhost
```

### Production Server
1. SSH into server
2. Clone repo to `/opt/pulseboard`
3. Configure `.env`
4. `docker compose up -d --build`
5. Set up HTTPS (see [DEPLOYMENT.md](DEPLOYMENT.md))

### Auto-Deploy via GitHub
```bash
# Set repo secrets:
DEPLOY_HOST=your.server.ip
DEPLOY_USER=ubuntu
DEPLOY_SSH_KEY=<private key>

# Push to main → auto-deploys
git push origin main
```

**→ [Full Deployment Guide →](DEPLOYMENT.md)**

---

## 🛠️ Development

### Setup
```bash
cp .env.example .env
cd backend && npm install
cd ../frontend && npm install
```

### Run Locally
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Open `http://localhost:3000`

**→ [Full Development Guide →](DEVELOPMENT.md)**

---

## 📖 API

All endpoints require JWT authentication (except login/register).

```bash
# Auth
POST   /api/auth/login
POST   /api/auth/register

# Clients
GET    /api/clients
POST   /api/clients
PUT    /api/clients/{id}
DELETE /api/clients/{id}

# Projects
GET    /api/projects
POST   /api/projects
PUT    /api/projects/{id}

# Analytics
GET    /api/analytics/overview
PATCH  /api/analytics/alerts/{id}/resolve
```

**→ [Full API Reference →](API.md)**

---

## 🔐 Security

- JWT authentication (7-day tokens)
- Password hashing (bcryptjs)
- SQL injection prevention (parameterized queries)
- CORS protection
- Security headers (HSTS, CSP, X-Frame-Options, etc.)
- Per-user data isolation

**Never commit secrets.** Use `.env` file.

---

## 🎯 Use Cases

**For Agency Owners:**
- Monitor all client health scores at a glance
- Spot at-risk accounts before they churn
- Track project progress and budgets
- Generate revenue reports

**For Account Managers:**
- Manage client relationships and notes
- Track renewal dates
- Monitor project deadlines
- Respond to critical alerts

**For Developers:**
- Build on proven stack (React, Node.js)
- Dark SaaS UI template ready to customize
- Fully self-contained (no external APIs)
- Open source (MIT licensed)

---

## 📊 Data Models

### Clients
- Name, company, email, phone
- MRR, contract value, renewal date
- Health score (auto-calculated)
- Status: active, at-risk, churned
- Notes & activity history

### Projects
- Name, status, progress %
- Budget tracking & spend
- Due dates, client assignment
- Statuses: active, completed, delayed, at-risk

### Health Score Algorithm
Automatically calculated based on:
- Days since last contact
- Overdue projects
- Renewal approaching
- Budget overruns

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Make changes (read [DEVELOPMENT.md](DEVELOPMENT.md))
4. Test locally
5. Push & create pull request

---

## 📝 License

MIT License — see [LICENSE](LICENSE) file

---

## 💬 Support

- 📖 **Documentation:** See docs above
- 🐛 **Issues:** Open a GitHub issue
- 💡 **Suggestions:** Discussions section

---

## 🚀 Getting Started

**Ready to build?**

1. **5-min quickstart:** [GETTING_STARTED.md](GETTING_STARTED.md)
2. **Local development:** [DEVELOPMENT.md](DEVELOPMENT.md)
3. **Production deploy:** [DEPLOYMENT.md](DEPLOYMENT.md)
4. **API reference:** [API.md](API.md)

---

Made with ❤️ for agencies that care about their clients.

