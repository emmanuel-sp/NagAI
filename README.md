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
- **Docker** (for PostgreSQL and optionally Kafka)

## Running Locally

### 1. Database (PostgreSQL)

```bash
docker run -d \
  --name postgres-nagai \
  -e POSTGRES_DB=nagai \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:latest
```

To wipe and reset the schema (safe — no real users in dev):
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
# Edit .env — set ANTHROPIC_API_KEY

# Compile proto stubs (required after any .proto change)
python -m grpc_tools.protoc \
  -I../backend/src/main/proto \
  --python_out=. \
  --grpc_python_out=. \
  ../backend/src/main/proto/ai_service.proto

# Start gRPC server
python server.py

# Start Kafka consumer (separate terminal, requires Kafka running)
python kafka_consumer.py
```

### 5. Kafka (optional — needed for digest/agent scheduling)

```bash
# Zookeeper
docker run -d --name zookeeper -p 2181:2181 zookeeper:latest

# Kafka broker
docker run -d --name kafka \
  -p 9092:9092 \
  -e KAFKA_ZOOKEEPER_CONNECT=localhost:2181 \
  -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092 \
  confluentinc/cp-kafka:latest
```

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
│       ├── digests/        Digest configuration CRUD
│       ├── agents/         AI agent + context CRUD
│       ├── ai/             gRPC client + AI REST endpoints
│       ├── config/         Security, Kafka, gRPC config
│       └── exceptions/     Domain exception classes
│   └── src/main/proto/
│       └── ai_service.proto   Shared gRPC contract (Java + Python)
│
├── ai/                     Python AI service
│   ├── server.py           gRPC server
│   ├── ai_handlers.py      Claude API call implementations
│   ├── kafka_consumer.py   Async message consumer
│   └── requirements.txt
│
└── TODO.md                 Development plan (remaining steps)
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
All schema lives in a single file: `backend/src/main/resources/db/migration/V1__init.sql`. Since there are no production users, edit it directly and wipe the DB with `mvn flyway:clean` to apply changes.

### Running tests
```bash
cd backend && ./mvnw test
```

Tests use Mockito — no running infrastructure needed.
