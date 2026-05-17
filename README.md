#  GoalForge AI

**AI-Powered Goal Management & Performance Intelligence Platform**

GoalForge AI is a smart enterprise web platform designed to help organizations manage employee goals, track quarterly progress, and improve overall performance using adaptive AI guidance powered by Google Gemini.

##  Key Features

- **AI Milestone Planning** — Converts vague goals into weekly milestones with success metrics
- **Goal Refinement** — AI transforms informal goals into measurable enterprise objectives
- **Risk Prediction** — Identifies slow-moving goals before deadline week
- **Role-Based Dashboards** — Employee, Manager, and Admin each get tailored views
- **Approval Workflow** — Submit → Approve/Reject → Lock/Unlock cycle
- **Quarterly Check-ins** — Track actual achievement with manager feedback
- **Analytics & Visualization** — Progress charts, heatmaps, risk distribution
- **Audit Trail** — Complete governance log of all changes

##  Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript |
| UI | Tailwind CSS 4, shadcn/ui, Radix UI |
| Charts | Recharts |
| Backend | FastAPI (Python) |
| Database | PostgreSQL |
| AI | Google Gemini 1.5 Flash |
| Auth | JWT (python-jose + bcrypt) |

##  Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 16+

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

### 3. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt

# Start the server (auto-creates tables)
uvicorn app.main:app --reload
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 5. Seed Demo Data

```bash
python scripts/seed.py
```

### 6. Open

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Swagger Docs: http://localhost:8000/docs

##  Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Employee | employee@goalforge.ai | password123 |
| Manager | manager@goalforge.ai | password123 |
| Admin | admin@goalforge.ai | password123 |

##  Project Structure

```
GoalForge-Ai/
├── backend/
│   └── app/
│       ├── ai/          # Gemini client, prompts, risk analyzer
│       ├── core/        # Config, database, auth, security
│       ├── logic/       # Business rules (validation, scoring)
│       ├── middleware/   # Auth & role middleware
│       ├── models/      # SQLAlchemy ORM models
│       ├── routes/      # API endpoints
│       ├── schemas/     # Pydantic request/response models
│       ├── services/    # Business logic layer
│       └── utils/       # Helpers, logging, formatters
├── frontend/
│   └── src/
│       ├── app/         # Next.js pages (employee/manager/admin)
│       ├── components/  # UI components
│       ├── hooks/       # React hooks (useAuth, useGoals, useAi)
│       ├── lib/         # Utils, constants, demo data
│       ├── services/    # API client services
│       ├── store/       # Auth state
│       └── types/       # TypeScript types
├── database/            # SQL schema & seed data
├── docs/                # API docs, workflow, presentation notes
└── scripts/             # Setup, seed, deploy scripts
```

##  Docker

```bash
docker-compose up -d
```

##  License

Built for hackathon demonstration purposes.
