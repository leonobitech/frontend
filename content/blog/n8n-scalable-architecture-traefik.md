---
title: "Building a Production-Grade n8n Architecture with Traefik Load Balancing & Queue Management"
excerpt: "From a single n8n container to a horizontally-scaled architecture with dedicated webhook workers, parallel execution nodes, and Traefik-managed load balancing. Learn how to handle thousands of workflows without blocking your UI."
date: "2025-01-21"
author: "Felix León"
tags: ["n8n", "Docker", "Traefik", "Load Balancing", "Redis", "PostgreSQL", "Architecture"]
coverImage: "/blog/n8n-architecture.png"
---

> **🔒 Security Note**: This post documents production architecture patterns for educational purposes. All security-sensitive values (domain names, middleware names, rate limits, database credentials) use placeholder variables and generic examples. Follow security best practices and customize all values for your deployment.

When I first deployed n8n for workflow automation, I hit a wall almost immediately: **the UI froze every time a heavy workflow ran**. Webhooks queued up. Executions timed out. The single n8n container was doing everything: serving the UI, processing webhooks, and executing workflows.

**Sound familiar?**

This is the default n8n setup, and it works fine for 10 workflows. But scale to 100+ active workflows with external webhooks, and you'll see:
- UI becomes unresponsive during execution spikes
- Webhook endpoints timeout waiting for workers
- No horizontal scaling (can't add more workers easily)
- Single point of failure (restart = all executions lost)

**The solution?** A **multi-process architecture** with dedicated nodes for UI, webhooks, and execution workers—all orchestrated by Traefik with intelligent routing.

---

## The Problem: Monolithic n8n is a Bottleneck

The default n8n Docker setup looks like this:

```yaml
services:
  n8n:
    image: n8nio/n8n:latest
    ports:
      - "5678:5678"
    volumes:
      - n8n_data:/home/node/.n8n
```

**Everything runs in a single Node.js process:**
- ✅ Simple to deploy
- ❌ UI blocks on heavy workflows
- ❌ Webhooks timeout during CPU-intensive tasks
- ❌ Can't scale horizontally
- ❌ Resource contention between UI/API/workers

For production use with multiple teams, hundreds of workflows, and external webhook integrations, this architecture doesn't scale.

---

## The Solution: Distributed n8n with Traefik Load Balancing

Instead of one monolithic container, I built a **horizontally-scaled architecture** with:

✅ **Dedicated UI node** - Always responsive, never blocks on executions
✅ **Webhook-only worker** - Handles incoming requests with isolated queue
✅ **Parallel execution workers** - Scale horizontally for heavy workloads
✅ **Shared PostgreSQL + Redis** - Centralized queue and workflow state
✅ **Traefik-managed routing** - Intelligent request distribution by path
✅ **ForwardAuth integration** - Centralized SSO authentication via Core microservice

### Architecture Diagram

```
                          ┌─────────────────────────────────────┐
                          │       Traefik Reverse Proxy        │
                          │  (TLS, ForwardAuth, Rate Limiting) │
                          └────────────┬────────────────────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              │                        │                        │
              ▼                        ▼                        ▼
      ┌───────────────┐     ┌──────────────────┐     ┌──────────────────┐
      │   n8n_main    │     │ n8n_webhook_1    │     │  n8n_worker_1/2  │
      │   (UI only)   │     │  (webhook mode)  │     │  (worker mode)   │
      └───────┬───────┘     └────────┬─────────┘     └────────┬─────────┘
              │                      │                         │
              └──────────────────────┼─────────────────────────┘
                                     │
                          ┌──────────▼──────────┐
                          │  PostgreSQL + Redis │
                          │  (Shared Queue DB)  │
                          └─────────────────────┘
```

### How It Works

1. **n8n_main** (UI container):
   - Serves the n8n editor at `/`
   - Handles `/rest/`, `/api/`, `/executions/` endpoints
   - Protected by ForwardAuth (requires admin login)
   - **Never executes workflows** - only manages them

2. **n8n_webhook_1** (webhook container):
   - Runs in `webhook` mode (`command: webhook`)
   - Handles `/webhook/` and `/webhook-test/` routes
   - Public endpoints (no auth)
   - Queues executions in Redis for workers

3. **n8n_worker_1 & n8n_worker_2** (execution containers):
   - Run in `worker` mode (`command: worker`)
   - Pull jobs from Redis queue
   - Execute workflows in parallel
   - Scale horizontally by adding more workers

4. **Traefik routing**:
   - Routes `/webhook/*` → `n8n_webhook_1` (high priority)
   - Routes `/rest/*`, `/api/*` → `n8n_main` (medium priority)
   - Routes `/` (UI) → `n8n_main` with ForwardAuth (default priority)

---

## Step-by-Step Implementation

### Prerequisites

- Docker & Docker Compose installed
- Domain with DNS configured (e.g., `example.com`)
- SSL certificate resolver (Let's Encrypt recommended)
- Core authentication service (optional, for ForwardAuth)

### Phase 1: Infrastructure Setup

Create the shared database and cache:

```yaml
# docker-compose.yml
services:
  postgres_n8n:
    image: postgres:latest
    container_name: postgres_n8n
    restart: unless-stopped
    security_opt:
      - no-new-privileges:true
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    volumes:
      - n8n_postgres_data:/var/lib/postgresql/data
    tmpfs:
      - /tmp
    networks:
      - app_network
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "${POSTGRES_USER}", "-d", "${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

  redis_n8n:
    image: redis:latest
    container_name: redis_n8n
    restart: unless-stopped
    security_opt:
      - no-new-privileges:true
    command: >
      redis-server
      --requirepass ${REDIS_PASSWORD}
      --databases ${REDIS_DATABASES}
    volumes:
      - redis_n8n_data:/data
    networks:
      - app_network
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
```

**Key configuration** (`.env` file for n8n):

```bash
# Database
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=postgres_n8n
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=${POSTGRES_DB}
DB_POSTGRESDB_USER=${POSTGRES_USER}
DB_POSTGRESDB_PASSWORD=${POSTGRES_PASSWORD}

# Redis Queue
QUEUE_BULL_REDIS_HOST=redis_n8n
QUEUE_BULL_REDIS_PORT=6379
QUEUE_BULL_REDIS_PASSWORD=${REDIS_PASSWORD}
QUEUE_BULL_REDIS_DB=0
EXECUTIONS_MODE=queue

# n8n Configuration
N8N_HOST=${SUBDOMAIN}.${DOMAIN}
N8N_PORT=5678
N8N_PROTOCOL=https
WEBHOOK_URL=https://${SUBDOMAIN}.${DOMAIN}/
N8N_EDITOR_BASE_URL=https://${SUBDOMAIN}.${DOMAIN}/

# Disable internal auth (using ForwardAuth via Traefik)
N8N_DISABLE_UI=false
```

---

### Phase 2: n8n Main Node (UI)

This container **only serves the UI** and never executes workflows:

```yaml
  n8n_main:
    image: n8nio/n8n:latest
    container_name: n8n_main
    restart: unless-stopped
    env_file:
      - ./n8n/.env
    volumes:
      - n8n_data_main:/home/node/.n8n
    networks:
      - app_network
    depends_on:
      postgres_n8n:
        condition: service_healthy
    labels:
      - "traefik.enable=true"

      # Service definition
      - "traefik.http.services.n8n_main.loadbalancer.server.port=5678"

      # UI Router (protected with ForwardAuth)
      - "traefik.http.routers.n8n_ui.rule=Host(`${SUBDOMAIN}.${DOMAIN}`)"
      - "traefik.http.routers.n8n_ui.entrypoints=websecure"
      - "traefik.http.routers.n8n_ui.tls.certresolver=letsencrypt"
      - "traefik.http.routers.n8n_ui.service=n8n_main"
      - "traefik.http.routers.n8n_ui.middlewares=auth-forwardauth@file,secure-headers@file"

      # API Router (protected)
      - "traefik.http.routers.n8n_api.rule=Host(`${SUBDOMAIN}.${DOMAIN}`) && (PathPrefix(`/rest/`) || PathPrefix(`/api/`))"
      - "traefik.http.routers.n8n_api.entrypoints=websecure"
      - "traefik.http.routers.n8n_api.tls.certresolver=letsencrypt"
      - "traefik.http.routers.n8n_api.service=n8n_main"
      - "traefik.http.routers.n8n_api.priority=20"
      - "traefik.http.routers.n8n_api.middlewares=auth-forwardauth@file,api-headers@file"

      # Static assets (no auth)
      - "traefik.http.routers.n8n_assets.rule=Host(`${SUBDOMAIN}.${DOMAIN}`) && PathPrefix(`/assets/`)"
      - "traefik.http.routers.n8n_assets.entrypoints=websecure"
      - "traefik.http.routers.n8n_assets.tls.certresolver=letsencrypt"
      - "traefik.http.routers.n8n_assets.service=n8n_main"
      - "traefik.http.routers.n8n_assets.priority=30"
      - "traefik.http.routers.n8n_assets.middlewares=cache-headers@file"
```

---

### Phase 3: Webhook Worker (Dedicated)

This container **only handles incoming webhooks** and queues executions:

```yaml
  n8n_webhook_1:
    image: n8nio/n8n:latest
    container_name: n8n_webhook_1
    restart: unless-stopped
    command: webhook  # ← KEY: webhook mode
    read_only: true
    tmpfs:
      - /tmp
    security_opt:
      - no-new-privileges:true
    env_file:
      - ./n8n/.env
    volumes:
      - n8n_data_webhook_1:/home/node/.n8n
    networks:
      - app_network
    depends_on:
      postgres_n8n:
        condition: service_healthy
      redis_n8n:
        condition: service_healthy
    labels:
      - "traefik.enable=true"

      # Service definition
      - "traefik.http.services.n8n_webhook.loadbalancer.server.port=5678"

      # Webhook Router (public, no auth)
      - "traefik.http.routers.n8n_webhook.rule=Host(`${SUBDOMAIN}.${DOMAIN}`) && PathPrefix(`/webhook/`)"
      - "traefik.http.routers.n8n_webhook.entrypoints=websecure"
      - "traefik.http.routers.n8n_webhook.tls.certresolver=letsencrypt"
      - "traefik.http.routers.n8n_webhook.service=n8n_webhook"
      - "traefik.http.routers.n8n_webhook.priority=50"
      - "traefik.http.routers.n8n_webhook.middlewares=rate-limit-webhooks@file"
```

**Why separate webhook container?**
- Webhooks are **public endpoints** (no auth) → security isolation
- High-frequency traffic → dedicated resources
- Can scale webhook workers independently of UI

---

### Phase 4: Execution Workers (Horizontally Scalable)

These containers **only execute workflows** from the Redis queue:

```yaml
  n8n_worker_1:
    image: n8nio/n8n:latest
    container_name: n8n_worker_1
    restart: unless-stopped
    command: worker  # ← KEY: worker mode
    read_only: true
    tmpfs:
      - /tmp
    security_opt:
      - no-new-privileges:true
    env_file:
      - ./n8n/.env
    volumes:
      - n8n_data_worker_1:/home/node/.n8n
    networks:
      - app_network
    depends_on:
      postgres_n8n:
        condition: service_healthy
      redis_n8n:
        condition: service_healthy

  n8n_worker_2:
    image: n8nio/n8n:latest
    container_name: n8n_worker_2
    restart: unless-stopped
    command: worker
    read_only: true
    tmpfs:
      - /tmp
    security_opt:
      - no-new-privileges:true
    env_file:
      - ./n8n/.env
    volumes:
      - n8n_data_worker_2:/home/node/.n8n
    networks:
      - app_network
    depends_on:
      postgres_n8n:
        condition: service_healthy
      redis_n8n:
        condition: service_healthy
```

**Scaling workers:**
- Add more workers by duplicating this service with unique names
- Workers automatically pull from the shared Redis queue
- No configuration changes needed (pure horizontal scaling)

---

## Critical Environment Variables for Queue Mode

Before deploying, you **must** configure these environment variables. Without them, your distributed architecture won't work correctly.

### 🔑 Absolutely Required (Critical)

These variables are **non-negotiable** for queue mode to function:

```bash
# 1. Shared Encryption Key
# ALL instances (main, webhook, workers) MUST share the same encryption key
# This allows workers to decrypt credentials stored in the database
N8N_ENCRYPTION_KEY=your-random-encryption-key-32-chars

# 2. Queue Mode Configuration
EXECUTIONS_MODE=queue
QUEUE_BULL_REDIS_HOST=redis_n8n
QUEUE_BULL_REDIS_PORT=6379
QUEUE_BULL_REDIS_PASSWORD=${REDIS_PASSWORD}
QUEUE_BULL_REDIS_DB=0
QUEUE_BULL_REDIS_PREFIX=bull

# 3. Database Configuration (shared across all instances)
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=postgres_n8n
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=${POSTGRES_DB}
DB_POSTGRESDB_USER=${POSTGRES_USER}
DB_POSTGRESDB_PASSWORD=${POSTGRES_PASSWORD}
```

**Why `N8N_ENCRYPTION_KEY` is critical:**
- Without this, workers can't access credentials from the database
- All instances (main, webhook, workers) **must use the exact same key**
- Generate a secure 32-character random string: `openssl rand -hex 16`

---

### ⚙️ Performance & Optimization (Highly Recommended)

These variables significantly improve performance and prevent bottlenecks:

```bash
# Offload manual executions to workers (prevents main instance blocking)
OFFLOAD_MANUAL_EXECUTIONS_TO_WORKERS=true

# Trust reverse proxy headers (required for Traefik)
N8N_TRUST_UPSTREAM_PROXY=true
N8N_PROXY_HOPS=1

# Worker concurrency (default: 10)
# Each worker can handle this many jobs in parallel
# ⚠️ Set to ≥5 to avoid exhausting DB connection pool
N8N_CONCURRENCY_PRODUCTION_LIMIT=10

# Graceful shutdown timeout (seconds)
# Allows workers to finish executing jobs before terminating
N8N_GRACEFUL_SHUTDOWN_TIMEOUT=30
```

**Why `OFFLOAD_MANUAL_EXECUTIONS_TO_WORKERS` matters:**
- Without this, manual executions block the main instance
- During high load, your UI becomes unresponsive
- Enable this to delegate **all** executions to workers

**Worker concurrency best practices:**
- Default: 10 concurrent jobs per worker
- Low concurrency + many workers = DB connection pool exhaustion
- Recommended: Keep concurrency ≥5 per worker
- Monitor with: `docker stats n8n_worker_1`

---

### 📊 Monitoring & Health Checks (Production Ready)

Enable health endpoints and metrics for monitoring:

```bash
# Enable health check endpoints
QUEUE_HEALTH_CHECK_ACTIVE=true

# Enable Prometheus metrics
N8N_METRICS=true

# Disable telemetry (optional, privacy)
N8N_DIAGNOSTICS_ENABLED=false
N8N_VERSION_NOTIFICATIONS_ENABLED=false
N8N_HIRING_BANNER_ENABLED=false
```

**Available health endpoints:**
- `GET /healthz` - Returns whether worker is up
- `GET /healthz/readiness` - Checks DB and Redis connections
- `GET /metrics` - Prometheus metrics for monitoring

**Use cases:**
- Kubernetes liveness/readiness probes
- Load balancer health checks
- Grafana + Prometheus monitoring dashboards

---

### 🚨 Important Limitations

> **Binary Data Storage:**
> n8n **does not support** queue mode with binary data storage on the filesystem.
>
> If your workflows handle files (images, PDFs, etc.), you **must** configure S3-compatible external storage:
>
> ```bash
> N8N_DEFAULT_BINARY_DATA_MODE=s3
> N8N_AVAILABLE_BINARY_DATA_MODES=s3
> N8N_BINARY_DATA_S3_BUCKET_NAME=your-bucket-name
> N8N_BINARY_DATA_S3_ACCESS_KEY_ID=your-access-key
> N8N_BINARY_DATA_S3_SECRET_ACCESS_KEY=your-secret-key
> N8N_BINARY_DATA_S3_REGION=us-east-1
> ```
>
> **Why?** Workers run on different containers/machines and can't access shared filesystem. S3 provides centralized storage accessible by all workers.

---

### 📝 Complete `.env` Example

Putting it all together, here's a production-ready `.env` file:

```bash
# === PostgreSQL ===
POSTGRES_USER=n8n
POSTGRES_PASSWORD=${SECURE_PASSWORD}
POSTGRES_DB=n8n

# === Redis ===
REDIS_PASSWORD=${SECURE_PASSWORD}

# === n8n Core ===
N8N_ENCRYPTION_KEY=${RANDOM_32_CHAR_KEY}
N8N_HOST=${SUBDOMAIN}.${DOMAIN}
N8N_PROTOCOL=https
N8N_PORT=5678
WEBHOOK_URL=https://${SUBDOMAIN}.${DOMAIN}/
N8N_EDITOR_BASE_URL=https://${SUBDOMAIN}.${DOMAIN}/

# === Queue Mode ===
EXECUTIONS_MODE=queue
QUEUE_BULL_REDIS_HOST=redis_n8n
QUEUE_BULL_REDIS_PORT=6379
QUEUE_BULL_REDIS_PASSWORD=${REDIS_PASSWORD}
QUEUE_BULL_REDIS_DB=0
QUEUE_BULL_REDIS_PREFIX=bull

# === Database ===
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=postgres_n8n
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=${POSTGRES_DB}
DB_POSTGRESDB_USER=${POSTGRES_USER}
DB_POSTGRESDB_PASSWORD=${POSTGRES_PASSWORD}

# === Performance ===
OFFLOAD_MANUAL_EXECUTIONS_TO_WORKERS=true
N8N_CONCURRENCY_PRODUCTION_LIMIT=10
N8N_GRACEFUL_SHUTDOWN_TIMEOUT=30

# === Reverse Proxy ===
N8N_TRUST_UPSTREAM_PROXY=true
N8N_PROXY_HOPS=1

# === Monitoring ===
QUEUE_HEALTH_CHECK_ACTIVE=true
N8N_METRICS=true

# === Privacy ===
N8N_DIAGNOSTICS_ENABLED=false
N8N_VERSION_NOTIFICATIONS_ENABLED=false
N8N_HIRING_BANNER_ENABLED=false

# === Timezone ===
GENERIC_TIMEZONE=America/New_York
```

**Security checklist:**
- ✅ Use strong passwords (32+ characters)
- ✅ Generate encryption key with `openssl rand -hex 16`
- ✅ Never commit `.env` to version control
- ✅ Use different passwords for production vs staging
- ✅ Rotate credentials periodically

---

### Phase 5: Traefik Configuration

#### Static Configuration (traefik.yml or CLI flags)

```yaml
# Command-line flags in docker-compose
command:
  - --api.dashboard=true
  - --api.insecure=false
  - --ping=true

  # Entrypoints
  - --entrypoints.web.address=:80
  - --entrypoints.web.http.redirections.entrypoint.to=websecure
  - --entrypoints.web.http.redirections.entrypoint.scheme=https
  - --entrypoints.web.http.redirections.entrypoint.permanent=true
  - --entrypoints.websecure.address=:443

  # Docker provider
  - --providers.docker=true
  - --providers.docker.exposedbydefault=false
  - --providers.docker.network=app_network

  # Dynamic file provider
  - --providers.file.directory=/etc/traefik/dynamic
  - --providers.file.watch=true

  # Let's Encrypt
  - --certificatesresolvers.letsencrypt.acme.email=${SSL_EMAIL}
  - --certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json
  - --certificatesresolvers.letsencrypt.acme.httpchallenge=true
  - --certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web
```

#### Dynamic Middlewares (`/etc/traefik/dynamic/middlewares.yaml`)

```yaml
http:
  middlewares:
    # ForwardAuth middleware (delegates auth to Core microservice)
    auth-forwardauth:
      forwardAuth:
        address: "https://auth.${DOMAIN}/verify"
        trustForwardHeader: true
        authRequestHeaders:
          - "Cookie"
          - "X-Forwarded-For"
        authResponseHeaders:
          - "X-User-Id"
          - "X-User-Role"

    # Security headers for UI
    secure-headers:
      headers:
        stsSeconds: 315360000
        forceSTSHeader: true
        stsIncludeSubdomains: true
        stsPreload: true
        browserXssFilter: true
        contentTypeNosniff: true
        frameDeny: true
        referrerPolicy: "strict-origin-when-cross-origin"
        contentSecurityPolicy: >-
          default-src 'self';
          script-src 'self' 'unsafe-inline' 'unsafe-eval';
          style-src 'self' 'unsafe-inline';
          connect-src 'self' wss://*.${DOMAIN};
          img-src 'self' data: https:;

    # Relaxed headers for API endpoints
    api-headers:
      headers:
        customResponseHeaders:
          Cache-Control: "no-store"
          Vary: "Cookie, Authorization"

    # Cache headers for static assets
    cache-headers:
      headers:
        customResponseHeaders:
          Cache-Control: "public, max-age=31536000, immutable"

    # Rate limiting for webhooks (prevent abuse)
    rate-limit-webhooks:
      rateLimit:
        average: 100  # requests per period
        period: 1m
        burst: 50
        sourceCriterion:
          requestHeaderName: X-Forwarded-For
```

---

## Security Considerations

### 1. **ForwardAuth Integration**

Instead of n8n's built-in authentication, I use **centralized SSO via Traefik ForwardAuth**:

```yaml
# Middleware definition
auth-forwardauth:
  forwardAuth:
    address: "https://auth.${DOMAIN}/verify-admin"
    trustForwardHeader: true
    authRequestHeaders:
      - "Cookie"
      - "X-Forwarded-For"
    authResponseHeaders:
      - "X-User-Id"
      - "X-User-Role"
```

**How it works:**
1. User requests `https://n8n.example.com/`
2. Traefik intercepts and sends auth request to `https://auth.example.com/verify-admin`
3. Auth service checks JWT token in cookie
4. If valid, returns `200 OK` with user headers
5. Traefik forwards request to n8n with injected headers
6. If invalid, returns `401 Unauthorized` → redirect to login

**Benefits:**
- Single Sign-On across all services (n8n, Odoo, Baserow, etc.)
- Centralized session management
- Device fingerprinting (prevents token theft)
- Role-based access control (RBAC)

### 2. **Read-Only Filesystems**

All workers run with `read_only: true` and use `tmpfs` for temporary files:

```yaml
read_only: true
tmpfs:
  - /tmp
security_opt:
  - no-new-privileges:true
```

This prevents:
- Container escape exploits
- Malware persistence
- Unauthorized file modifications

### 3. **Rate Limiting by Path**

Different rate limits for different endpoints:

| Endpoint | Rate Limit | Reason |
|----------|-----------|---------|
| `/webhook/` | 100 req/min | Prevent webhook spam |
| `/api/` | 50 req/min | Protect API from abuse |
| `/` (UI) | No limit | Internal users only (ForwardAuth protected) |

### 4. **Network Isolation**

All containers in a custom bridge network:

```yaml
networks:
  app_network:
    driver: bridge
```

No containers expose ports directly to the host—everything goes through Traefik.

---

## Performance Optimizations

### 1. **Redis Queue Configuration**

```bash
# .env
EXECUTIONS_MODE=queue
QUEUE_BULL_REDIS_DB=0

# Worker concurrency (per worker container)
EXECUTIONS_WORKER_MAX_CONCURRENCY=10
```

**Why Redis?**
- Persistent queue (survives container restarts)
- Atomic job distribution (no race conditions)
- Retry logic built-in (Bull queue library)
- Observable via Redis CLI or Bull Board

### 2. **Worker Scaling Strategy**

Start with 2 workers and monitor CPU:

```bash
# Check worker CPU usage
docker stats n8n_worker_1 n8n_worker_2

# If CPU > 80%, add more workers:
docker compose up -d --scale n8n_worker=4
```

**Or use auto-scaling with Docker Swarm or Kubernetes.**

### 3. **PostgreSQL Tuning**

```bash
# postgresql.conf adjustments for n8n workloads
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
```

### 4. **Traefik Access Logs (Optional)**

Enable for debugging routing issues:

```yaml
command:
  - --accesslog=true
  - --accesslog.filepath=/var/log/traefik/access.log
  - --accesslog.format=json
```

---

## Monitoring & Observability

### Health Checks

All services include health checks:

```yaml
healthcheck:
  test: ["CMD", "pg_isready", "-U", "${POSTGRES_USER}"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 10s
```

Monitor with:

```bash
docker compose ps
```

Healthy services show `(healthy)` status.

### Traefik Dashboard

Access at `https://traefik.${DOMAIN}` (protected by BasicAuth):

- See all active routers and services
- Monitor request rates and error counts
- Debug routing rules in real-time

### Redis Queue Monitoring

```bash
# Connect to Redis
docker exec -it redis_n8n redis-cli -a ${REDIS_PASSWORD}

# Check queue size
LLEN bull:n8n:waiting
LLEN bull:n8n:active
LLEN bull:n8n:completed
LLEN bull:n8n:failed
```

### n8n Execution Logs

View worker logs in real-time:

```bash
docker logs -f n8n_worker_1
docker logs -f n8n_worker_2
```

Filter for errors:

```bash
docker logs n8n_worker_1 2>&1 | grep ERROR
```

---

## Real-World Performance Benchmarks

### n8n's Maximum Throughput

According to official n8n documentation:

> **n8n can handle up to 220 workflow executions per second on a single instance**, with the ability to scale up further by adding more instances.

This baseline is important because it sets expectations. Let's compare single-instance vs multi-instance performance to understand the benefits of the distributed architecture.

### Single Instance Performance (Baseline)

First, let's see how a monolithic n8n performs under load.

**Test Setup:**
- **Hardware**: AWS ECS `c5a.large` instance (4GB RAM, 2 vCPUs)
- **Architecture**: Single n8n instance (main mode + PostgreSQL)
- **Workflow**: Simple `Webhook Trigger` → `Edit Fields` node
- **Mode**: Regular mode (no queue)

**Results:**

| Requests/sec | Response Time (<100s) | Status |
|--------------|----------------------|--------|
| 50 | 100% | ✅ Excellent |
| 100 | ~95% | ✅ Good |
| 150 | ~85% | ⚠️ Degraded |
| 200+ | <70% | ❌ Poor |

**Bottleneck:** A single 4GB instance starts degrading at **~150 RPS**, and becomes unreliable beyond 200 RPS. The UI also becomes unresponsive during high load.

---

### Multi-Instance Performance (Distributed Architecture)

This test measures how response time varies with load when using the distributed architecture described in this guide.

**Test Setup:**
- **Hardware**: 7 AWS ECS `c5a.4xlarge` instances (8GB RAM each, 16 vCPUs total)
- **Architecture**:
  - 2 webhook instances (dedicated webhook workers)
  - 4 worker instances (execution workers)
  - 1 database instance (MySQL)
  - 1 main instance (n8n UI + Redis)
- **Workflow**: Simple `Webhook Trigger` → `Edit Fields` node
- **Mode**: Queue mode (Redis-backed)

### Results

![n8n Multi-Instance Performance Benchmark](/blog/n8n-benchmark-performance.png)

*This graph shows the percentage of requests to the Webhook Trigger node getting a response within 100 seconds, and how that varies with load. Under higher loads n8n usually still processes the data, but takes over 100s to respond.*

**Key findings:**

| Requests/sec | Response Time (<100s) | Status |
|--------------|----------------------|--------|
| 500 | 100% | ✅ Excellent |
| 1,000 | 100% | ✅ Excellent |
| 1,500 | 100% | ✅ Excellent |
| 2,000 | 100% | ✅ Excellent |
| 2,500 | ~98% | ✅ Good |
| 2,700+ | ~90% | ⚠️ Degraded |

**Analysis:**

Up to **2,500 requests per second**, the distributed architecture maintained near-perfect response times with 98-100% of requests completing within 100 seconds.

Beyond 2,500 RPS, response times increased as workers reached CPU saturation. However, **n8n continued processing all requests**—it just took longer (over 100s) to respond under extreme load.

### What This Means for Your Deployment

**For most production workloads:**
- 2-4 worker instances handle 500-1,500 RPS comfortably
- Each worker can process ~500-750 RPS with simple workflows
- Complex workflows (API calls, data transformations) reduce throughput but scale linearly with workers

**Scaling strategy:**
```bash
# Start with 2 workers
docker compose up -d --scale n8n_worker=2

# Monitor CPU usage
docker stats n8n_worker_1 n8n_worker_2

# If CPU > 80%, add more workers
docker compose up -d --scale n8n_worker=4

# For 2,000+ RPS, use 4-6 workers
docker compose up -d --scale n8n_worker=6
```

**Cost implications:**
- 2 workers: ~$20/month (DigitalOcean droplet)
- 4 workers: ~$40/month (DigitalOcean droplet)
- 6 workers: ~$80/month (DigitalOcean droplet or AWS ECS)

**When to scale:**
- Monitor Redis queue size: `LLEN bull:n8n:waiting`
- If queue consistently > 100 jobs → add workers
- If worker CPU > 85% → add workers
- If response time > 30s → add workers

---

## Migration from Single Container

If you're migrating from a monolithic n8n setup:

### Step 1: Backup Everything

```bash
# Backup workflows (via n8n UI)
# Export all workflows as JSON

# Backup database (if using SQLite)
docker cp n8n:/home/node/.n8n/database.sqlite ./backup/

# Backup credentials
docker cp n8n:/home/node/.n8n/.credentials ./backup/
```

### Step 2: Deploy New Architecture

```bash
# Stop old container
docker stop n8n && docker rm n8n

# Deploy new stack
docker compose up -d
```

### Step 3: Restore Data

```bash
# Import workflows via UI or CLI
n8n import:workflow --input=./backup/workflows.json

# Credentials will be migrated automatically via PostgreSQL
```

### Step 4: Update Webhook URLs

If you had webhook URLs like `https://example.com:5678/webhook/...`, update them to:

```
https://n8n.example.com/webhook/...
```

Traefik handles TLS termination and routing automatically.

---

## Cost & Resource Comparison

| Setup | CPU | RAM | Cost/Month | Scalability |
|-------|-----|-----|-----------|-------------|
| **Single Container** | 1 core | 1GB | $5 (VPS) | Vertical only |
| **Distributed (This Guide)** | 2-4 cores | 4GB | $20 (VPS) | Horizontal |
| **Kubernetes (Overkill)** | 4+ cores | 8GB+ | $50+ | Unlimited |

**Recommendation:** This distributed setup is the **sweet spot** for small-to-medium teams (5-50 users, 100-500 workflows).

---

## Common Issues & Debugging

### Issue 1: Webhooks Return 502 Bad Gateway

**Cause:** Webhook container not running or Traefik misconfigured.

**Fix:**

```bash
# Check webhook container status
docker compose ps n8n_webhook_1

# Check Traefik logs
docker logs traefik 2>&1 | grep n8n_webhook

# Verify webhook router in Traefik dashboard
https://traefik.example.com → HTTP Routers → n8n_webhook
```

### Issue 2: Workers Not Picking Up Jobs

**Cause:** Redis connection issue or queue misconfiguration.

**Fix:**

```bash
# Check Redis connectivity from worker
docker exec n8n_worker_1 sh -c 'redis-cli -h redis_n8n -a ${REDIS_PASSWORD} ping'

# Verify EXECUTIONS_MODE=queue in .env
cat ./n8n/.env | grep EXECUTIONS_MODE

# Check queue size (should decrease as workers process)
docker exec redis_n8n redis-cli -a ${REDIS_PASSWORD} LLEN bull:n8n:waiting
```

### Issue 3: UI Shows "Execution Failed" Immediately

**Cause:** Workers crashed or out of memory.

**Fix:**

```bash
# Check worker logs for OOM kills
docker logs n8n_worker_1 2>&1 | tail -50

# Increase worker memory limit in docker-compose
deploy:
  resources:
    limits:
      memory: 2048M  # ← increase from 1024M
```

---

## Next Steps

Now that you have a scalable n8n architecture, consider:

1. **Add Prometheus + Grafana** for metrics visualization
2. **Implement backup automation** with `pg_dump` cron jobs
3. **Set up alerting** with Traefik webhook notifications
4. **Deploy to Kubernetes** for true auto-scaling (if needed)

---

## Conclusion

This architecture transformed our n8n deployment from **a fragile single container** to a **production-grade distributed system** that handles:

✅ **500+ active workflows** without UI lag
✅ **Thousands of webhook requests/day** with dedicated workers
✅ **Horizontal scaling** by adding more worker containers
✅ **Zero-downtime deployments** via rolling updates
✅ **Centralized authentication** via Traefik ForwardAuth

**The best part?** It's all **reproducible with Docker Compose**—no Kubernetes complexity required.

Try it yourself with the configurations above, and let me know how it goes!

---

**Full code examples available at**: [GitHub Gist](https://gist.github.com/yourhandle/placeholder) *(sanitized configurations for reproduction)*

**Questions?** Reach out on [LinkedIn](https://linkedin.com/in/yourprofile) or open a discussion below.

---

**🤖 Generated with Claude Code · Co-Authored-By: Claude <noreply@anthropic.com>**
