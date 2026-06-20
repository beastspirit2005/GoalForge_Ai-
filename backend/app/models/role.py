from __future__ import annotations
"""Enumerations used across the application."""

import enum


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    DEPARTMENT_HEAD = "department_head"
    HR = "hr"
    MANAGER = "manager"
    TEAM_LEAD = "team_lead"
    EMPLOYEE = "employee"
    ADMIN = "admin"


class GoalStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    LOCKED = "locked"
    COMPLETED = "completed"


class GoalRisk(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class CheckinStatus(str, enum.Enum):
    ON_TRACK = "On Track"
    NEEDS_REVIEW = "Needs Review"
    AT_RISK = "At Risk"
    COMPLETED = "Completed"


class NotificationType(str, enum.Enum):
    GOAL_SUBMITTED = "goal_submitted"
    GOAL_APPROVED = "goal_approved"
    GOAL_REJECTED = "goal_rejected"
    GOAL_LOCKED = "goal_locked"
    GOAL_UNLOCKED = "goal_unlocked"
    CHECKIN_DUE = "checkin_due"
    RISK_ALERT = "risk_alert"
    AI_PLAN_READY = "ai_plan_ready"
