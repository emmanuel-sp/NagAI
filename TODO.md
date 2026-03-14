# NagAI Backend Completion Plan

---

## Manual Prerequisites (Things You Must Do)

1. **AI API Key** — Get an API key from Anthropic (Claude) or OpenAI. Set as env var in the Python service.
2. **Kafka** — Run locally via Docker (Zookeeper + Kafka broker on port 9092), or use a free Confluent Cloud cluster.
3. **Email delivery** — Sign up for SendGrid (free tier) or AWS SES. Get an API key and verify a sender email.
4. **SMS delivery** — Sign up for Twilio (free trial). Get account SID, auth token, and a Twilio phone number. Required for phone channel.
5. **Environment files** — You'll need `.env` files for the Python AI service and updated `application.properties` for Spring Boot.

---

## Architecture

```
Frontend (Next.js)
     ↕ REST
Spring Boot Backend
     ↕ gRPC (sync — user waits for result)
     ↕ Kafka (async — fire and forget)
Python AI Service
     ↕ Anthropic/OpenAI API
```

- **gRPC**: Synchronous AI calls (SMART goal suggestions, checklist generation)
- **Kafka**: Async scheduled tasks (digest delivery, agent messages)

---

## Completed

- Digest backend (DB + CRUD API) + DigestServiceTest (8 test cases)
- Digest frontend integration
- Agent backend (DB + CRUD API) + AgentServiceTest
- Agent frontend integration
- Profile: Password Change Endpoint (`PUT /users/me/password`) + UserServiceTest
- gRPC + Kafka infrastructure (proto, AiGrpcClientService, KafkaConfig, Python service)
- AI SMART goal suggestions backend + frontend
- AI checklist generation backend + frontend

---

## Steps

---

### Step 1 — Agent Backend: Database + CRUD API
**Difficulty: Medium**

**Context:** Each user has one agent with multiple contexts (per goal). Agent has deployed state and a communication channel (email/phone).

**Suggested backend files:**
- `backend/src/main/java/com/nagai/backend/agents/` — two entities (Agent, AgentContext), repositories, DTOs, controller, service
- Exception classes following existing pattern in `backend/src/main/java/com/nagai/backend/exceptions/`
- `backend/src/test/java/com/nagai/backend/agents/AgentServiceTest.java`

**DB:** Add agent and agent_contexts tables to `V1__init.sql`. Agent needs: `agent_id`, `user_id` (unique FK), name, is_deployed, communication_channel, timestamps. AgentContext needs: `context_id`, `agent_id` (FK), `goal_id` (FK, nullable — goal may be deleted), name, message_type, message_frequency, custom_instructions, timestamps.

**Reference files:**
- `backend/src/main/java/com/nagai/backend/checklists/ChecklistController.java` (nested resource pattern)
- `backend/src/main/java/com/nagai/backend/goals/GoalService.java`
- `backend/src/main/java/com/nagai/backend/digests/DigestService.java` (one-per-user pattern)
- `backend/src/test/java/com/nagai/backend/digests/DigestServiceTest.java` (test pattern)

**Endpoints:**
- `GET /agent` — get user's agent (auto-create with defaults if not exists)
- `PUT /agent/communication` — update channel
- `POST /agent/deploy` — mark deployed
- `POST /agent/stop` — mark stopped
- `POST /agent/contexts` — add context
- `PATCH /agent/contexts/{contextId}` — update context
- `DELETE /agent/contexts/{contextId}` — delete context

**After implementing:** Write `AgentServiceTest` covering all service methods, then run `./mvnw test` — all tests should pass.

---

### Step 2 — Agent Frontend Integration
**Difficulty: Medium**

**Context:** Remove all mock/stub code from agentService. The `agentId` param in current service functions can be dropped since there's one agent per user (backend derives it from JWT).

**Frontend files to modify:**
- `frontend/services/agentService.ts` — replace mock with real `apiRequest` calls, simplify signatures
- `frontend/types/agent.ts` — align with backend response (`id` → `agentId`, `contextId`, dates as strings)
- `frontend/components/agent-builder/AgentBuilderContainer.tsx`
- `frontend/components/agent-builder/AgentOverview.tsx`, `ContextCard.tsx`, `ContextList.tsx`, `CommunicationSettings.tsx`, `DeploymentPanel.tsx`, `CreateContextModal.tsx`, `EditContextModal.tsx`
- `frontend/components/dashboard/DashboardOverview.tsx` — fix `agent.isDeployed` and `agent.contexts.length` field names

---

### Step 3 — Profile: Password Change Endpoint
**Difficulty: Easy**

**Context:** Frontend calls `PUT /users/me/password` but this endpoint doesn't exist yet.

**Suggested backend files:**
- `backend/src/main/java/com/nagai/backend/users/PasswordChangeRequest.java`

**Backend files to modify:**
- `backend/src/main/java/com/nagai/backend/users/UserController.java` — add `PUT /users/me/password`
- `backend/src/main/java/com/nagai/backend/users/UserService.java` — add password update with current-password verification

**Reference files:**
- `backend/src/main/java/com/nagai/backend/auth/AuthService.java` (password hashing pattern)
- `backend/src/main/java/com/nagai/backend/users/UserRequest.java`

**Frontend files to verify:**
- `frontend/services/profileService.ts`
- `frontend/components/profile/ProfileContainer.tsx`

**After implementing:** Add password change test cases to `backend/src/test/java/com/nagai/backend/users/` and run `./mvnw test`.

---

### Step 4 — gRPC + Kafka Infrastructure
**Difficulty: Hard**

**Context:** Foundation for all AI features. The `pom.xml` already has gRPC dependencies but no `.proto` files or implementations exist. Kafka must be added.

**Suggested backend files:**
- `backend/src/main/proto/ai_service.proto` — gRPC service definition for AI calls
- Kafka producer config and gRPC client config (Spring beans)

**`pom.xml` to modify:**
- Add `spring-kafka` dependency
- Confirm protobuf plugin is configured to compile `.proto` on build

**`application.properties` to modify:**
- Kafka bootstrap servers
- gRPC client address for Python service

**Suggested Python service (new `ai/` directory):**
- gRPC server entry point
- Handlers for each AI request type (smart goal, checklist, digest, agent message)
- Kafka consumer for async tasks
- `requirements.txt` (grpcio, grpcio-tools, kafka-python, anthropic or openai, python-dotenv)
- `.env.example`

**Proto service definition should cover (at minimum):**
- `SuggestSmartField` — takes goal context + field name, returns suggestion string
- `GenerateChecklistItem` — takes goal context + existing items, returns suggestion
- `GenerateFullChecklist` — takes goal context, returns list of items

**After implementing:** Write a Spring Boot integration test that sends a gRPC request to a mock Python stub and verifies the response contract. Run `./mvnw test`.

> **Manual verification required:** Start Kafka + Python gRPC server and confirm connectivity before proceeding to Steps 5-6.

---

### Step 5 — AI SMART Goal Suggestions: Backend + Python
**Difficulty: Medium**

**Context:** Replace the keyword-matching mock in `aiGoalService.ts`. User clicks "AI Suggest" on a SMART field → sync gRPC call to Python → LLM returns suggestion.

**Suggested backend files:**
- `backend/src/main/java/com/nagai/backend/ai/` — REST controller + service that calls Python via gRPC, DTOs

**Endpoint:** `POST /ai/smart-goal-suggestion`

**Python:** Implement the `SuggestSmartField` gRPC handler using LLM. Prompt should include goal title, description, and which SMART field is being filled.

**Reference files:**
- `frontend/services/aiGoalService.ts` (to see expected request/response shape)
- `frontend/components/goals/SmartFieldGroup.tsx`

**After implementing:** Write a unit test mocking the gRPC client call and run `./mvnw test`.

---

### Step 6 — AI SMART Goal Frontend Integration
**Difficulty: Easy**

**Frontend files to modify:**
- `frontend/services/aiGoalService.ts` — uncomment and activate real API call
- `frontend/components/goals/AddGoalModal.tsx`, `EditGoalModal.tsx`, `SmartFieldGroup.tsx` — verify error states for failed AI calls

---

### Step 7 — AI Checklist Generation: Backend + Python
**Difficulty: Medium**

**Context:** Replace hardcoded stub in `aiChecklistService.ts`. Two flows: single item suggestion, full checklist from scratch.

**Backend endpoints:**
- `POST /ai/checklist-item` — single suggestion (takes goalId + existing items)
- `POST /ai/full-checklist` — full checklist (takes goalId)

**Suggested backend files:**
- Add to `backend/src/main/java/com/nagai/backend/ai/` — new endpoints + DTOs

**Python:** Implement `GenerateChecklistItem` and `GenerateFullChecklist` gRPC handlers. Fetch goal details from request to provide context to LLM.

**Reference files:**
- `frontend/services/aiChecklistService.ts`
- `backend/src/main/java/com/nagai/backend/goals/GoalService.java` (to look up goal context)

**After implementing:** Write unit tests mocking the gRPC client and run `./mvnw test`.

---

### Step 8 — AI Checklist Frontend Integration
**Difficulty: Easy**

**Frontend files to modify:**
- `frontend/services/aiChecklistService.ts` — uncomment and activate real API calls
- `frontend/components/checklists/ChecklistsContainer.tsx`, `Checklist.tsx` — verify AI button loading/error states

---

### Step 9 — AI Context Richness
**Difficulty: Medium**

**Context:** AI calls work but run on thin context. Two problems: (1) the user profile has no age or life context field — both are high-signal for personalizing goal and checklist suggestions; (2) checklist AI only sees item titles, not completion status or SMART field breakdown, even though the backend already holds this data. This step enriches both without adding frontend configuration overhead. Steps 10 and 11 should also draw on this enriched context when generating digest and agent message content.

**Profile additions (backend + frontend):**
- Add `age` (Integer) and `life_context` (TEXT) to `User`, `UserRequest`, `UserResponse`, `V1__init.sql`
- Update `UserService.updateUser()` to set both
- Add `age` to Basic Info card (number input) and `life_context` to Professional card (textarea, label: "What are you working towards in life?") in `ProfileContainer.tsx`
- Add an "AI Context" section to the profile page showing completeness count (X of 7: age, career, bio, interests, hobbies, habits, life_context) — client-side only, no backend needed

**Checklist AI enrichment (backend-only):**
- Add `completed_items` (repeated string, field 5) and `goal_smart_context` (string, field 6) to `ChecklistItemRequest` in `ai_service.proto`
- Add `completed_items` (field 4) and `goal_smart_context` (field 5) to `FullChecklistRequest`
- `AiController` injects `ChecklistRepository`, loads all items for the goal from DB (splits active vs completed) — frontend no longer needs to send `existingTitles`
- Add `buildGoalSmartContext(Goal)` helper in `AiController` formatting all filled SMART fields as a string
- Update `buildUserProfile()` to include age and life_context
- Update `AiGrpcClientService` method signatures to pass the new fields
- Update `ai_handlers.py` to include active items, completed items, and SMART context in checklist prompts
- Update `ai/server.py` to pass new proto fields to handlers
- Remove `existingTitles` from `ChecklistItemSuggestionRequest.java` and `aiChecklistService.ts`

**Reference files:**
- `backend/src/main/java/com/nagai/backend/ai/AiController.java` (existing buildUserProfile pattern)
- `backend/src/main/java/com/nagai/backend/checklists/ChecklistItem.java` (entity fields)
- `backend/src/main/proto/ai_service.proto` (extend existing messages, additive only)
- `ai/ai_handlers.py`, `ai/server.py`

**After implementing:** Update `AiGrpcClientServiceTest` and `AiControllerTest` for new method signatures. Run `./mvnw test`. Verify Claude references completed items when suggesting and aligns suggestions with SMART fields. Confirm profile completeness indicator updates in UI.

> **Manual step:** Regenerate Python stubs (`python -m grpc_tools.protoc -I../backend/src/main/proto --python_out=. --grpc_python_out=. ../backend/src/main/proto/ai_service.proto`) and wipe DB + restart Spring Boot to pick up V1 schema additions.

---

### Step 10 — Digest Delivery: Kafka + Python
**Difficulty: Hard**

**Context:** Active digests should generate and send content on schedule. Fully async — Spring Boot schedules + publishes Kafka events; Python consumes and delivers.

**Suggested backend files:**
- A Spring `@Scheduled` component that queries active digests due for delivery and publishes events to Kafka
- A Kafka producer bean (can be shared with Step 11)

**Backend files to modify:**
- `backend/src/main/java/com/nagai/backend/digests/DigestService.java` — add logic to update `last_delivered_at` / `next_delivery_at`

**Python:** Kafka consumer subscribes to digest topic, generates personalized content with LLM based on `contentTypes`, sends via email (SendGrid) or SMS (Twilio) based on user's preferred channel.

**Note:** Decide whether to store user communication preference on the Digest or pull from User entity (phone_number already exists on User).

**After implementing:** Write unit tests for the scheduler and DigestService delivery logic. Run `./mvnw test`.

> **Manual verification required:** Temporarily reduce the schedule interval, activate a digest, and confirm email/SMS is received.

---

### Step 11 — Conversational AI Agent: LangChain + Email Replies
**Difficulty: Hard**

**Context:** The agent should feel fundamentally different from digests. Digests are scheduled content drops. The agent is a **conversational companion** — it initiates contact, but the user can **reply** and the agent responds. No rigid frequency selector; the agent decides when to reach out based on activity patterns, and the user can talk back at any time.

#### Key Design Principle: Agents ≠ Digests

Digests have a frequency (daily/weekly) because they're content curation. The agent should feel like a person who checks in when it makes sense — not a cron job. Remove the `messageFrequency` field from the context model. Instead, the agent autonomously decides when to send its next message based on:
- How recently the user was active (checklist completions, goal updates)
- How long since the last agent message
- The agent's personality (a "tough love" agent nags more often than a "zen" agent)
- Whether the user replied to the last message (if they're engaged, keep the conversation going)

#### Architecture: LangChain Agent + Gmail API Reply Polling

```
                    ┌─────────────────────────┐
                    │  AgentScheduler (Java)   │
                    │  @Scheduled(fixedRate)   │
                    │  Checks: deployed agents │
                    │  with no recent message  │
                    └──────────┬──────────────┘
                               │ Kafka (agent-messages)
                               ▼
                    ┌─────────────────────────┐
                    │  agent_message_handler   │
                    │  (Python + LangChain)    │
                    │                         │
                    │  Tools:                 │
                    │  - get_user_progress    │
                    │  - get_previous_messages│
                    │  - get_user_replies     │  ← NEW: checks for email replies
                    │  - search_news          │
                    │                         │
                    │  Sends email via SMTP   │
                    │  Saves to sent_agent_   │
                    │  messages table         │
                    └─────────────────────────┘

    User replies to email
           │
           ▼
    ┌─────────────────────────┐
    │  Reply Ingestion        │
    │  (Python poller)        │
    │  Polls Gmail API ~30s   │  ← Suggestion: consider best approach
    │  Matches reply to       │
    │  sent_agent_messages    │
    │  Triggers agent to      │
    │  respond via LangChain  │
    └─────────────────────────┘
```

#### LangChain Agent Tools

| Tool | Purpose |
|------|---------|
| `get_user_progress` | Query checklist completion + goal data to understand recent activity |
| `get_previous_messages` | Load conversation history from `sent_agent_messages` to maintain continuity |
| `get_user_replies` | Load user's email replies to the agent (from `agent_replies` table) to enable back-and-forth |
| `search_news` | Reuse `web_search.search_news()` if the agent decides news is relevant |

The agent decides autonomously:
- **When to reach out** — based on user activity, time since last message, personality config
- **What tone to use** — based on personality (name, message_type, custom_instructions) and recent activity
- **What to focus on** — which goal needs attention based on checklist progress, deadlines, or inactivity
- **Whether to include resources** — agent can search for relevant content if it determines the user would benefit
- **How to respond to user replies** — maintain conversational context across email exchanges

#### Learning Over Time

All agent messages AND user replies are stored, giving the agent full conversation history. This enables:
- Vary tone and avoid repeating itself
- Reference past conversations ("Last week I mentioned X — how did that go?")
- Escalate urgency if a user has been inactive across multiple check-ins
- Celebrate streaks and milestone completions
- Respond to what the user said in their reply, not just push content

#### Reply Ingestion — Design Considerations

The user should be able to reply to agent emails and have the agent respond. Possible approaches (evaluate during planning):

1. **Gmail API polling (~30s interval)** — Python process polls for replies to sent agent messages using Gmail API thread matching. Simple, works with existing Gmail setup, but requires OAuth2 credentials with Gmail read scope. Latency is ~30s.

2. **Webhook/push notifications** — Gmail push notifications via Google Cloud Pub/Sub. Lower latency but more infrastructure.

3. **Inbound email parsing** — Services like SendGrid Inbound Parse or Mailgun routes can forward incoming emails to a webhook. Decouples from Gmail but adds a dependency.

The simplest starting point is likely Gmail API polling. The `Message-ID` / `In-Reply-To` headers on sent emails can be used to match replies to specific agent messages. Store a `gmail_thread_id` or `message_id` on each sent agent message for matching.

#### Implementation

**DB changes (`V1__init.sql`):**

```sql
CREATE TABLE sent_agent_messages (
    sent_message_id SERIAL PRIMARY KEY,
    context_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    subject VARCHAR(255),
    content TEXT,
    email_message_id VARCHAR(255),    -- for reply matching
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (context_id) REFERENCES agent_contexts (context_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE TABLE agent_replies (
    reply_id SERIAL PRIMARY KEY,
    sent_message_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (sent_message_id) REFERENCES sent_agent_messages (sent_message_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);
```

Remove `message_frequency` column from `agent_contexts` table in V1 schema.

**Backend:**
- Remove `messageFrequency` from `AgentContext` entity, `AddContextRequest`, `UpdateContextRequest`, `AgentContextResponse`
- New `AgentScheduler` (`@Scheduled(fixedRate=60000)`) — queries deployed agents, uses heuristics to decide which contexts are due for a message (time since last message + user activity level, not a fixed frequency)
- `AgentMessagePayload` — includes agent config, context config, user profile, goals + checklist progress
- Publishes to `KafkaConfig.TOPIC_AGENT_MESSAGES`

**Frontend:**
- Remove "Message Frequency" dropdown from `CreateContextModal.tsx` and `EditContextModal.tsx`
- Remove `messageFrequency` from agent types
- Update context cards to not show frequency
- Consider adding conversation history view (show agent messages + user replies) — could be a future step
- Consider updating agent builder UI to emphasize the conversational nature ("Your agent will reach out when it has something to say" instead of frequency pickers)

**Python dependencies (add to requirements.txt):**
```
langchain>=0.3.0
langchain-anthropic>=0.3.0
```

**Python: `agent_message_handler.py`** (new file):
```python
# Uses LangChain agent with:
# - ChatAnthropic (claude-haiku-4-5) as LLM
# - Custom tools: get_user_progress, get_previous_messages, get_user_replies, search_news
# - System prompt built from agent personality + user context + conversation history
# - Sends result as HTML email via Gmail SMTP (include proper Message-ID for reply threading)
# - Saves to sent_agent_messages table with email_message_id
```

**Python: reply poller** (new — approach TBD during planning):
```python
# Polls for user replies to agent emails
# Matches replies to sent_agent_messages via email threading
# Stores in agent_replies table
# Triggers agent to respond (either immediately or on next poll cycle)
```

**Python: update `kafka_consumer.py`** — wire dispatch for `agent-messages` topic

**Suggested files:**
- `backend/.../agents/AgentScheduler.java` (new)
- `backend/.../agents/AgentMessagePayload.java` (new)
- `backend/.../agents/AgentSchedulerTest.java` (new)
- `ai/agent_message_handler.py` (new)
- `frontend/components/agent-builder/CreateContextModal.tsx` (modify — remove frequency)
- `frontend/components/agent-builder/EditContextModal.tsx` (modify — remove frequency)
- `frontend/types/agent.ts` (modify — remove MessageFrequency)

**After implementing:** Write unit tests for the agent scheduler. Run `./mvnw test`.

> **Manual verification:** Deploy an agent with a context, confirm it sends an initial message. Reply to the email. Verify the agent picks up the reply and responds with context from the conversation. Verify the second proactive message references or varies from the first.

---

## Reference Files Summary

| File | Purpose |
|---|---|
| `backend/src/main/java/com/nagai/backend/goals/GoalController.java` | Controller pattern |
| `backend/src/main/java/com/nagai/backend/goals/GoalService.java` | Service + ownership check pattern |
| `backend/src/main/java/com/nagai/backend/goals/GoalAddRequest.java` | DTO validation pattern |
| `backend/src/main/java/com/nagai/backend/digests/DigestService.java` | One-per-user pattern |
| `backend/src/test/java/com/nagai/backend/digests/DigestServiceTest.java` | Test pattern |
| `backend/src/main/java/com/nagai/backend/common/GlobalExceptionHandler.java` | Exception handling |
| `backend/src/main/resources/db/migration/V1__init.sql` | DB schema (modify directly) |
| `backend/pom.xml` | Existing gRPC/protobuf dependencies |
| `frontend/lib/api.ts` | Frontend API client pattern |
| `frontend/services/goalService.ts` | Frontend service pattern |
| `frontend/services/digestService.ts` | Completed integration — use as reference |
