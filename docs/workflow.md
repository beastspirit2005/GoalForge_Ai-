# GoalForge AI — User Workflows

## Employee Workflow

```
1. Login as Employee
2. Dashboard → View active goals, stats, AI momentum
3. Create Goal → Fill title, description, target, weightage, deadline
4. Generate AI Plan → Get milestones, recommendations, risk assessment
5. Submit Goal → Sends to manager for approval
6. Track Progress → Update milestones, create check-ins
7. View AI Insights → Dynamic recommendations based on progress
```

### Goal Lifecycle (Employee View)
```
Draft → Submit → Pending → [Manager Approves] → Approved → [Manager Locks] → Locked
                          → [Manager Rejects] → Rejected → Edit & Resubmit
```

## Manager Workflow

```
1. Login as Manager
2. Dashboard → View team goals, progress chart, approval queue
3. Review Approvals → Approve/reject goals with feedback
4. Adjust Goals → Modify weightage or target during approval
5. Lock Goals → Prevent further editing after approval
6. Team Progress → View heatmap and progress charts
7. Comments → Add review feedback on check-ins
```

## Admin Workflow

```
1. Login as Admin
2. Dashboard → Organization-wide metrics
3. Analytics → Department performance, momentum, risk distribution
4. User Management → Add/edit users, assign roles and departments
5. Audit Logs → Review governance trail of all changes
6. Goal Cycles → Configure quarterly cycles, close/open cycles
7. Unlock Goals → Override locked goals for re-editing
```

## AI-Powered Flows

### Goal Refinement
```
Employee enters vague goal → AI refines into measurable enterprise goal
  Input:  "Improve coding skills"
  Output: "Complete 2 backend projects and improve DSA consistency by Q3"
```

### Milestone Planning
```
Employee creates goal → AI generates 5 weekly milestones + recommendation + risk
  - Milestones are persisted and trackable
  - Risk score adapts based on progress and deadline
```

### Dynamic Guidance
```
As progress changes → AI adapts recommendations
  - Low progress + near deadline → "Urgent: increase weekly milestone completion"
  - Good progress → "On track. Focus on closing remaining milestones"
```

## Validation Rules

| Rule | Detail |
|------|--------|
| Max goals | 8 per employee |
| Min weightage | 10% per goal |
| Total weightage | Must sum to 100% |
| Shared goals | Employee can only change weightage, not title/target |
| Locked goals | Cannot be edited (admin can unlock) |
