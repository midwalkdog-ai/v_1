# PulseBoard API Reference

Base URL: `/api`

**Authentication:** All endpoints except `/auth/login` and `/auth/register` require `Authorization: Bearer {token}` header.

---

## Authentication

### POST `/auth/register`
Create a new account.

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass123"
}
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "admin"
  }
}
```

---

### POST `/auth/login`
Authenticate and get JWT token.

**Body:**
```json
{
  "email": "john@example.com",
  "password": "securepass123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

---

### GET `/auth/me`
Get current user info.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "id": "uuid",
  "email": "john@example.com",
  "name": "John Doe",
  "role": "admin",
  "created_at": "2024-04-19T..."
}
```

---

## Clients

### GET `/clients`
List all clients for authenticated user.

**Query Params:**
- `status` (optional): `all` | `active` | `at-risk` | `churned` (default: all)
- `search` (optional): search by name, company, email

**Response (200):**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Acme Corp",
    "company": "Acme Corp",
    "email": "contact@acme.com",
    "phone": "555-0123",
    "status": "active",
    "health_score": 87,
    "mrr": 5000,
    "contract_value": 60000,
    "industry": "SaaS",
    "renewal_date": "2025-12-01",
    "start_date": "2024-01-15",
    "notes": "Key account...",
    "created_at": "2024-01-15T...",
    "updated_at": "2024-04-19T..."
  }
]
```

---

### GET `/clients/{id}`
Get a single client with projects and activities.

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Acme Corp",
  ... (all client fields),
  "projects": [
    {
      "id": "uuid",
      "name": "Platform Redesign",
      "status": "active",
      "progress": 65,
      "due_date": "2024-06-30",
      "budget": 25000,
      "spent": 15000,
      "created_at": "2024-03-01T..."
    }
  ],
  "activities": [
    {
      "id": "uuid",
      "type": "client_added",
      "title": "Added client: Acme Corp",
      "created_at": "2024-01-15T..."
    }
  ]
}
```

---

### POST `/clients`
Create a new client.

**Body:**
```json
{
  "name": "New Client Inc",
  "company": "New Client Inc",
  "email": "contact@newclient.com",
  "phone": "555-9876",
  "mrr": 3000,
  "contract_value": 36000,
  "industry": "Healthcare",
  "renewal_date": "2025-06-30",
  "start_date": "2024-01-01",
  "notes": "Important account"
}
```

**Response (201):** Client object

---

### PUT `/clients/{id}`
Update a client.

**Body:** Any subset of client fields (only changed fields required)
```json
{
  "health_score": 75,
  "status": "at-risk",
  "notes": "Updated notes"
}
```

**Response (200):** Updated client object

---

### DELETE `/clients/{id}`
Delete a client (and associated projects/activities).

**Response (200):**
```json
{ "success": true }
```

---

## Projects

### GET `/projects`
List projects for authenticated user.

**Query Params:**
- `status` (optional): `active` | `completed` | `delayed` | `at-risk` | `paused`
- `client_id` (optional): filter by client

**Response (200):**
```json
[
  {
    "id": "uuid",
    "client_id": "uuid",
    "name": "Platform Redesign",
    "status": "active",
    "progress": 65,
    "due_date": "2024-06-30",
    "budget": 25000,
    "spent": 15000,
    "client_name": "Acme Corp",
    "created_at": "2024-03-01T..."
  }
]
```

---

### POST `/projects`
Create a new project.

**Body:**
```json
{
  "client_id": "uuid",
  "name": "Mobile App Redesign",
  "status": "active",
  "progress": 0,
  "due_date": "2024-08-31",
  "budget": 40000
}
```

**Response (201):** Project object

---

### PUT `/projects/{id}`
Update a project.

**Body:**
```json
{
  "progress": 75,
  "spent": 30000,
  "status": "active"
}
```

**Response (200):** Updated project object

---

### DELETE `/projects/{id}`
Delete a project.

**Response (200):**
```json
{ "success": true }
```

---

## Analytics

### GET `/analytics/overview`
Get dashboard overview data: metrics, alerts, activities, health distribution, top clients.

**Response (200):**
```json
{
  "metrics": {
    "totalClients": 12,
    "atRisk": 2,
    "mrr": 45000,
    "arr": 540000,
    "avgHealth": 78,
    "activeProjects": 8,
    "delayedProjects": 1
  },
  "alerts": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "client_id": "uuid",
      "severity": "critical",
      "message": "Vela Health health score dropped below 50",
      "resolved": 0,
      "created_at": "2024-04-19T...",
      "client_name": "Vela Health"
    }
  ],
  "recentActivity": [
    {
      "id": "uuid",
      "type": "project_created",
      "title": "New project: API Integration v2",
      "client_name": "Nexus Corp",
      "created_at": "2024-04-18T..."
    }
  ],
  "healthDistribution": [
    { "category": "Healthy", "count": 8 },
    { "category": "Moderate", "count": 2 },
    { "category": "At Risk", "count": 1 },
    { "category": "Critical", "count": 1 }
  ],
  "topClients": [
    {
      "id": "uuid",
      "name": "Summit Analytics",
      "company": "Summit Analytics",
      "mrr": 6200,
      "health_score": 92,
      "status": "active"
    }
  ]
}
```

---

### PATCH `/analytics/alerts/{id}/resolve`
Mark an alert as resolved.

**Response (200):**
```json
{ "success": true }
```

---

## Health Check

### GET `/health`
System health check (no auth required).

**Response (200):**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "service": "PulseBoard API"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Email and password required"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid credentials"
}
```

### 404 Not Found
```json
{
  "error": "Client not found"
}
```

### 409 Conflict
```json
{
  "error": "Email already in use"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Client Health Score Algorithm

Health scores (0–100) are automatically calculated based on:

- **Days since last contact** (-10 to -40 points)
- **Overdue projects** (-15 per delayed project, max -40)
- **Renewal approaching** (-20 if < 30 days, -50 if overdue)
- **Budget overruns** (-15 if spending > 110% of budget)

Scores are recalculated:
- Every request in development
- Every 6 hours in production
- Manual recalc via: `PATCH /analytics/clients/{id}/recalc` (future)

---

## Rate Limiting

Currently unlimited. In production, implement:
- 100 requests/minute per IP
- 10 requests/second per auth token

---

## Webhooks (Future)

Planned webhook events:
- `client.health_dropped`
- `project.overdue`
- `alert.critical`

Subscribe via dashboard when available.
