"""Dynamic AI guidance — adaptive recommendations based on current goal state."""

from app.ai.gemini_client import ai_buddy_chat
from app.ai.prediction_engine import predict_completion_probability, _days_between


def generate_dynamic_guidance(
    goal_title: str,
    progress: float,
    deadline: str | None,
    milestone_rate: float,
    goal_count: int,
    risk: str,
) -> dict:
    """
    Generate adaptive guidance based on current goal state.
    Uses prediction factors to generate contextual advice.
    """
    days_left = _days_between(deadline)

    guidance_parts = []
    priority = "normal"

    # ── Critical alerts ──
    if days_left is not None and days_left <= 0 and progress < 100:
        guidance_parts.append(
            f"⚠️ **Overdue Alert**: This goal is {abs(days_left)} days past deadline at {progress}% progress. "
            "Immediate action required — consider requesting a deadline extension or adjusting scope."
        )
        priority = "critical"

    elif days_left is not None and days_left <= 7 and progress < 80:
        guidance_parts.append(
            f"🔴 **Deadline Approaching**: Only {days_left} days remaining with {progress}% complete. "
            f"You need approximately {(100 - progress) / max(days_left, 1):.1f}% progress per day."
        )
        priority = "high"

    elif risk.lower() == "high":
        guidance_parts.append(
            f"🟡 **High Risk**: Current trajectory suggests potential delay. "
            "Focus on the highest-impact milestone this week to shift momentum."
        )
        priority = "high"

    # ── Progress-based guidance ──
    if progress < 25:
        guidance_parts.append(
            "💡 **Getting Started**: Break the goal into 2-3 immediate action items. "
            "Complete one small win today to build momentum."
        )
    elif progress < 50:
        guidance_parts.append(
            "📊 **Building Momentum**: You're making progress. Review your milestones "
            "and prioritize the ones with the highest dependency chains first."
        )
    elif progress < 75:
        guidance_parts.append(
            "🚀 **Good Traction**: Past the halfway mark! Focus on quality over speed now. "
            "Consider updating your manager on progress to maintain visibility."
        )
    elif progress < 100:
        guidance_parts.append(
            "🏁 **Final Stretch**: Almost there! Verify completion criteria and prepare "
            "evidence of achievement for your check-in review."
        )

    # ── Workload guidance ──
    if goal_count > 6:
        guidance_parts.append(
            "⚡ **Workload Alert**: You have more than 6 active goals. Consider discussing "
            "priority adjustments with your manager to avoid spreading too thin."
        )

    # ── Milestone guidance ──
    if milestone_rate < 40:
        guidance_parts.append(
            "🎯 **Milestone Focus**: Less than 40% of milestones completed. "
            "Pick the smallest incomplete milestone and finish it today for a quick win."
        )

    return {
        "guidance": "\n\n".join(guidance_parts) if guidance_parts else "✅ On track. Keep up the great work!",
        "priority": priority,
        "progress": progress,
        "days_remaining": days_left,
        "milestone_rate": milestone_rate,
    }
