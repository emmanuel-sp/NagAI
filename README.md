# NagAI

A productivity app that helps you achieve your goals through AI-powered accountability. Set SMART goals, build action checklists, configure a personalized AI agent that nags/motivates you on schedule, and receive curated digests — all tailored to your profile.

## Architecture

```
Frontend (Next.js)          port 3000
     ↕  REST/JSON
Spring Boot Backend          port 8080
     ↕  gRPC (sync)         port 9090
     ↕  Kafka (async)       port 9092
Python AI Service
     ↕  Anthropic Claude API
```

- **gRPC**: Main synchronous communication between ai service and backend with strict typing.
- **Kafka**: Kafka is used to support scheduled, high-latency AI workflows (digest emails and agent messaging), where each task may take several seconds and must be processed reliably without blocking the backend.

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, CSS Modules |
| Backend | Spring Boot 4, Java, Maven, Spring Security (JWT + Google OAuth) |
| Database | PostgreSQL, Flyway migrations |
| AI Service | Python, gRPC, Kafka consumer |
| AI Model | Claude (Anthropic) via `anthropic` SDK |

## Prerequisites

- **Java 21+** and **Maven**
- **Node.js 18+**
- **Python 3.12+**
- **Docker** and **Docker Compose**

## Running Locally

### 1. Infrastructure (PostgreSQL + Kafka + Zookeeper)

```bash
docker compose up -d
```

This starts PostgreSQL (port 5432), Kafka (port 9092), and Zookeeper (port 2181). To stop:

```bash
docker compose down        # keep data
docker compose down -v     # wipe volumes (fresh DB)
```

To wipe and reset the schema only (safe — no real users in dev):
```bash
cd backend && mvn flyway:clean
```

### 2. Backend

```bash
cd backend
./mvnw spring-boot:run
```

Runs on `http://localhost:8080`. Schema is applied automatically via Flyway on startup.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:3000`. Requires `NEXT_PUBLIC_API_URL` if the backend is not on the default port:

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### 4. Python AI Service

```bash
cd ai
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env — set ANTHROPIC_API_KEY, SMTP credentials, DB credentials, NewsAPI key

# Compile proto stubs (required after any .proto change)
python -m grpc_tools.protoc \
  -I../backend/src/main/proto \
  --python_out=. \
  --grpc_python_out=. \
  ../backend/src/main/proto/ai_service.proto

# Start gRPC server (handles real-time AI requests)
python server.py

# Start Kafka consumer (separate terminal — handles digest delivery + agent messages)
python kafka_consumer.py
```

The gRPC server and Kafka consumer are **separate processes** — both must be running for full functionality.

## Environment Variables

### Backend (`backend/src/main/resources/application.properties`)

The defaults work for local development. Notable overrides via env vars:

| Env var | Default | Purpose |
|---|---|---|
| `GRPC_AI_HOST` | `localhost` | Python AI service host |
| `GRPC_AI_PORT` | `9090` | Python AI service gRPC port |
| `KAFKA_BOOTSTRAP` | `localhost:9092` | Kafka broker |

Google OAuth and email verification require real credentials — see comments in `application.properties`.

### Python AI Service (`ai/.env`)

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GRPC_PORT=9090
KAFKA_BOOTSTRAP=localhost:9092

# Email delivery (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Database (for sent digest/message persistence)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nagai
DB_USER=postgres
DB_PASSWORD=password

# Web search (NewsAPI.org — for news content in digests)
NEWSAPI_KEY=your_newsapi_key
```

## Project Structure

```
NagAI/
├── frontend/               Next.js app
│   ├── app/                Pages (App Router)
│   ├── components/         UI components (co-located CSS modules)
│   ├── services/           API call functions (one file per domain)
│   ├── types/              TypeScript interfaces
│   ├── lib/api.ts          Base fetch wrapper + auth headers
│   └── hooks/useAuth.ts    Route protection hook
│
├── backend/                Spring Boot app
│   └── src/main/java/com/nagai/backend/
│       ├── auth/           JWT auth + Google OAuth + email verification
│       ├── users/          User entity + profile endpoints
│       ├── goals/          Goal CRUD
│       ├── checklists/     Checklist items CRUD
│       ├── digests/        Digest CRUD + scheduled delivery (Kafka)
│       ├── agents/         AI agent + context CRUD
│       ├── ai/             gRPC client + AI REST endpoints
│       ├── config/         Security, Kafka, gRPC config
│       └── exceptions/     Domain exception classes
│   └── src/main/proto/
│       └── ai_service.proto   Shared gRPC contract (Java + Python)
│
├── ai/                     Python AI service
│   ├── server.py           gRPC server (real-time AI requests)
│   ├── ai_handlers.py      Claude API call implementations
│   ├── kafka_consumer.py   Async message consumer (digests + agents)
│   ├── digest_handler.py   Digest generation, HTML email rendering, SMTP delivery
│   ├── web_search.py       NewsAPI.org integration for news content
│   └── requirements.txt
│
├── docker-compose.yml      PostgreSQL + Kafka + Zookeeper
└── TODO.md                 Development plan (remaining steps)
```

## Observability

### Health Checks

**Backend (Spring Actuator)** — served on a separate management port (default `9091`), not exposed to users:
```bash
curl http://localhost:9091/actuator/health
# {"status":"UP","components":{"db":{"status":"UP"},"diskSpace":{"status":"UP"}}}

curl http://localhost:9091/actuator/metrics/nagai.digests.sent
curl http://localhost:9091/actuator/loggers
curl http://localhost:9091/actuator/info
```

No authentication needed — the management port is separate from the main app (port 8080) and should never be exposed publicly. Override with `MANAGEMENT_PORT` env var.

**Python AI Service (gRPC health)**:
```bash
# requires grpc-health-probe or grpcurl
grpcurl -plaintext localhost:9090 grpc.health.v1.Health/Check
```

**Docker containers**:
Both Postgres and Kafka have built-in health checks in `docker-compose.yml`:
```bash
docker compose ps   # shows health status
```

### Logging

All services emit structured JSON logs in production and human-readable logs in development.

**Backend** — controlled by Spring profile:
```bash
# Dev (default) — human-readable with correlation IDs
./mvnw spring-boot:run

# Production — JSON to stdout
SPRING_PROFILES_ACTIVE=prod ./mvnw spring-boot:run
```

**Python AI Service** — controlled by `LOG_FORMAT` env var:
```bash
# Dev (default) — human-readable
python server.py

# Production — JSON to stdout
LOG_FORMAT=json python server.py
```

**Frontend** — API call timing logged to browser console in development (`console.debug`).

### Correlation IDs

Every request gets an `X-Correlation-ID` header (8-char UUID) that flows across all three services:

```
Frontend (generates ID) → Backend (MDC) → gRPC metadata → Python AI Service (contextvars)
                                        → Kafka headers  → Python AI Service (contextvars)
```

All log lines include the correlation ID. Error responses from the backend include it in the JSON body (`correlationId` field) for debugging.

### Custom Metrics

Available at `/actuator/metrics/nagai.*`:

| Metric | Type | Description |
|---|---|---|
| `nagai.digests.sent` | Counter | Digest emails successfully queued to Kafka |
| `nagai.digests.failed` | Counter | Digest delivery failures |
| `nagai.agent_messages.sent` | Counter | Agent messages successfully queued |
| `nagai.agent_messages.failed` | Counter | Agent message failures |
| `nagai.grpc.errors` | Counter | gRPC call failures to the Python service |

### Error Tracking (Sentry)

The frontend uses `@sentry/nextjs` for production error tracking. To enable:

1. Create a free [Sentry](https://sentry.io) account and Next.js project
2. Add the DSN to `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
   ```

Sentry is disabled in development. Error boundaries (`error.tsx`, `global-error.tsx`) catch rendering errors and show a recovery UI instead of blank pages.

## Production Deployment (AWS EC2)

The backend, AI service, Kafka, Postgres, and Caddy run on a single EC2 instance via `docker-compose.prod.yml`. The frontend is deployed separately on Vercel.

### Setup

```bash
# First time — copy and fill in secrets
cp .env.example .env
nano .env

# Start everything
docker compose -f docker-compose.prod.yml up -d --build
```

### Deploying Updates

```bash
cd ~/NagAI
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

Only images with code changes are rebuilt. Postgres/Kafka/Caddy are unaffected.

### Container Status

```bash
# Overview of all containers
docker compose -f docker-compose.prod.yml ps

# Follow live logs (all services)
docker compose -f docker-compose.prod.yml logs -f

# Follow one service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f ai-service
```

### Health Checks

```bash
# Backend health (from inside the cluster — actuator is on port 9091, not exposed externally)
docker compose -f docker-compose.prod.yml exec ai-service python -c "
import urllib.request, urllib.error
try:
    print(urllib.request.urlopen('http://backend:9091/actuator/health').read().decode())
except urllib.error.HTTPError as e:
    print(e.read().decode())
"

# Quick HTTP status check from outside
curl -s -o /dev/null -w "%{http_code}" https://52.6.69.187.nip.io/users/me
# 403 = backend is up (no JWT token, so rejected by security filter)
```

### Debugging Logs

```bash
# Backend errors only
docker compose -f docker-compose.prod.yml logs backend | grep -i "ERROR\|Exception\|Caused by"

# AI service logs (digest/agent processing)
docker compose -f docker-compose.prod.yml logs ai-service --tail 100

# Caddy (TLS + reverse proxy)
docker compose -f docker-compose.prod.yml logs caddy --tail 30

# Kafka logs
docker compose -f docker-compose.prod.yml logs kafka --tail 50
```

### Database

```bash
# Open psql shell
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d nagai

# Quick queries without entering shell
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d nagai -c "SELECT * FROM users;"
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d nagai -c "SELECT * FROM sent_digests ORDER BY sent_at DESC LIMIT 5;"
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d nagai -c "SELECT * FROM sent_agent_messages ORDER BY sent_at DESC LIMIT 5;"
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d nagai -c "SELECT digest_id, name, active, frequency, next_delivery_at FROM digests;"
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d nagai -c "SELECT context_id, name, message_type, last_message_sent_at FROM agent_contexts;"

# Check Flyway migration status
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d nagai -c "SELECT * FROM flyway_schema_history;"
```

### Environment Variables

```bash
# Check what a container actually sees (useful for debugging .env issues)
docker compose -f docker-compose.prod.yml exec backend printenv | grep -i "SMTP\|DB_\|JWT\|CORS\|APP_BASE"
docker compose -f docker-compose.prod.yml exec ai-service printenv | grep -i "ANTHROPIC\|SMTP\|BACKEND\|NEWSAPI"
```

### Restart / Recreate

```bash
# Restart (keeps same container, just stops/starts process)
docker compose -f docker-compose.prod.yml restart backend ai-service

# Recreate (picks up .env changes — use this after editing .env)
docker compose -f docker-compose.prod.yml up -d --force-recreate backend ai-service

# Nuclear: wipe everything including database (DESTROYS ALL DATA)
docker compose -f docker-compose.prod.yml down -v
docker compose -f docker-compose.prod.yml up -d --build
```

### Resource Monitoring

```bash
# Container CPU/memory usage
docker stats --no-stream

# Disk usage
df -h
docker system df
```

### Kafka

```bash
# List topics
docker compose -f docker-compose.prod.yml exec kafka kafka-topics.sh --bootstrap-server localhost:9092 --list

# Read recent messages from a topic
docker compose -f docker-compose.prod.yml exec kafka kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic digest-delivery --from-beginning --max-messages 5
docker compose -f docker-compose.prod.yml exec kafka kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic agent-messages --from-beginning --max-messages 5
```

## Development Notes

### Proto changes
Whenever `ai_service.proto` is modified, regenerate stubs for **both** Java and Python:

```bash
# Java — run from backend/
mvn generate-sources

# Python — run from ai/
python -m grpc_tools.protoc \
  -I../backend/src/main/proto \
  --python_out=. \
  --grpc_python_out=. \
  ../backend/src/main/proto/ai_service.proto
```

The generated Python files (`ai_service_pb2*.py`) are build artifacts and not committed.

### Database migrations
The base schema lives in `backend/src/main/resources/db/migration/V1__init.sql`. **The app is deployed with real users** — never edit V1 directly. New schema changes must use incremental migration files (`V2__description.sql`, `V3__description.sql`, etc.). Flyway applies them automatically on startup.

For local development, you can still wipe and reset with `mvn flyway:clean`.

### Running tests
```bash
cd backend && ./mvnw test
```

Tests use Mockito — no running infrastructure needed.
