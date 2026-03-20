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

- **gRPC**: Real-time AI suggestions (SMART goal fields, checklist generation)
- **Kafka**: Async scheduled delivery (digest emails/SMS, agent messages)

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
All schema lives in a single file: `backend/src/main/resources/db/migration/V1__init.sql`. Since there are no production users, edit it directly and wipe the DB with `mvn flyway:clean` to apply changes.

### Running tests
```bash
cd backend && ./mvnw test
```

Tests use Mockito — no running infrastructure needed.
