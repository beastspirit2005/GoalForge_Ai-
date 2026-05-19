# GoalForge AI

**AI-Powered Goal Management and Performance Intelligence Platform**

GoalForge AI is an advanced enterprise web platform designed to help organizations manage employee goals, track quarterly progress, and improve overall performance using adaptive AI guidance powered by Google Gemini and local LLM orchestration.

---

## What is New

GoalForge AI has been upgraded with enterprise-grade features to bring next-generation usability, absolute role-based access security, and premium styling to the platform:

*   **Access Control Separation**: Fully hardened route guards and dynamically filtered sidebars. Users signed in under the L1 Manager role are completely isolated from employee dashboard pages, and all employee-specific sidebar navigation elements are hidden, preventing cross-role access leakage.
*   **Interactive Inline Editing during Approval**: Managers can now edit request descriptions and impact levels directly inline inside their approval table. Featuring a slick, glassmorphic edit state toggled via an edit icon, with custom focus inputs, save and cancel controls, and instant compliance logging in the audit trail.
*   **Automatic Employee-to-Manager Goal Approval Routing**: When an employee creates a new AI-powered goal in their console, the platform automatically formats and pushes a pending approval request into the manager's queue in real-time, regardless of whether local session mode or active backend mode is utilized.
*   **Interactive AI Buddy**: A persistent, role-aware conversational assistant acting as a goal coach. Powered by a multi-provider engine supporting Google Gemini, local Ollama models, or a fallback rules-based offline engine. Equipped with quick-failover toggles and data privacy switches.
*   **Responsive Mobile Drawer Navigation**: Full access to dashboard views on Android, iOS, and smaller mobile screens. Includes a slide-out hamburger navigation sidebar drawer that remains responsive across all page dimensions.
*   **Dynamic User Administration**: A comprehensive admin dashboard suite allowing administrators to onboard and offboard users. It supports creation, modification, and deletion of employee and manager accounts, which updates the backend database and registers compliance audit logs in real-time.

---

## Key Features

### Important Enterprise Features
*   **Role-Based Security Isolation**: Strict pathway barriers in frontend and backend separating Employee, L1 Manager, and Admin environments, ensuring total segregation of duties.
*   **Inline Change Modification**: Allows managers to tweak goal descriptions and impact weights in-line inside the queue, resolving approval blocks instantly without manual backtracking.
*   **End-to-End Goal Approval Pipeline**: Automatic handoff from employee creation -> manager approval/rejection -> admin unlocking.
*   **Tamper-Evident Audit Trail**: A complete compliance ledger tracking all user state changes, security overrides, and goal edits with timestamps.

### Core Platform Capabilities
*   **AI Milestone Planning**: Converted informal goals into structured weekly milestone tasks with clear progress indicators.
*   **Goal Refinement Engine**: Refines basic user text inputs into professional, measurable key results using LLM cognitive modeling.
*   **Risk Prediction Analytics**: Scans target deadlines, weights, and current check-in milestones to flag high-risk goals before they become overdue.
*   **Quarterly Progress Check-ins**: Provides periodic check-in forms with numeric actuals and comments.
*   **Executive Metrics Dashboard**: Visualization widgets including department progress charts, active goal counts, and risk distribution heatmaps.

---

## Tech Stack

| Layer | Technology | Description |
|:---|:---|:---|
| **Frontend** | Next.js 16, React 19, TypeScript | Premium enterprise framework with Server-Side Rendering support |
| **Styling and UI** | Tailwind CSS 4, shadcn/ui, Radix UI | Modern dark/light glassmorphic variables, fluid transitions |
| **Charts** | Recharts | Interactive SVG charts and visual metrics |
| **Backend** | FastAPI (Python) | High-performance async REST framework |
| **Database** | PostgreSQL | Robust SQL schema containing user-scoped chat logs and check-ins |
| **Cloud AI** | Google Gemini 2.0 Flash | Cloud-based cognitive model for milestone planning and goal refinement |
| **Local AI** | Ollama (gemma2:2b, llama3, etc.) | Fully sovereign, local-first model provider for offline developer environments |
| **Offline LLM** | Rules-based Fallback AI | Adaptive fallback logic for offline access and API-free setups |
| **Auth** | JWT (python-jose and bcrypt) | Secure, state-based, and role-authorized JWT tokens |

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 16+
- (Optional) Ollama (For local private AI workflows)

---

### 1. Clone and Install

```bash
git clone https://github.com/beastspirit2005/GoalForge_Ai-.git
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
   DATABASE_URL=postgresql+asyncpg://postgres:yourpassword@localhost:5432/goalforge
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

If you wish to use Local AI for private goal guidance:
1. Make sure Ollama is installed and running:
   ```bash
   ollama serve
   ```
2. Pull a lightweight model of your choice:
   ```bash
   ollama pull llama3         # Default fallback model
   # or
   ollama pull gemma2:2b      # Lightweight Google local model
   ```
3. Open the AI Buddy settings panel in the bottom-right corner of the dashboard, choose the Ollama provider, and select your pulled model.

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
│       ├── ai/          # Gemini and Ollama client, system prompts, offline rules
│       ├── core/        # Config, auth sessions, database connections
│       ├── logic/       # Business rules (validation, scoring)
│       ├── models/      # SQLAlchemy ORM models (Goals, Check-ins, Chat Logs)
│       ├── routes/      # FastAPI REST routes (Admin, User Management, AI Copilot)
│       ├── schemas/     # Pydantic schemas (JWT token responses, chat queries)
│       ├── services/    # Business services layer (Audit trails, scores)
│       └── main.py      # Strips /api prefix, handles static files, mounts routes
├── frontend/
│   ├── vercel.json      # Next.js specific settings
│   └── src/
│       ├── app/         # Next.js page layouts (Login, Settings, Dashboards)
│       ├── components/  # Tailwind glassmorphic UI components and AI Buddy drawer
│       ├── hooks/       # Custom React hooks (useAuth, useGoals, useAi)
│       ├── lib/         # API fetch utilities (supports auto production URL detection)
│       └── services/    # API authentication client
├── database/            # SQL schemas and database init scripts
└── scripts/             # Database seed and maintenance scripts
```

---

## Monorepo Deployment

### Vercel Multi-Service Architecture
The root `vercel.json` leverages experimental unified services to deploy both frontend and backend as a single monorepo:
*   The FastAPI backend is mapped to run under `/api` with a routePrefix.
*   The Next.js frontend runs on `/` and automatically rewrites requests to `/api` when deployed.
*   Our prefix-stripping middleware handles path routing on the server.

### Docker Environment

GoalForge AI is fully containerized and cloud-ready. You can run the entire platform locally or deploy it to production using Docker and Docker Compose.

#### 1. Instant Start (Pull Pre-Built Images from Docker Hub)
You can run the entire platform locally by running from the repo root:

```bash
docker compose up -d
```

Docker will automatically pull our pre-compiled, production-ready images directly from Docker Hub (only the `latest` tag is published):
* Backend (FastAPI): [1065925/goalforge-backend](https://hub.docker.com/r/1065925/goalforge-backend)
* Frontend (Next.js): [1065925/goalforge-frontend](https://hub.docker.com/r/1065925/goalforge-frontend)

#### 2. Re-building and Uploading Container Images
If you make changes to the source code and want to rebuild the containers and push them to your Docker Hub registry:

##### Manual Terminal Commands
```bash
# 1. Build local container images
docker build -t 1065925/goalforge-backend:latest ./backend
docker build -t 1065925/goalforge-frontend:latest ./frontend

# 2. Login to Docker Hub
docker login -u 1065925

# 3. Push to your Docker Hub registry
docker push 1065925/goalforge-backend:latest
docker push 1065925/goalforge-frontend:latest
```

---

## License

Built for hackathon demonstration and enterprise performance evaluation purposes.
