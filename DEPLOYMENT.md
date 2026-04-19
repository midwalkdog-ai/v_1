# PulseBoard Deployment Guide

## Pre-flight Checklist

- [ ] Server with Docker + Docker Compose installed (Ubuntu 20.04+ or similar)
- [ ] Domain name and SSL certificate (or use Let's Encrypt)
- [ ] GitHub repository with secrets configured
- [ ] SSH key pair for deployment

## 1. Server Setup (One-time)

### Ubuntu/Debian Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create app directory
sudo mkdir -p /opt/pulseboard
sudo chown $USER:$USER /opt/pulseboard
```

### Generate SSH Key for CI/CD

On your local machine:
```bash
ssh-keygen -t ed25519 -f ~/.ssh/deploy_pulseboard -C "pulseboard-deploy"
```

Add public key to server:
```bash
# On server
mkdir -p ~/.ssh
cat > ~/.ssh/authorized_keys << 'EOF'
<paste contents of ~/.ssh/deploy_pulseboard.pub>
EOF
chmod 600 ~/.ssh/authorized_keys
```

Add private key to GitHub repository secrets as `DEPLOY_SSH_KEY`.

## 2. GitHub Secrets Configuration

In your GitHub repository, go to **Settings → Secrets and variables → Actions**

Add these secrets:
```
DEPLOY_HOST=your.server.ip.or.domain
DEPLOY_USER=ubuntu  # or your SSH user
DEPLOY_SSH_KEY=<private key from ~/.ssh/deploy_pulseboard>
DEPLOY_PORT=22  # or custom SSH port
DEPLOY_PATH=/opt/pulseboard
```

## 3. First Deploy

```bash
# SSH into server
ssh -i ~/.ssh/deploy_pulseboard ubuntu@your.server.ip

# Clone repo
cd /opt/pulseboard
git clone https://github.com/yourusername/pulseboard.git .

# Setup environment
cp .env.example .env

# Edit .env with production values
nano .env
```

**Key env vars to customize:**
```env
PORT=80
NODE_ENV=production
JWT_SECRET=<generate: openssl rand -base64 48>
CORS_ORIGIN=https://yourdomain.com
```

Start the stack:
```bash
docker compose up -d --build

# Check status
docker compose ps
docker compose logs -f
```

## 4. SSL/HTTPS with Let's Encrypt

### Using Nginx Proxy Manager (Recommended)

```bash
# Add to docker-compose.yml before starting:
# (See nginx-proxy-manager setup below)

docker compose up -d
```

### OR Manual Certbot

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com

# Update nginx config at /opt/pulseboard/nginx/nginx.conf:
# Replace:
#   listen 80;
# With:
#   listen 443 ssl http2;
#   ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
#   ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
#   ssl_protocols TLSv1.2 TLSv1.3;

# Mount certs in docker-compose.yml:
#   volumes:
#     - /etc/letsencrypt:/etc/letsencrypt:ro

# Restart
docker compose restart nginx

# Auto-renewal (runs daily)
sudo certbot renew --quiet
```

## 5. Monitoring & Health Checks

### Logs
```bash
# Tail all services
docker compose logs -f

# Just backend
docker compose logs -f backend

# Just frontend
docker compose logs -f frontend
```

### Health Endpoint
```bash
curl https://yourdomain.com/api/health
# Response: {"status":"ok","version":"1.0.0","service":"PulseBoard API"}
```

### Resource Monitoring
```bash
docker stats
```

## 6. Continuous Deployment

Every push to `main` triggers GitHub Actions:

1. **Lint & Build** — Ensures code quality
2. **Build Images** — Builds backend + frontend Docker images
3. **Push to GHCR** — Images stored in GitHub Container Registry
4. **Deploy via SSH** — Pulls latest images and restarts containers

Check deployment status: **GitHub → Actions → PulseBoard CI/CD**

## 7. Database Backups

### Automated Daily Backup

```bash
# Create backup script
cat > /opt/pulseboard/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/pulseboard/backups"
mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker compose exec -T backend cp /app/data/pulseboard.db $BACKUP_DIR/pulseboard_$TIMESTAMP.db
# Keep last 7 days only
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
EOF

chmod +x /opt/pulseboard/backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/pulseboard/backup.sh") | crontab -
```

### Restore from Backup

```bash
docker compose down
cp /opt/pulseboard/backups/pulseboard_TIMESTAMP.db /tmp/
docker compose up -d
docker compose exec -T backend cp /tmp/pulseboard_TIMESTAMP.db /app/data/pulseboard.db
docker compose restart backend
```

## 8. Scaling (Optional)

### Multiple Backend Instances

Update `docker-compose.yml`:
```yaml
services:
  backend:
    deploy:
      replicas: 3
```

Nginx will load-balance across them.

### Database Migration to PostgreSQL

Currently uses SQLite. For high traffic, migrate to PostgreSQL:

1. Install PostgreSQL Docker image
2. Update `backend/src/db/database.js` to use `pg` instead of `better-sqlite3`
3. Run migrations
4. Restart

## 9. Troubleshooting

### Container crashes
```bash
docker compose logs -f backend
# Check for database lock, out of memory, etc.
```

### API connection issues
```bash
# Test API from host
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost/api/clients

# Check network
docker network ls
docker network inspect pulseboard_pulseboard
```

### High CPU/Memory usage
```bash
docker stats

# Limit resources in docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
```

## 10. Security Hardening

- [ ] Change default JWT_SECRET
- [ ] Enable HTTPS only (redirect HTTP → HTTPS)
- [ ] Set CORS_ORIGIN to your domain only
- [ ] Use strong database backups with encryption
- [ ] Run security updates: `sudo unattended-upgrades`
- [ ] Configure firewall: `sudo ufw enable && ufw allow 22,80,443/tcp`

## 11. Support & Updates

Check for updates:
```bash
cd /opt/pulseboard
git pull origin main
docker compose pull
docker compose up -d --build
```

## Quick Commands

```bash
# SSH into server
ssh -i ~/.ssh/deploy_pulseboard ubuntu@your.server.ip

# Navigate to app
cd /opt/pulseboard

# View logs
docker compose logs -f

# Restart everything
docker compose restart

# Pull latest and restart
git pull origin main && docker compose pull && docker compose up -d --build

# Stop stack
docker compose down

# View database
docker compose exec backend sqlite3 /app/data/pulseboard.db ".tables"
```
