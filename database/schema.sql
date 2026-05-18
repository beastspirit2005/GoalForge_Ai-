-- GoalForge AI Database Schema
-- PostgreSQL 16+

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'employee',
    department VARCHAR(120),
    manager_id INTEGER REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    otp_code VARCHAR(6),
    otp_expires_at TIMESTAMPTZ,
    profile_picture_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target VARCHAR(500),
    uom VARCHAR(50),
    weightage DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    deadline VARCHAR(30),
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    progress DOUBLE PRECISION DEFAULT 0.0,
    risk VARCHAR(10) DEFAULT 'Low',
    is_shared BOOLEAN DEFAULT FALSE,
    ai_recommendation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS milestones (
    id SERIAL PRIMARY KEY,
    goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    due_date VARCHAR(30),
    is_completed BOOLEAN DEFAULT FALSE,
    source VARCHAR(20) DEFAULT 'ai',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checkins (
    id SERIAL PRIMARY KEY,
    goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    quarter VARCHAR(10) NOT NULL,
    actual_achievement DOUBLE PRECISION DEFAULT 0.0,
    progress_status VARCHAR(30) DEFAULT 'On Track',
    notes TEXT,
    manager_comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shared_goals (
    id SERIAL PRIMARY KEY,
    goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    assigned_to INTEGER NOT NULL REFERENCES users(id),
    assigned_by INTEGER NOT NULL REFERENCES users(id),
    weightage DOUBLE PRECISION DEFAULT 10.0,
    can_edit_weightage BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_goal_id ON milestones(goal_id);
CREATE INDEX IF NOT EXISTS idx_checkins_goal_id ON checkins(goal_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
