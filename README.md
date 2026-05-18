# GoalForge AI

**AI-Powered Goal Management & Performance Intelligence Platform**

GoalForge AI is a smart enterprise web platform designed to help organizations manage employee goals, track quarterly progress, and improve overall performance using adaptive AI guidance powered by Google Gemini and local LLM orchestration.

---

## What's New

We have recently upgraded GoalForge AI with enterprise-grade features to bring next-generation usability, offline privacy, and responsive styling to the platform:

*   **Interactive AI Buddy (Role-Aware Performance Copilot)** — A persistent conversational assistant that acts as a goal coach. Backed by a multi-provider engine (Google Gemini 2.0 Flash, local Ollama, or an offline rules-based fallback) with user-scoped chat logs, quick-failover buttons, and a data privacy toggle.
*   **Responsive Mobile Drawer Navigation** — Fully responsive layouts for Android and iOS devices. The navbar includes a modern hamburger menu that toggles an interactive slide-out sidebar overlay, making all employee, manager, and administrator dashboard views completely accessible on small screens.
*   **Dynamic User Administration** — A complete admin control suite for onboarding and offboarding. Administrators can create, edit, and delete employee and manager accounts directly from the UI, which automatically streams to the backend database and logs actions in the compliance audit trail.
*   **Production-Grade JWT Authenticated Sessions** — Quick login cards now perform actual API JWT logins rather than relying on frontend-only mock state, ensuring real auth tokens are established, with graceful fallback.
*   **Unified Monorepo & Auto-URL Routing** — Zero-config deployment. Includes a root-level `vercel.json` and backend prefix-stripping middleware for Vercel, coupled with auto-detecting frontend API URLs that seamlessly adapt to production environments.

---

## Key Features

- **AI Milestone Planning** — Converts vague goals into weekly milestones with success metrics.
- **Goal Refinement** — AI transforms informal goals into measurable enterprise objectives.
- **Risk Prediction** — Identifies slow-moving goals before deadline week.
- **Role-Based Dashboards** — Employee, Manager, and Admin each get tailored views.
- **Approval Workflow** — Submit → Approve/Reject → Lock/Unlock cycle.
- **Quarterly Check-ins** — Track actual achievement with manager feedback.
- **Analytics & Visualization** — Progress charts, heatmaps, risk distribution.
- **Audit Trail** — Complete governance log of all user creation, edits, and state transitions.

---

## Tech Stack

| Layer | Technology | Description |
|:---|:---|:---|
| **Frontend** | Next.js 16, React 19, TypeScript | Premium enterprise framework with Server-Side Rendering support |
| **Styling & UI** | Tailwind CSS 4, shadcn/ui, Radix UI | Modern dark/light glassmorphic variables, fluid transitions |
| **Charts** | Recharts | Interactive SVG charts & visual metrics |
| **Backend** | FastAPI (Python) | High-performance async REST framework |
| **Database** | PostgreSQL | Robust SQL schema containing user-scoped chat logs and check-ins |
| **Cloud AI** | Google Gemini 2.0 Flash | Cloud-based cognitive model for milestone planning and goal refinement |
| **Local AI** | Ollama (`llama3`, `gemma2:2b`, etc.) | Fully sovereign, local-first model provider for offline developer environments |
| **Offline LLM** | Rules-based Fallback AI | Adaptive fallback logic for offline access and API-free setups |
| **Auth** | JWT (python-jose + bcrypt) | Secure, state-based, and role-authorized JWT tokens |

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 16+
- *(Optional)* [Ollama](https://ollama.com/) (For local private AI workflows)

---

### 1. Clone and Install

```bash
git clone https://github.com/your-org/GoalForge-Ai.git
cd GoalForge-Ai
```

### 2. Database Setup

```bash
# Create the PostgreSQL database
createdb goalforge

# Or via psql:
psql -U postgres -c "CREATE DATABASE goalforge;"
```

### 3. Backend Setup

1. Navigate to the backend directory and set up a virtual environment:
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate       # Windows
   # source venv/bin/activate  # macOS/Linux
   pip install -r requirements.txt
   ```
2. Create a `.env` file in the root backend folder (or update the main `.env` in the workspace root):
   ```env
   DATABASE_URL=postgresql+asyncpg://postgres:yourpassword@localhost:55432/goalforge
   GEMINI_API_KEY=AIzaSy...   # Google Gemini API key
   SECRET_KEY=your-jwt-secret-key-here
   ```
3. Start the FastAPI server (this will automatically initialize database tables):
   ```bash
   uvicorn app.main:app --reload --port 8001
   ```

### 4. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   npm install
   ```
2. Create a `.env` file or rely on the automatic API fallback routing:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8001
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```

### 5. Seed Demo Data

```bash
# Seeds default employees, managers, and sample goals in the database
cd ../backend
python scripts/seed.py
```

### 6. Local AI Orchestration (Ollama Setup)

If you wish to use **Local AI** for private goal guidance:
1. Make sure [Ollama](https://ollama.com/) is installed and running:
   ```bash
   ollama serve
   ```
2. Pull a lightweight model of your choice:
   ```bash
   ollama pull llama3         # Default fallback model
   # or
   ollama pull gemma2:2b      # Lightweight Google local model
   # or
   ollama pull phi3:mini      # High-performance local model
   ```
3. Open the **AI Buddy settings panel** in the bottom-right corner of the dashboard, choose the **Ollama** provider, and select your pulled model!

---

## Demo Credentials

| Role | Email | Password |
|:---|:---|:---|
| **Employee** | employee@goalforge.ai | password123 |
| **Manager** | manager@goalforge.ai | password123 |
| **Admin** | admin@goalforge.ai | password123 |

---

## Project Structure

```
GoalForge-Ai/
├── vercel.json          # Root multi-service unified routing configuration
├── backend/
│   └── app/
│       ├── ai/          # Gemini & Ollama client, system prompts, offline rules
│       ├── core/        # Config, auth sessions, database connections
│       ├── logic/       # Business rules (validation, scoring)
│       ├── models/      # SQLAlchemy ORM models (Goals, Check-ins, Chat Logs)
│       ├── routes/      # FastAPI REST routes (Admin, User Management, AI Copilot)
│       ├── schemas/     # Pydantic schemas (JWT token responses, chat queries)
│       ├── services/    # Business services layer (Audit trails, scores)
│       └── main.py      # Strips /api prefix, handlesStaticFiles, mounts routes
├── frontend/
│   ├── vercel.json      # Next.js specific settings
│   └── src/
│       ├── app/         # Next.js page layouts (Login, Settings, Dashboards)
│       ├── components/  # Tailwind glassmorphic UI components & AI Buddy drawer
│       ├── hooks/       # Custom React hooks (useAuth, useGoals, useAi)
│       ├── lib/         # API fetch utilities (supports auto production URL detection)
│       └── services/    # API authentication client
├── database/            # SQL schemas & database init scripts
└── scripts/             # Database seed and maintenance scripts
```

---

## Monorepo Deployment

### Vercel Multi-Service Architecture
The root `vercel.json` leverages experimental unified services to deploy both frontend and backend as a single monorepo:
*   The **FastAPI backend** is mapped to run under `/api` with a routePrefix.
*   The **Next.js frontend** runs on `/` and automatically rewrites requests to `/api` when deployed.
*   Our prefix-stripping middleware handles path routing on the server.

### Docker Environment

```bash
docker-compose up -d
```

---

## License

Built for hackathon demonstration and enterprise performance evaluation purposes.
