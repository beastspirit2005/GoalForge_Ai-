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
from app.models.burnout_risk import BurnoutRisk
from app.models.team_health_score import TeamHealthScore
from app.models.skill_confidence_profile import SkillConfidenceProfile
from app.models.audit_log import AuditLog
from datetime import datetime, timedelta, timezone
from app.services.milestone_service import bulk_create_milestones


async def generate_and_store_plan(db: AsyncSession, goal: Goal, provider: str = "gemini", model: str | None = None, api_key: str | None = None) -> dict:
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

    plan = await generate_ai_plan(goal_data, provider=provider, model=model, api_key=api_key)

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


async def generate_plan_stateless(goal_data: dict, provider: str = "gemini", model: str | None = None, api_key: str | None = None) -> dict:
    """Generate a plan without persisting – for the public endpoint."""
    return await generate_ai_plan(goal_data, provider=provider, model=model, api_key=api_key)


async def get_copilot_context(db: AsyncSession, user: User) -> str:
    """Constructs a string context based on the user's role (Employee, Manager, Admin)."""
    
    # 0. SUPER ADMIN ROLE
    if user.role == "super_admin":

        # Fetch Executive Brief Data
        user_res = await db.execute(select(User))
        all_users = user_res.scalars().all()
        total_users = len(all_users)
        active_users = sum(1 for u in all_users if u.is_active)
        inactive_users = total_users - active_users

        goals_res = await db.execute(select(Goal).options(selectinload(Goal.owner)))
        all_goals = goals_res.scalars().all()
        total_goals = len(all_goals)
        avg_completion = sum(g.progress for g in all_goals) / total_goals if total_goals > 0 else 0.0
        
        # Department stats
        departments = {}
        for g in all_goals:
            dept = g.owner.department if (g.owner and g.owner.department) else "Unknown"
            if dept not in departments:
                departments[dept] = {"total": 0, "progress_sum": 0, "high_risk": 0}
            departments[dept]["total"] += 1
            departments[dept]["progress_sum"] += g.progress
            if g.risk == "High":
                departments[dept]["high_risk"] += 1
                
        most_delayed_dept = "None"
        max_high_risk = -1
        top_perf_dept = "None"
        max_avg_progress = -1
        
        for dept, stats in departments.items():
            avg_p = stats["progress_sum"] / stats["total"]
            if stats["high_risk"] > max_high_risk:
                max_high_risk = stats["high_risk"]
                most_delayed_dept = dept
            if avg_p > max_avg_progress:
                max_avg_progress = avg_p
                top_perf_dept = dept

        # Cycles
        cycle_res = await db.execute(select(Cycle).where(Cycle.is_active == True))
        active_cycles = cycle_res.scalars().all()

        # Risk Radar & Burnout
        burnout_res = await db.execute(select(BurnoutRisk).options(selectinload(BurnoutRisk.user)))
        burnout_records = burnout_res.scalars().all()
        critical_burnout_employees = [b for b in burnout_records if b.risk_level == "critical" or b.risk_score >= 0.8]
        
        team_health_res = await db.execute(select(TeamHealthScore).options(selectinload(TeamHealthScore.manager)))
        team_healths = team_health_res.scalars().all()
        at_risk_teams = [t for t in team_healths if t.overall_health_score < 60.0]

        # Organizational Intelligence (Skills)
        skills_res = await db.execute(select(SkillConfidenceProfile).options(selectinload(SkillConfidenceProfile.user)))
        skills_profiles = skills_res.scalars().all()
        
        skills_map = {}
        for sp in skills_profiles:
            if sp.skill_name not in skills_map:
                skills_map[sp.skill_name] = []
            skills_map[sp.skill_name].append(sp.final_confidence_score)
            
        skill_shortages = []
        for sk_name, scores in skills_map.items():
            avg_score = sum(scores) / len(scores)
            if avg_score < 0.4:
                skill_shortages.append(f"{sk_name} (avg confidence: {avg_score:.2f})")

        # Security Intelligence
        audit_res = await db.execute(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(15))
        recent_logs = audit_res.scalars().all()

        # Inactive users older than 90 days (for command prep)
        cutoff_90d = datetime.now() - timedelta(days=90)
        
        def _to_naive(dt):
            return dt.replace(tzinfo=None) if dt else None

        inactive_old_users = [
            u for u in all_users 
            if u.is_active and u.created_at and _to_naive(u.created_at) < cutoff_90d and u.role != "super_admin"
        ]

        # Build context string
        context = [
            f"User: {user.name} (Role: Super Admin)",
            "--- GOD MODE SYSTEM OVERVIEW ---",
            f"Total Registered Users: {total_users} ({active_users} active, {inactive_users} inactive)",
            f"Total Goals Created: {total_goals}",
            f"Average Goal Completion Rate: {avg_completion:.1f}%",
            f"Most Delayed Department: {most_delayed_dept} (High-risk goals: {max(0, max_high_risk)})",
            f"Top Performing Department: {top_perf_dept} (Avg progress: {max(0, max_avg_progress):.1f}%)",
            "",
            "--- ACTIVE STRATEGIC CYCLES ---"
        ]
        
        if active_cycles:
            for cyc in active_cycles:
                context.append(f"- Cycle: {cyc.name} ({cyc.start_date.strftime('%Y-%m-%d')} to {cyc.end_date.strftime('%Y-%m-%d')}) [Status: {cyc.status}]")
        else:
            context.append("No active performance cycles.")

        context.append("")
        context.append("--- RISK RADAR & BURNOUT ALERTS ---")
        context.append(f"Employees at Critical Burnout Risk: {len(critical_burnout_employees)}")
        for cb in critical_burnout_employees:
            emp_name = cb.user.name if cb.user else "Unknown"
            context.append(f"  * Employee: {emp_name} - Risk Score: {cb.risk_score:.2f} (Active Tasks: {cb.active_tasks_count}, Delayed Tasks: {cb.delayed_tasks_count}, Trend: {cb.performance_trend})")
            
        context.append(f"At-Risk Departments/Teams (Overall Health < 60%): {len(at_risk_teams)}")
        for t in at_risk_teams:
            m_name = t.manager.name if t.manager else "Unknown Manager"
            context.append(f"  * Team managed by {m_name} - Health Score: {t.overall_health_score:.1f}% (Burnout Factor: {t.burnout_factor:.2f}, Delay Factor: {t.delay_factor:.2f})")

        context.append("")
        context.append("--- ORGANIZATIONAL TALENT & SKILL BOTTLENECKS ---")
        if skill_shortages:
            context.append(f"Identified Skill Shortages/Bottlenecks: {', '.join(skill_shortages)}")
        else:
            context.append("No critical skill bottlenecks detected.")
            
        context.append("Verified Skill Profile Matrix:")
        for sp in skills_profiles:
            sp_user = sp.user.name if sp.user else "Unknown"
            context.append(f"  * {sp_user}: {sp.skill_name} (Confidence: {sp.final_confidence_score:.2f}, Resume: {sp.resume_confidence:.2f}, Milestones: {sp.milestone_confidence:.2f})")

        context.append("")
        context.append("--- SECURITY AUDIT INTELLIGENCE (RECENT ACTIONS) ---")
        if recent_logs:
            for log in recent_logs:
                context.append(f"- [{log.created_at.strftime('%Y-%m-%d %H:%M:%S')}] User #{log.user_id} performed '{log.action}' on {log.entity_type} #{log.entity_id}. Info: {log.new_value or log.old_value or 'None'}")
        else:
            context.append("No recent audit log entries.")

        context.append("")
        context.append("--- AI DUAL-ENGINE CONTROL CENTER ---")
        context.append(f"Active Provider: {user.preferred_ai_provider} (Model: {user.preferred_ai_model})")
        context.append("Supported Providers: Gemini (Cloud, complex reasoning, 1M+ context window), Ollama (Local, secure, offline data protection)")
        
        context.append("")
        context.append("--- INACTIVE USERS ELIGIBLE FOR CLEANUP (>90 DAYS INACTIVE) ---")
        context.append(f"Total eligible accounts: {len(inactive_old_users)}")
        for u in inactive_old_users:
            context.append(f"  * User: {u.name} ({u.email}) - Created: {u.created_at.strftime('%Y-%m-%d')}")
            
        context.append("")
        context.append("--- CRITICAL DIRECTIVES FOR COMMAND PREPARATION ---")
        context.append("If the user asks you to perform an administrative action, such as 'disable all inactive accounts older than 90 days', you must:")
        context.append("1. Outline exactly what the action does, including the list of users or targets that will be affected.")
        context.append("2. Output a special structured block at the very end of your response: <!-- ACTION_PENDING: {\"action\": \"disable_inactive_users\", \"days\": 90, \"description\": \"Disable all inactive accounts older than 90 days\"} -->")
        context.append("This comment block will be intercepted by the UI to present the 'Confirm Action? OTP required' flow.")

        return "\n".join(context)

    # 1. ADMIN ROLE
    if user.role == "admin":
        from app.models.target import Target, Task
        from app.models.milestone import Milestone

        # Pending user approvals
        pending_users_res = await db.execute(
            select(User).where(User.is_approved == False, User.is_active == True)  # noqa: E712
        )
        pending_users = pending_users_res.scalars().all()

        # Active cycles
        cycle_result = await db.execute(select(Cycle).where(Cycle.is_active == True))  # noqa: E712
        active_cycles = cycle_result.scalars().all()

        # Open escalations with goal + user details
        esc_result = await db.execute(
            select(Escalation)
            .where(Escalation.status == "open")
            .options(selectinload(Escalation.goal), selectinload(Escalation.user))
        )
        open_escalations = esc_result.scalars().all()

        # Leaderboard top 5
        leaderboard_result = await db.execute(
            select(LeaderboardEntry)
            .options(selectinload(LeaderboardEntry.user))
            .order_by(LeaderboardEntry.rank.asc())
            .limit(5)
        )
        top_performers = leaderboard_result.scalars().all()

        # Global goal metrics
        goal_count_res = await db.execute(select(func.count()).select_from(Goal))
        total_goals = goal_count_res.scalar() or 0

        goals_by_status_res = await db.execute(
            select(Goal.status, func.count()).group_by(Goal.status)
        )
        status_breakdown = {row[0]: row[1] for row in goals_by_status_res.all()}

        avg_prog_res = await db.execute(select(func.avg(Goal.progress)))
        avg_progress = avg_prog_res.scalar() or 0.0

        # User counts
        user_count_res = await db.execute(
            select(User.role, func.count()).where(User.is_active == True).group_by(User.role)  # noqa: E712
        )
        role_breakdown = {row[0]: row[1] for row in user_count_res.all()}
        total_active_users = sum(role_breakdown.values())

        # Recent audit activity (last 10)
        recent_audits_res = await db.execute(
            select(AuditLog).order_by(AuditLog.created_at.desc()).limit(10)
        )
        recent_audits = recent_audits_res.scalars().all()

        context = [
            f"User: {user.name} (Role: Admin, Department: {user.department or 'N/A'})",
            "",
            "--- PLATFORM OVERVIEW ---",
            f"Active Users: {total_active_users} (Employees: {role_breakdown.get('employee', 0)}, Managers: {role_breakdown.get('manager', 0)}, Admins: {role_breakdown.get('admin', 0)})",
            f"Total Goals: {total_goals} | Avg Progress: {avg_progress:.1f}%",
            f"Goals by Status: " + ", ".join(f"{s}: {c}" for s, c in status_breakdown.items()),
            "",
            "--- PENDING USER APPROVALS ---",
        ]
        if pending_users:
            context.append(f"{len(pending_users)} user(s) awaiting approval:")
            for pu in pending_users:
                context.append(f"  * {pu.name} ({pu.email}) — Role: {pu.role}, Registered: {str(pu.created_at)[:10]}")
        else:
            context.append("No users pending approval. All accounts are cleared.")

        context += ["", "--- ACTIVE PERFORMANCE CYCLES ---"]
        if active_cycles:
            for cyc in active_cycles:
                context.append(f"- {cyc.name}: {str(cyc.start_date)[:10]} → {str(cyc.end_date)[:10]} [{cyc.status}]")
        else:
            context.append("No active cycles.")

        context += ["", "--- OPEN ESCALATIONS ---"]
        if open_escalations:
            for esc in open_escalations:
                goal_title = esc.goal.title if esc.goal else "Unknown Goal"
                emp_name = esc.user.name if esc.user else "Unknown"
                context.append(f"- Escalation #{esc.id}: '{goal_title}' owned by {emp_name} | Severity: {esc.severity} | Reason: {esc.reason}")
        else:
            context.append("No open escalations. System is healthy!")

        context += ["", "--- TOP PERFORMERS (LEADERBOARD) ---"]
        if top_performers:
            for entry in top_performers:
                emp_name = entry.user.name if entry.user else "Unknown"
                context.append(f"- #{entry.rank}: {emp_name} — Score: {entry.score:.1f}, Goals Completed: {entry.goals_completed}, Consistency: {entry.consistency_rate:.0f}%")
        else:
            context.append("No leaderboard entries yet.")

        context += ["", "--- RECENT PLATFORM ACTIVITY (AUDIT LOG) ---"]
        if recent_audits:
            for log in recent_audits:
                context.append(f"- [{str(log.created_at)[:16]}] User #{log.user_id} → '{log.action}' on {log.entity_type} #{log.entity_id}")
        else:
            context.append("No recent audit activity.")

        return "\n".join(context)
        
    # 2. MANAGER ROLE
    elif user.role == "manager":
        from app.models.target import Target, Task
        from app.models.milestone import Milestone

        # Manager's own goals
        own_result = await db.execute(
            select(Goal)
            .where(Goal.user_id == user.id)
            .options(selectinload(Goal.milestones), selectinload(Goal.checkins))
        )
        own_goals = own_result.scalars().all()

        # Managed employees
        emp_result = await db.execute(
            select(User).where(User.manager_id == user.id, User.is_active == True)  # noqa: E712
        )
        employees = emp_result.scalars().all()
        emp_ids = [emp.id for emp in employees]

        team_goals: list = []
        pending_approvals: list = []
        targets: list = []
        tasks_under_manager: list = []

        if emp_ids:
            # Team goals with owner + checkins + milestones
            team_goals_res = await db.execute(
                select(Goal)
                .where(Goal.user_id.in_(emp_ids))
                .options(
                    selectinload(Goal.owner),
                    selectinload(Goal.checkins),
                    selectinload(Goal.milestones),
                    selectinload(Goal.escalations),
                )
            )
            team_goals = team_goals_res.scalars().all()

            # Goals pending approval
            pending_res = await db.execute(
                select(Goal)
                .where(Goal.user_id.in_(emp_ids), Goal.status == "pending")
                .options(selectinload(Goal.owner))
            )
            pending_approvals = pending_res.scalars().all()

        # Targets managed by this user
        targets_res = await db.execute(
            select(Target).where(Target.manager_id == user.id)
            .options(selectinload(Target.tasks))
        )
        targets = targets_res.scalars().all()

        # Tasks assigned to manager's team
        if emp_ids:
            tasks_res = await db.execute(
                select(Task).where(Task.assigned_to.in_(emp_ids))
            )
            tasks_under_manager = tasks_res.scalars().all()

        context = [
            f"User: {user.name} (Role: Manager, Department: {user.department or 'N/A'})",
            f"Team Size: {len(employees)} direct reports",
            "",
        ]

        # Own goals summary
        context.append("--- YOUR OWN GOALS ---")
        if own_goals:
            for g in own_goals:
                done_ms = sum(1 for m in g.milestones if m.is_completed)
                total_ms = len(g.milestones)
                context.append(f"- {g.title} | Status: {g.status} | Progress: {g.progress:.0f}% | Risk: {g.risk} | Milestones: {done_ms}/{total_ms}")
        else:
            context.append("No personal goals configured.")

        # Managed targets + tasks
        context += ["", "--- MANAGED TARGETS & TASKS ---"]
        if targets:
            for tgt in targets:
                context.append(f"- Target: '{tgt.title}' | Status: {tgt.status} | Progress: {tgt.progress:.0f}%")
                for task in tgt.tasks:
                    context.append(f"  * Task: '{task.title}' | Status: {task.status} | Progress: {task.progress:.0f}% | Deadline: {str(task.deadline)[:10] if task.deadline else 'N/A'}")
        else:
            context.append("No targets assigned to you yet.")

        # Team member breakdown
        context += ["", "--- TEAM MEMBERS ---"]
        if employees:
            for emp in employees:
                emp_goals = [g for g in team_goals if g.user_id == emp.id]
                avg_prog = sum(g.progress for g in emp_goals) / len(emp_goals) if emp_goals else 0
                high_risk = sum(1 for g in emp_goals if g.risk == "High")
                context.append(f"- {emp.name} ({emp.department or 'N/A'}) | Goals: {len(emp_goals)} | Avg Progress: {avg_prog:.0f}% | High-Risk Goals: {high_risk}")
        else:
            context.append("No direct reports assigned.")

        # Team goals with check-ins
        context += ["", "--- TEAM GOALS DETAIL ---"]
        if team_goals:
            for tg in team_goals[:15]:  # Cap at 15 for context length
                owner_name = tg.owner.name if tg.owner else "Unknown"
                open_escs = [e for e in (tg.escalations or []) if e.status == "open"]
                esc_note = f" | ⚠ {len(open_escs)} escalation(s)" if open_escs else ""
                context.append(f"- '{tg.title}' by {owner_name} | {tg.status} | {tg.progress:.0f}%{esc_note}")
                if tg.checkins:
                    last_c = tg.checkins[-1]
                    context.append(f"  Last check-in ({str(last_c.created_at)[:10]}): {last_c.notes or 'No notes'}")
        else:
            context.append("No active team goals.")

        # Pending approvals
        context += ["", "--- PENDING APPROVALS ---"]
        if pending_approvals:
            for p in pending_approvals:
                owner_name = p.owner.name if p.owner else "Unknown"
                context.append(f"- '{p.title}' by {owner_name} | Target: {p.target or 'N/A'} | Deadline: {str(p.deadline)[:10] if p.deadline else 'N/A'} | Weightage: {p.weightage}")
        else:
            context.append("No goals pending your approval. All clear!")

        return "\n".join(context)
        
    # 3. EMPLOYEE / DEFAULT ROLE
    else:
        from app.models.target import Task
        from app.models.milestone import Milestone

        # Goals with milestones, check-ins, escalations
        result = await db.execute(
            select(Goal)
            .where(Goal.user_id == user.id)
            .options(
                selectinload(Goal.milestones),
                selectinload(Goal.checkins),
                selectinload(Goal.escalations),
            )
        )
        goals = result.scalars().all()

        # Assigned tasks (legacy single-assignee)
        tasks_res = await db.execute(
            select(Task).where(
                Task.assigned_to == user.id,
                Task.status.in_(["pending", "assigned", "active"])
            )
        )
        assigned_tasks = tasks_res.scalars().all()

        # User skills
        skills_res = await db.execute(
            select(SkillConfidenceProfile)
            .where(SkillConfidenceProfile.user_id == user.id)
            .limit(10)
        )
        skill_profiles = skills_res.scalars().all()

        # Manager name
        manager_name = "Not assigned"
        if user.manager_id:
            mgr_res = await db.execute(select(User).where(User.id == user.manager_id))
            mgr = mgr_res.scalar_one_or_none()
            if mgr:
                manager_name = mgr.name

        active_goals = [g for g in goals if g.status not in ("completed", "archived", "rejected")]
        completed_goals = [g for g in goals if g.status == "completed"]
        open_escalations = [
            e for g in goals for e in (g.escalations or []) if e.status == "open"
        ]

        context = [
            f"User: {user.name} (Role: Employee, Dept: {user.department or 'N/A'})",
            f"Manager: {manager_name}",
            f"Goals: {len(active_goals)} active, {len(completed_goals)} completed",
            f"Open Escalations: {len(open_escalations)}",
            "",
        ]

        # Active goals with milestone + checkin details
        context.append("--- YOUR ACTIVE GOALS ---")
        if active_goals:
            for g in active_goals:
                done_ms = sum(1 for m in g.milestones if m.is_completed)
                total_ms = len(g.milestones)
                open_escs = [e for e in (g.escalations or []) if e.status == "open"]
                esc_note = f" | ⚠ Escalated ({len(open_escs)})" if open_escs else ""
                context.append(
                    f"- '{g.title}' | {g.status} | Progress: {g.progress:.0f}% | Risk: {g.risk}"
                    f" | Milestones: {done_ms}/{total_ms} done | Deadline: {str(g.deadline)[:10] if g.deadline else 'N/A'}{esc_note}"
                )
                # Last 2 check-ins
                for c in g.checkins[-2:]:
                    context.append(f"  Check-in ({str(c.created_at)[:10]}): {c.notes or 'No notes'}")
        else:
            context.append("No active goals. Set your first goal to get started!")

        # Assigned tasks
        context += ["", "--- YOUR ASSIGNED TASKS ---"]
        if assigned_tasks:
            for task in assigned_tasks:
                context.append(
                    f"- Task: '{task.title}' | Status: {task.status} | Progress: {task.progress:.0f}%"
                    f" | Deadline: {str(task.deadline)[:10] if task.deadline else 'N/A'}"
                )
        else:
            context.append("No active tasks assigned to you.")

        # Skills
        context += ["", "--- YOUR SKILL PROFILE ---"]
        if skill_profiles:
            for sp in skill_profiles:
                context.append(f"- {sp.skill_name}: Confidence {sp.final_confidence_score:.0%}")
        else:
            context.append("No skill data yet. Upload a resume to build your skill profile.")

        return "\n".join(context)
