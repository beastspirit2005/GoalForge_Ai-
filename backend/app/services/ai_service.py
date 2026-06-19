"""AI service – orchestrates Gemini calls and stores results."""

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.ai.gemini_client import generate_ai_plan
from app.models.goal import Goal
from app.models.user import User
from app.models.cycle import Cycle
from app.models.escalation import Escalation
from app.models.recognition import LeaderboardEntry
from app.services.milestone_service import bulk_create_milestones


async def generate_and_store_plan(db: AsyncSession, goal: Goal, api_key: str | None = None) -> dict:
    """
    Call the AI to generate milestones + recommendations, then persist
    the milestones and recommendation on the goal row.
    """
    goal_data = {
        "title": goal.title,
        "description": goal.description or "",
        "target": goal.target or "",
        "deadline": goal.deadline or "",
    }

    plan = generate_ai_plan(goal_data, api_key=api_key)

    # Persist milestones
    if plan.get("milestones"):
        await bulk_create_milestones(
            db,
            goal.id,
            plan["milestones"],
            source=plan.get("source", "ai"),
        )

    # Persist recommendation on the goal
    if plan.get("recommendation"):
        goal.ai_recommendation = plan["recommendation"]

    if plan.get("risk"):
        goal.risk = plan["risk"]

    await db.flush()
    from app.services.goal_service import refresh_columns_only
    await refresh_columns_only(db, goal)

    return plan


def generate_plan_stateless(goal_data: dict, api_key: str | None = None) -> dict:
    """Generate a plan without persisting – for the public endpoint."""
    return generate_ai_plan(goal_data, api_key=api_key)


async def get_copilot_context(db: AsyncSession, user: User) -> str:
    """Constructs a string context based on the user's role (Employee, Manager, Admin)."""
    
    # 1. ADMIN ROLE
    if user.role == "admin":
        # Fetch active cycles
        cycle_result = await db.execute(
            select(Cycle).where(Cycle.is_active == True)
        )
        active_cycles = cycle_result.scalars().all()
        
        # Fetch open escalations
        esc_result = await db.execute(
            select(Escalation)
            .where(Escalation.status == "open")
            .options(selectinload(Escalation.goal), selectinload(Escalation.user))
        )
        open_escalations = esc_result.scalars().all()
        
        # Fetch top leaderboard performers
        leaderboard_result = await db.execute(
            select(LeaderboardEntry)
            .options(selectinload(LeaderboardEntry.user))
            .order_by(LeaderboardEntry.rank.asc())
            .limit(5)
        )
        top_performers = leaderboard_result.scalars().all()
        
        # Fetch global metrics
        user_count_res = await db.execute(select(func.count()).select_from(User))
        total_users = user_count_res.scalar() or 0
        
        goal_count_res = await db.execute(select(func.count()).select_from(Goal))
        total_goals = goal_count_res.scalar() or 0
        
        context = [
            f"User: {user.name} (Role: Admin)",
            "--- GLOBAL SYSTEM OVERVIEW ---",
            f"Total Registered Users: {total_users}",
            f"Total Goals Created: {total_goals}",
            "",
            "--- ACTIVE PERFORMANCE CYCLES ---"
        ]
        if active_cycles:
            for cyc in active_cycles:
                context.append(f"- Cycle: {cyc.name} ({cyc.start_date} to {cyc.end_date}) [Status: {cyc.status}]")
        else:
            context.append("No active cycles found.")
            
        context.append("")
        context.append("--- ACTIVE AUTO-ESCALATED GOALS (OPEN ESCALATIONS) ---")
        if open_escalations:
            for esc in open_escalations:
                goal_title = esc.goal.title if esc.goal else "Unknown Goal"
                emp_name = esc.user.name if esc.user else "Unknown Employee"
                context.append(f"- Escalation #{esc.id}: Goal '{goal_title}' owned by {emp_name}. Reason: {esc.reason} (Severity: {esc.severity})")
        else:
            context.append("No active escalations. System is running healthy!")
            
        context.append("")
        context.append("--- LEADERBOARD TOP PERFORMERS ---")
        if top_performers:
            for entry in top_performers:
                emp_name = entry.user.name if entry.user else "Unknown User"
                context.append(f"- Rank #{entry.rank}: {emp_name} - Score: {entry.score:.1f} (Goals Completed: {entry.goals_completed}, Consistency: {entry.consistency_rate:.0f}%)")
        else:
            context.append("No leaderboard entries found.")
            
        return "\n".join(context)
        
    # 2. MANAGER ROLE
    elif user.role == "manager":
        # Fetch manager's own goals
        own_result = await db.execute(
            select(Goal)
            .where(Goal.user_id == user.id)
            .options(selectinload(Goal.checkins))
        )
        own_goals = own_result.scalars().all()
        
        # Fetch managed employees
        emp_result = await db.execute(
            select(User).where(User.manager_id == user.id)
        )
        employees = emp_result.scalars().all()
        emp_ids = [emp.id for emp in employees]
        
        team_goals = []
        pending_approvals = []
        
        if emp_ids:
            # Fetch team goals
            team_goals_res = await db.execute(
                select(Goal)
                .where(Goal.user_id.in_(emp_ids))
                .options(selectinload(Goal.owner), selectinload(Goal.checkins))
            )
            team_goals = team_goals_res.scalars().all()
            
            # Fetch pending approvals (goals from team in 'pending' status)
            pending_res = await db.execute(
                select(Goal)
                .where(Goal.user_id.in_(emp_ids), Goal.status == "pending")
                .options(selectinload(Goal.owner))
            )
            pending_approvals = pending_res.scalars().all()
            
        context = [
            f"User: {user.name} (Role: Manager)",
            "--- MANAGER OWN GOALS ---"
        ]
        if own_goals:
            for g in own_goals:
                context.append(f"- Own Goal: {g.title} (Progress: {g.progress}%, Status: {g.status}, Risk: {g.risk})")
        else:
            context.append("No personal goals configured.")
            
        context.append("")
        context.append("--- TEAM MEMBERS ---")
        if employees:
            context.append(f"Managed Team Size: {len(employees)} members ({', '.join(e.name for e in employees)})")
        else:
            context.append("No managed employees assigned.")
            
        context.append("")
        context.append("--- TEAM GOALS ---")
        if team_goals:
            for tg in team_goals:
                owner_name = tg.owner.name if tg.owner else "Unknown"
                context.append(f"- Goal: '{tg.title}' owned by {owner_name} (Progress: {tg.progress}%, Status: {tg.status}, Risk: {tg.risk})")
                # Include last checkin
                if tg.checkins:
                    last_c = tg.checkins[-1]
                    context.append(f"  * Last Checkin ({last_c.created_at.strftime('%Y-%m-%d')}): status '{last_c.progress_status}', notes: {last_c.notes or 'No notes'}")
        else:
            context.append("No active team goals.")
            
        context.append("")
        context.append("--- PENDING MANAGER APPROVALS ---")
        if pending_approvals:
            for p in pending_approvals:
                owner_name = p.owner.name if p.owner else "Unknown"
                context.append(f"- Pending Goal: '{p.title}' requested by {owner_name} (Target: {p.target or 'N/A'}, Deadline: {p.deadline or 'N/A'})")
        else:
            context.append("No goals pending approval. Excellent!")
            
        return "\n".join(context)
        
    # 3. EMPLOYEE / DEFAULT ROLE
    else:
        # Get all goals for the user, with their checkins
        result = await db.execute(
            select(Goal)
            .where(Goal.user_id == user.id)
            .options(selectinload(Goal.checkins))
        )
        goals = result.scalars().all()
        
        if not goals:
            return f"User {user.name} (Role: Employee) currently has no active goals."
            
        context = [f"User Name: {user.name}", f"Role: {user.role}", "--- ACTIVE GOALS ---"]
        for g in goals:
            ctx = f"- Goal: {g.title} (Status: {g.status}, Progress: {g.progress}%, Risk: {g.risk})"
            if g.deadline:
                ctx += f", Deadline: {g.deadline}"
            
            checkin_texts = []
            for c in g.checkins[-3:]: # Get last 3 checkins
                checkin_texts.append(f"  * Checkin ({c.created_at.strftime('%Y-%m-%d')}): {c.notes or 'No notes'}")
                
            if checkin_texts:
                ctx += "\n" + "\n".join(checkin_texts)
                
            context.append(ctx)
            
        return "\n".join(context)
