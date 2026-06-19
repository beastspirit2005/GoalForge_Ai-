"""Explainable Recommender — generates structured rationale for AI recommendations."""


def generate_recommendation_explanation(
    candidate: dict,
    context_type: str = "task",
) -> dict:
    """
    Generate a human-readable structured explanation for a recommendation.

    Args:
        candidate: Dict with 'name', 'score', 'factors', 'reasons' keys
        context_type: 'task' or 'target'
    """
    name = candidate.get("name", "Unknown")
    score = candidate.get("score", 0)
    reasons = candidate.get("reasons", [])
    factors = candidate.get("factors", {})

    # Determine confidence level
    if score >= 80:
        confidence = "High"
        emoji = "🟢"
    elif score >= 60:
        confidence = "Medium"
        emoji = "🟡"
    else:
        confidence = "Low"
        emoji = "🔴"

    # Build summary
    summary_parts = []
    if factors.get("skill_fit", 0) >= 70:
        summary_parts.append("strong skill match")
    if factors.get("completion_rate", 0) >= 80:
        summary_parts.append("high completion rate")
    if factors.get("availability", 0) >= 60:
        summary_parts.append("good availability")
    if factors.get("track_record", 0) >= 50:
        summary_parts.append("proven track record")

    summary = f"{name} is recommended due to {', '.join(summary_parts) if summary_parts else 'overall balanced fit'}"

    return {
        "recommended": name,
        "confidence": confidence,
        "confidence_emoji": emoji,
        "match_score": score,
        "summary": summary,
        "detailed_reasons": reasons,
        "factor_breakdown": factors,
    }
