-- Enable pgcrypto extension for encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- USERS Table
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  firebase_uid VARCHAR(128) UNIQUE NOT NULL,
  fName VARCHAR(15) NOT NULL,
  lName VARCHAR(15) NOT NULL,
  email VARCHAR(50) UNIQUE NOT NULL,
  bio TEXT,
  photo_url TEXT,
  github_username VARCHAR(39) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- COURSES Table
CREATE TABLE courses (
  course_id SERIAL PRIMARY KEY,
  instructor_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  course_code VARCHAR(8) NOT NULL,
  token VARCHAR(6) UNIQUE,
  allowed_students JSON DEFAULT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ENROLLMENT Table (Junction between Users and Courses for "Student" role)
CREATE TABLE enrollments (
  enrollment_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  course_id INT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  grade VARCHAR(2),
  points INT DEFAULT 0,
  enrolled_name VARCHAR(100) DEFAULT NULL,
  status VARCHAR(20) CHECK (status IN ('active', 'completed', 'dropped')) DEFAULT 'active',
  UNIQUE(user_id, course_id)
);

-- LABS Table
CREATE TABLE labs (
  lab_id SERIAL PRIMARY KEY,
  course_id INT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('video', 'markdown')),
  video_url TEXT,
  markdown_text TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- CONVERSATIONS Table
CREATE TABLE conversations (
  conversation_id SERIAL PRIMARY KEY,
  firebase_uid    VARCHAR(128) NOT NULL,
  activity_id     INT NOT NULL,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE(firebase_uid, activity_id)
);

-- CHAT_MESSAGES Table
CREATE TABLE chat_messages (
  message_id      SERIAL PRIMARY KEY,
  conversation_id INT NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
  role            VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content         TEXT NOT NULL,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_conv ON chat_messages(conversation_id);

-- VIDEO_TRANSCRIPTS Table
CREATE TABLE video_transcripts (
  transcript_id SERIAL PRIMARY KEY,
  activity_id INT NOT NULL UNIQUE REFERENCES activities(activity_id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  transcript_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  duration_seconds INT,
  word_count INT,
  language VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_video_transcripts_status ON video_transcripts(status);
-- Adding missing ACTIVITIES and SUBMISSIONS tables, because they were missing (they were auto created in POSTGRE automatically by sequlize)
-- ACTIVITIES Table
CREATE TABLE activities (
  activity_id      SERIAL PRIMARY KEY,
  course_id        INT NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  title            VARCHAR(255) NOT NULL,
  start_date       TIMESTAMP NOT NULL,
  end_date         TIMESTAMP NOT NULL,
  video_url        VARCHAR(500),
  md_file_url      VARCHAR(500),
  starter_code_url VARCHAR(500),
  quiz_url         VARCHAR(500),
  github_classroom_url VARCHAR(500),
  created_at       TIMESTAMP DEFAULT NOW()
);

-- SUBMISSIONS Table
CREATE TABLE submissions (
  submission_id SERIAL PRIMARY KEY,
  user_id       INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  activity_id   INT NOT NULL REFERENCES activities(activity_id) ON DELETE CASCADE,
  score         INT DEFAULT 0,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- QUIZ_QUESTIONS Table
CREATE TABLE quiz_questions (
  id             SERIAL PRIMARY KEY,
  activity_id    INT NOT NULL REFERENCES activities(activity_id) ON DELETE CASCADE,
  time_seconds   INT NOT NULL,
  type           VARCHAR(20) NOT NULL CHECK (type IN ('mcq', 'true_false', 'fill_blank', 'coding')),
  question       TEXT,
  title          VARCHAR(255),
  instruction    TEXT,
  file_name      VARCHAR(255),
  check_regex    TEXT,
  options        JSONB,
  correct_answer JSONB,
  created_at     TIMESTAMP DEFAULT NOW()
);

-- VIDEO_PROGRESS Table
CREATE TABLE video_progress (
  id                   SERIAL PRIMARY KEY,
  user_id              INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  activity_id          INT NOT NULL REFERENCES activities(activity_id) ON DELETE CASCADE,
  last_watched_seconds INT NOT NULL DEFAULT 0,
  updated_at           TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, activity_id)
);

-- STUDENT_ANSWERS Table
CREATE TABLE student_answers (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  question_id INT NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  activity_id INT NOT NULL REFERENCES activities(activity_id) ON DELETE CASCADE,
  answer      JSONB NOT NULL,
  is_correct  BOOLEAN NOT NULL,
  answered_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_quiz_questions_activity  ON quiz_questions(activity_id);
CREATE INDEX idx_student_answers_activity ON student_answers(activity_id, user_id);

-- USER_API_KEYS Table
CREATE TABLE user_api_keys (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  base_url   VARCHAR(255) NOT NULL,
  api_key    TEXT NOT NULL,
  model_name VARCHAR(100) NOT NULL,
  label      VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, base_url)
);

-- GITHUB_CONNECTIONS Table (course-level GitHub OAuth)
CREATE TABLE github_connections (
  id                   SERIAL PRIMARY KEY,
  course_id            INT NOT NULL UNIQUE REFERENCES courses(course_id) ON DELETE CASCADE,
  github_client_id     VARCHAR(100) NOT NULL,
  github_client_secret TEXT NOT NULL,
  github_token         TEXT,
  github_username      VARCHAR(39),
  github_org           VARCHAR(100),
  created_at           TIMESTAMP DEFAULT NOW(),
  updated_at           TIMESTAMP DEFAULT NOW()
);