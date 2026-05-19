-- GoalForge AI Seed Data
-- Passwords: all "password123" hashed with bcrypt

-- Users (password hash = bcrypt of "password123")
INSERT INTO users (name, email, password_hash, role, department) VALUES
('Aarav Mehta', 'employee@goalforge.ai', '$2b$12$zA76FnlxRcjUJX1De7Qh8.8T2s/A83X8KM91K0Xf/RPoR66TH84Jy', 'employee', 'People Ops'),
('Priya Nair', 'manager@goalforge.ai', '$2b$12$zA76FnlxRcjUJX1De7Qh8.8T2s/A83X8KM91K0Xf/RPoR66TH84Jy', 'manager', 'Engineering'),
('Rohan Kapoor', 'admin@goalforge.ai', '$2b$12$zA76FnlxRcjUJX1De7Qh8.8T2s/A83X8KM91K0Xf/RPoR66TH84Jy', 'admin', 'HR'),
('Neha Rao', 'neha@goalforge.ai', '$2b$12$zA76FnlxRcjUJX1De7Qh8.8T2s/A83X8KM91K0Xf/RPoR66TH84Jy', 'employee', 'Engineering'),
('Kabir Singh', 'kabir@goalforge.ai', '$2b$12$zA76FnlxRcjUJX1De7Qh8.8T2s/A83X8KM91K0Xf/RPoR66TH84Jy', 'employee', 'Sales');

-- Set manager relationships
UPDATE users SET manager_id = 2 WHERE email IN ('employee@goalforge.ai', 'neha@goalforge.ai', 'kabir@goalforge.ai');

-- Goals
INSERT INTO goals (user_id, title, description, target, weightage, deadline, status, progress, risk, ai_recommendation) VALUES
(1, 'Launch AI onboarding playbook', 'Publish onboarding journey and reduce ramp time by 20%', 'Reduce ramp time by 20%', 30.0, '2026-06-28', 'approved', 72, 'Low', 'Record the first three mentor sessions this week and convert repeat questions into checklist items.'),
(4, 'Improve sprint delivery predictability', 'Raise planned-to-done ratio from 61% to 82%', '82% planned-to-done ratio', 35.0, '2026-07-12', 'approved', 46, 'Medium', 'Split the two largest workstreams before the next planning meeting and flag dependency owners early.'),
(5, 'Grow enterprise pipeline', 'Add 35 qualified enterprise opportunities', '35 qualified opportunities', 40.0, '2026-06-30', 'pending', 31, 'High', 'Prioritize accounts with active procurement signals and schedule manager review for stalled prospects.');

-- Milestones
INSERT INTO milestones (goal_id, title, due_date, is_completed, source) VALUES
(1, 'Map first-week employee journey', 'Week 1', TRUE, 'ai'),
(1, 'Draft AI FAQ prompts', 'Week 2', TRUE, 'ai'),
(1, 'Pilot with 6 new hires', 'Week 3', FALSE, 'ai'),
(1, 'Measure ramp-time delta', 'Week 4', FALSE, 'ai'),
(2, 'Audit spillover themes', 'Week 1', TRUE, 'ai'),
(2, 'Create dependency board', 'Week 2', FALSE, 'ai'),
(2, 'Run two planning calibration sessions', 'Week 3', FALSE, 'ai'),
(2, 'Publish predictability report', 'Week 4', FALSE, 'ai'),
(3, 'Refresh ICP account list', 'Week 1', TRUE, 'ai'),
(3, 'Launch procurement-signal outreach', 'Week 2', FALSE, 'ai'),
(3, 'Book 18 discovery calls', 'Week 3', FALSE, 'ai'),
(3, 'Convert 9 opportunities', 'Week 4', FALSE, 'ai');

-- Check-ins
INSERT INTO checkins (goal_id, user_id, quarter, actual_achievement, progress_status, notes) VALUES
(1, 1, 'Q2-2026', 72, 'On Track', 'Completed AI FAQ prompts. Piloting next week.'),
(2, 4, 'Q2-2026', 46, 'Needs Review', 'Dependency board in progress. Need manager input.'),
(3, 5, 'Q2-2026', 31, 'At Risk', 'Discovery calls not converting fast enough.');

-- Audit logs
INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES
(1, 'goal_created', 'goal', 1),
(2, 'goal_approved', 'goal', 1),
(4, 'goal_created', 'goal', 2),
(2, 'goal_approved', 'goal', 2),
(5, 'goal_created', 'goal', 3);
