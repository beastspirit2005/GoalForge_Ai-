# GoalForge AI — API Documentation

Base URL: `http://localhost:8000`

Interactive docs: `http://localhost:8000/docs`

## Authentication

All protected endpoints require a Bearer token in the `Authorization` header:
```
Authorization: Bearer <access_token>
```

---

## Auth Endpoints

### POST /auth/register
Create a new user account.

**Body:**
```json
{
  "name": "Aarav Mehta",
  "email": "employee@goalforge.ai",
  "password": "password123",
  "role": "employee",
  "department": "People Ops"
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "name": "Aarav Mehta",
  "email": "employee@goalforge.ai",
  "role": "employee",
  "department": "People Ops",
  "manager_id": null,
  "is_active": true
}
```

### POST /auth/login
Authenticate and receive a JWT token.

**Body:**
```json
{
  "email": "employee@goalforge.ai",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

### GET /auth/me
Get the current authenticated user.

**Response:** `200 OK` — UserResponse

---

## Goal Endpoints

### POST /goals/
Create a new goal. Validates: max 8 goals, min 10% weightage, total ≤ 100%.

**Body:**
```json
{
  "title": "Increase activation rate",
  "description": "Improve new user activation",
  "target": "42% → 60%",
  "uom": "%",
  "weightage": 25.0,
  "deadline": "2026-06-30"
}
```

### GET /goals/
List all goals for the current user.

### GET /goals/{goal_id}
Get a specific goal with milestones.

### PUT /goals/{goal_id}
Update a goal (cannot update locked goals).

### DELETE /goals/{goal_id}
Delete a goal.

### POST /goals/{goal_id}/submit
Submit a goal for manager approval (changes status to "pending").

### POST /goals/{goal_id}/generate-plan
Generate an AI milestone plan for a goal and persist milestones.

### GET /goals/{goal_id}/milestones
List milestones for a goal.

### POST /goals/{goal_id}/milestones
Add a manual milestone.

### PATCH /goals/milestones/{milestone_id}/toggle
Toggle milestone completion status.

---

## Check-in Endpoints

### POST /checkins/
Create a quarterly check-in.

**Body:**
```json
{
  "goal_id": 1,
  "quarter": "Q2-2026",
  "actual_achievement": 72.0,
  "progress_status": "On Track",
  "notes": "Completed AI FAQ prompts."
}
```

### GET /checkins/
List check-ins for the current user.

### PUT /checkins/{checkin_id}
Update a check-in (managers can add `manager_comment`).

---

## AI Endpoints

### POST /ai/generate-plan
Generate a milestone plan without persisting (public endpoint).

**Body:**
```json
{
  "title": "Improve coding skills",
  "description": "Enhance backend development capabilities",
  "target": "Complete 2 projects",
  "deadline": "2026-09-30"
}
```

**Response:**
```json
{
  "milestones": ["...5 milestones..."],
  "recommendation": "...",
  "risk": "Medium",
  "source": "gemini"
}
```

### POST /ai/refine-goal
Refine a vague goal into a measurable enterprise goal.

**Body:**
```json
{
  "raw_goal": "Improve coding skills"
}
```

**Response:**
```json
{
  "refined_title": "Complete 2 backend projects and improve DSA consistency by Q3",
  "refined_description": "...",
  "suggested_target": "...",
  "source": "gemini"
}
```

---

## Manager Endpoints (requires `manager` or `admin` role)

### GET /manager/team
Get goals for all employees managed by the current user.

### POST /manager/goals/{goal_id}/approve
Approve or reject a goal.

**Body:**
```json
{
  "action": "approve",
  "comment": "Looks good!",
  "weightage": 30.0,
  "target": "Adjusted target"
}
```

### POST /manager/goals/{goal_id}/lock
Lock an approved goal.

### POST /manager/checkins/{checkin_id}/comment
Add manager feedback to a check-in.

---

## Admin Endpoints (requires `admin` role)

### GET /admin/users
List all users.

### PUT /admin/users/{user_id}
Update user role, department, or status.

### GET /admin/goals
List all goals across the organization.

### POST /admin/goals/{goal_id}/unlock
Unlock a locked goal for re-editing.

### GET /admin/audit-logs
Get audit trail with optional `entity_type` filter.

---

## Analytics Endpoints

### GET /analytics/overview
Organization-wide metrics (total users, goals, avg progress, overdue check-ins).

### GET /analytics/departments
Department-level progress and goal counts.

### GET /analytics/momentum
Weekly momentum data points.

### GET /analytics/risk-distribution
Count of goals by risk level (Low, Medium, High).
