-- CODE_RUNS audit log: every Piston execution
CREATE TABLE IF NOT EXISTS code_runs (
  id BIGSERIAL PRIMARY KEY,
  firebase_uid VARCHAR(128) NOT NULL,
  course_id INT,
  activity_id INT,
  language VARCHAR(32) NOT NULL,
  version VARCHAR(32) NOT NULL,
  exit_code INT,
  signal VARCHAR(32),
  duration_ms INT,
  stdout_bytes INT,
  stderr_bytes INT,
  code_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_code_runs_uid_created
  ON code_runs(firebase_uid, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_code_runs_activity
  ON code_runs(activity_id, created_at DESC);
