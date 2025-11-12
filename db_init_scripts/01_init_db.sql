
-- USERS Table (Super)
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  fName VARCHAR(15) NOT NULL,
  lName VARCHAR(15) NOT NULL,
  email VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- STUDENTS Table (Sub)
CREATE TABLE students (
  user_id INT UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  student_id SERIAL PRIMARY KEY,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  level VARCHAR(50),
  points INT DEFAULT 0
);

-- INSTRUCTORS Table (Sub)
CREATE TABLE instructors (
  user_id INT UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  instructor_id SERIAL PRIMARY KEY,
  department VARCHAR(50)
);

-- ADMINS Table (Sub)
CREATE TABLE admins (
  user_id INT UNIQUE REFERENCES users(user_id),
  admin_id SERIAL PRIMARY KEY,
  access_level VARCHAR(20)
);

-- COURSES Table
CREATE TABLE courses (
  course_id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  course_code VARCHAR(8) NOT NULL,
  description TEXT,
  instructor_id INT NOT NULL REFERENCES instructors(instructor_id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ENROLLMENT Table (Junction between Students and Courses)
CREATE TABLE enrollments (
  enrollment_id SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES students(student_id),
  course_id INT NOT NULL REFERENCES courses(course_id),
  enrollment_date DATE DEFAULT CURRENT_DATE,
  grade VARCHAR(2),
  status VARCHAR(20) CHECK (status IN ('active', 'completed', 'dropped')) DEFAULT 'active',
  UNIQUE(student_id, course_id)
);

-- MANAGES Table (Junction between Admins and Courses)
CREATE TABLE manages (
  edit_id SERIAL PRIMARY KEY,
  admin_id INT NOT NULL REFERENCES admins(admin_id),
  course_id INT NOT NULL REFERENCES courses(course_id),
  permission_level VARCHAR(20),
  UNIQUE(admin_id, course_id)
);
