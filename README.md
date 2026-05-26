# GoalForge AI

GoalForge AI is an OKR and performance management platform for teams. It helps employees create goals, managers review progress, and admins keep the organization running with users, audit logs, analytics, and AI-assisted insights.

The project uses a **Next.js** frontend, a **FastAPI** backend, **PostgreSQL** for data, and a hybrid AI setup that can use **Google Gemini**, **Ollama**, or a built-in rule-based fallback.

---

## Features

- **Role-based dashboards** for employees, managers, and admins.
- **Goal and OKR tracking** with progress updates, milestones, priorities, and status changes.
- **Manager approvals** for reviewing, editing, approving, rejecting, and escalating goals.
- **Admin user management** for employees, departments, roles, and account status.
- **Audit logs** that organize key actions such as account changes, goal creation, approvals, rejections, and escalations.
- **AI copilot chat** for goal refinement, recommendations, coaching, and performance guidance.
- **Hybrid AI support** with Gemini for cloud AI, Ollama for local AI, and a rules fallback when AI services are unavailable.
- **Prediction heuristics** for goal completion probability and employee burnout risk.
- **Security controls** including role isolation, API rate limiting, request tracing, and secure API key proxying.
- **Observability** with health checks, metrics, structured logs, and trace IDs.
- **Docker support** for running the frontend, backend, and database together.
- **CI checks** with backend and frontend test workflows.

---

## System Architecture

```mermaid
graph TD
    %% User Tier
    User([User Browser]) -->|Next.js App: Port 3000| Frontend[Next.js Frontend Container]
    
    %% API Routing Tier
    Frontend -->|Unified API Rewrite| Gateway{API gateway}
    Gateway -->|Endpoints /api| Backend[FastAPI Backend Container: Port 8000]
    
    %% Database Tier
    Backend -->|Asynchronous SQLAlchemy| DB[(PostgreSQL Database: Port 5433)]
    
    %% Hybrid AI Tier
    Backend -->|Client-Side Key Injection| Gemini[Google Gemini SaaS API]
    Backend -->|Dynamic WSL2 Gateway Network| Ollama[Local Ollama AI Engine: Port 11434]
    
    %% Initializer Helper
    DockerCompose[Docker Compose Environment] -->|Automated Entrypoint Script| PullModel[ollama-pull-model Container]
    PullModel -->|Pre-pulls gemma2:2b| Ollama
    
    classDef containers fill:#1e1e2e,stroke:#89b4fa,stroke-width:2px,color:#cdd6f4;
    classDef databases fill:#1e1e2e,stroke:#a6e3a1,stroke-width:2px,color:#cdd6f4;
    classDef external fill:#1e1e2e,stroke:#f9e2af,stroke-width:2px,color:#cdd6f4;
    class Frontend,Backend,PullModel containers;
    class DB databases;
    class Gemini,Ollama external;
```

---

## How It Works

Employees create goals and submit progress updates. Managers review goals, approve or reject them, track team progress, and use prediction views to spot risks early. Admins manage users, review audit logs, monitor escalations, and see organization-level analytics.

The AI layer gives coaching and recommendations. It first tries the configured Gemini flow, can use Ollama for local/private AI, and falls back to deterministic rules so the app still responds when external AI is unavailable.

The prediction engine uses lightweight heuristics instead of a heavy ML model. It combines progress, milestones, workload, update freshness, priority, and risk signals to estimate completion probability and burnout risk quickly.

---

## AI and Privacy

- Gemini keys are handled through secure server-side API routes instead of being stored directly in the browser.
- Ollama can run locally for private/offline AI workflows.
- If Gemini and Ollama are unavailable, the app still provides rule-based coaching.
- Backend routes include rate limits, trace IDs, role checks, and audit logging for sensitive actions.

---

## Docker Notes

The Docker setup maps PostgreSQL to host port **5433** to avoid conflicts with local PostgreSQL installations that commonly use port **5432**.

For local Ollama access from Docker, the backend uses `host.docker.internal`:

```yaml
backend:
  environment:
    OLLAMA_HOST: http://host.docker.internal:11434
  extra_hosts:
    - "host.docker.internal:host-gateway"
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 16+ or Docker
- Ollama, optional for local AI

### Clone

```bash
git clone https://github.com/beastspirit2005/GoalForge_Ai-.git
cd GoalForge-Ai
```

### Run with Docker

```bash
docker compose up -d
```

This starts the app stack and uses the Docker configuration for the frontend, backend, database, and optional Ollama model setup.

### Run Locally

Create the database:

```bash
createdb goalforge
```

Start the backend:

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Start the frontend:

```bash
cd ../frontend
npm install
npm run dev -- --port 3000
```

Seed demo data:

```bash
cd ../backend
python scripts/seed.py
```

---

## Demo Credentials

| Role | Email | Password |
|:---|:---|:---|
| Employee | `employee@goalforge.ai` | `password123` |
| L1 Manager | `manager@goalforge.ai` | `password123` |
| Administrator | `admin@goalforge.ai` | `password123` |

---

## Project Structure

```text
GoalForge-Ai/
|-- docker-compose.yml
|-- vercel.json
|-- backend/
|   |-- app/
|   |   |-- ai/          # AI clients, recommendations, and prediction heuristics
|   |   |-- core/        # Auth, config, database setup, and security
|   |   |-- middleware/  # Metrics, tracing, rate limits, and role checks
|   |   |-- models/      # SQLAlchemy models
|   |   |-- routes/      # FastAPI routes
|   |   |-- services/    # Business logic services
|   |   `-- main.py      # FastAPI app entry point
|   `-- Dockerfile
|-- frontend/
|   |-- src/
|   |   |-- app/         # Next.js App Router pages
|   |   |-- components/  # Dashboards, goals, approvals, AI chat, and UI
|   |   |-- hooks/       # Frontend hooks
|   |   |-- lib/         # API helpers, local data, logging, and utilities
|   |   |-- services/    # Frontend service wrappers
|   |   `-- types/       # Shared TypeScript types
|   `-- Dockerfile
|-- database/
|-- docs/
`-- scripts/
```

---

## License

Created for OKR management, AI-assisted performance insights, hackathon submissions, and software portfolio demonstration. Proprietary license. Built by GoalForge Devs.
