-- Create Tables

-- USERS Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  fName VARCHAR(15) NOT NULL,
  lName VARCHAR(15) NOT NULL,
  email VARCHAR(50) UNIQUE NOT NULL,
  role VARCHAR(10) CHECK (role IN ('student', 'instructor', 'admin')) DEFAULT 'student',
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
