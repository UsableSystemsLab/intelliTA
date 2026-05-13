-- =========================================================================
-- Gamification data model
-- Alters submissions and adds tables for points, badges, ledger, notifications
-- Safe to re-run: uses IF NOT EXISTS / ON CONFLICT DO NOTHING throughout.
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. SUBMISSIONS — add new columns
-- -------------------------------------------------------------------------
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS started_at     TIMESTAMP,
  ADD COLUMN IF NOT EXISTS status         VARCHAR(8),
  ADD COLUMN IF NOT EXISTS active_seconds INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hints_used     INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS attempt_number INT;

-- Backfill existing rows so we can enforce NOT NULL.
UPDATE submissions SET started_at = created_at WHERE started_at IS NULL;
UPDATE submissions SET status     = 'FAILED'   WHERE status     IS NULL;

-- Backfill attempt_number per (user_id, activity_id) ordered by created_at.
WITH numbered AS (
  SELECT submission_id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, activity_id
           ORDER BY created_at, submission_id
         ) AS rn
  FROM submissions
)
UPDATE submissions s
SET attempt_number = numbered.rn
FROM numbered
WHERE s.submission_id = numbered.submission_id
  AND s.attempt_number IS NULL;

-- Enforce NOT NULL + CHECK now that backfill is done.
ALTER TABLE submissions
  ALTER COLUMN started_at     SET NOT NULL,
  ALTER COLUMN status         SET NOT NULL,
  ALTER COLUMN attempt_number SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'submissions_status_check'
  ) THEN
    ALTER TABLE submissions
      ADD CONSTRAINT submissions_status_check
      CHECK (status IN ('PASSED', 'FAILED'));
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_submissions_user_activity
  ON submissions(user_id, activity_id);

-- -------------------------------------------------------------------------
-- 2. ACTIVITY_TEST_CASES
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_test_cases (
  test_case_id SERIAL PRIMARY KEY,
  activity_id  INT NOT NULL REFERENCES activities(activity_id) ON DELETE CASCADE,
  kind         VARCHAR(4) NOT NULL CHECK (kind IN ('CODE', 'QUIZ')),
  external_ref VARCHAR(255) NOT NULL,
  points       INT NOT NULL DEFAULT 0,
  position     INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (activity_id, kind, external_ref)
);

CREATE INDEX IF NOT EXISTS idx_activity_test_cases_activity
  ON activity_test_cases(activity_id);

-- -------------------------------------------------------------------------
-- 3. SUBMISSION_TEST_RESULTS
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS submission_test_results (
  result_id      SERIAL PRIMARY KEY,
  submission_id  INT NOT NULL REFERENCES submissions(submission_id) ON DELETE CASCADE,
  test_case_id   INT NOT NULL REFERENCES activity_test_cases(test_case_id) ON DELETE CASCADE,
  passed         BOOLEAN NOT NULL,
  points_awarded INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (submission_id, test_case_id)
);

CREATE INDEX IF NOT EXISTS idx_submission_test_results_submission
  ON submission_test_results(submission_id);

-- -------------------------------------------------------------------------
-- 4. USER_POINTS
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_points (
  user_id             INT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  total_points        INT  NOT NULL DEFAULT 0,
  current_streak_days INT  NOT NULL DEFAULT 0,
  longest_streak_days INT  NOT NULL DEFAULT 0,
  last_streak_date    DATE,
  last_activity_at    TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- 5. BADGES (catalog)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS badges (
  badge_id    SERIAL PRIMARY KEY,
  code        VARCHAR(32) UNIQUE NOT NULL,
  name        VARCHAR(64) NOT NULL,
  description TEXT,
  icon_url    TEXT,
  tier        VARCHAR(8) NOT NULL CHECK (tier IN ('BRONZE', 'SILVER', 'GOLD')),
  awarded_by  VARCHAR(12) NOT NULL CHECK (awarded_by IN ('AUTO', 'INSTRUCTOR')),
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Seed badge catalog.
INSERT INTO badges (code, name, description, icon_url, tier, awarded_by) VALUES
  ('EARLYBIRD',        'Earlybird',        'Among the first to pass this activity.',     NULL, 'BRONZE', 'AUTO'),
  ('BUG_HUNTER',       'Bug Hunter',       'Awarded by an instructor for reporting an issue.', NULL, 'SILVER', 'INSTRUCTOR'),
  ('NIGHT_OWL',        'Night Owl',        'Passed an activity between midnight and 5 AM.', NULL, 'BRONZE', 'AUTO'),
  ('SPEED_RUNNER',     'Speed Runner',     'Passed an activity on the first attempt in under 15 minutes.', NULL, 'SILVER', 'AUTO'),
  ('LAST_MINUTES',     'Last Minutes',     'Passed within the final hour before the deadline.', NULL, 'BRONZE', 'AUTO'),
  ('FLAWLESS_VICTORY', 'Flawless Victory', 'Passed every test on the first attempt.', NULL, 'GOLD', 'AUTO'),
  ('MILESTONE_100',    'Milestone: 100',   'Reached 100 total points.',   NULL, 'BRONZE', 'AUTO'),
  ('MILESTONE_500',    'Milestone: 500',   'Reached 500 total points.',   NULL, 'SILVER', 'AUTO'),
  ('MILESTONE_1000',   'Milestone: 1000',  'Reached 1,000 total points.', NULL, 'GOLD',   'AUTO'),
  ('MILESTONE_5000',   'Milestone: 5000',  'Reached 5,000 total points.', NULL, 'GOLD',   'AUTO')
ON CONFLICT (code) DO NOTHING;

-- -------------------------------------------------------------------------
-- 6. USER_BADGES
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_badges (
  user_badge_id      SERIAL PRIMARY KEY,
  user_id            INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  badge_id           INT NOT NULL REFERENCES badges(badge_id) ON DELETE CASCADE,
  activity_id        INT REFERENCES activities(activity_id) ON DELETE SET NULL,
  awarded_at         TIMESTAMP NOT NULL DEFAULT NOW(),
  awarded_by_user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
  UNIQUE (user_id, badge_id, activity_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);

-- -------------------------------------------------------------------------
-- 7. POINTS_LEDGER (append-only)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS points_ledger (
  ledger_id     SERIAL PRIMARY KEY,
  user_id       INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  submission_id INT REFERENCES submissions(submission_id) ON DELETE SET NULL,
  activity_id   INT REFERENCES activities(activity_id) ON DELETE SET NULL,
  event_type    VARCHAR(24) NOT NULL CHECK (
                  event_type IN ('BASE','STREAK_BONUS','NO_HINT_BONUS','HINT_PENALTY','BUG_HUNTER_AWARD')
                ),
  points        INT NOT NULL,
  metadata      JSONB,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_points_ledger_submission_event
  ON points_ledger(submission_id, event_type)
  WHERE submission_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_points_ledger_user_created
  ON points_ledger(user_id, created_at DESC);

-- -------------------------------------------------------------------------
-- 8. NOTIFICATIONS
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  notification_id SERIAL PRIMARY KEY,
  user_id         INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  type            VARCHAR(24) NOT NULL CHECK (
                    type IN ('POINTS_EARNED','BADGE_EARNED','INSTRUCTOR_AWARD')
                  ),
  title           VARCHAR(255) NOT NULL,
  body            TEXT,
  metadata        JSONB,
  is_read         BOOLEAN NOT NULL DEFAULT false,
  read_at         TIMESTAMP,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread_created
  ON notifications(user_id, is_read, created_at DESC);
