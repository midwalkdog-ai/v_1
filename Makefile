.PHONY: help dev build up down logs restart clean

# Default target
help:
	@echo ""
	@echo "  PulseBoard — Command Reference"
	@echo "  ─────────────────────────────────────────"
	@echo "  make dev        Start local dev servers (backend + frontend)"
	@echo "  make build      Build production Docker images"
	@echo "  make up         Start full stack with Docker Compose"
	@echo "  make down       Stop all containers"
	@echo "  make logs       Tail all container logs"
	@echo "  make restart    Restart all containers"
	@echo "  make clean      Remove containers, volumes, and images"
	@echo "  make setup      First-time setup (copy .env)"
	@echo ""

# First-time setup
setup:
	@if [ ! -f .env ]; then cp .env.example .env && echo "✅ Created .env — please update JWT_SECRET"; else echo "ℹ️  .env already exists"; fi

# Local development (requires Node 20+)
dev:
	@echo "Starting backend on :4000 and frontend on :3000..."
	@(cd backend && npm install --silent && node src/index.js &) && \
	 (cd frontend && npm install --silent && npm run dev)

# Docker production build + start
build:
	docker compose build --no-cache

up: setup
	docker compose up -d --build
	@echo ""
	@echo "✅ PulseBoard is running at http://localhost"
	@echo "   Demo login: demo@pulseboard.io / demo1234"

down:
	docker compose down

logs:
	docker compose logs -f

restart:
	docker compose restart

# Nuke everything (destructive)
clean:
	docker compose down -v --rmi local
	@echo "🗑️  Containers, volumes, and local images removed"
