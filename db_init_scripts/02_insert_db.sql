
-- INSERT INTO users (firebase_uid, fName, lName, email)
-- VALUES 
--   ('uid001', 'Mohamed', 'Ali', 'mali@example.com'),
--   ('uid002', 'Fatima', 'Hassan', 'fhassan@example.com'),
--   ('uid003', 'Ahmed', 'Mahmoud', 'amahmoud@example.com'),
--   ('uid004', 'Sara', 'Abdullah', 'sabdullah@example.com'),
--   ('uid005', 'Yusuf', 'Ibrahim', 'yibrahim@example.com')
-- RETURNING user_id;

-- INSERT INTO instructors (user_id, department)
-- VALUES
--   (1, 'Computer Science'),
--   (2, 'Software Engineering');

-- INSERT INTO students (user_id, level, points)
-- VALUES
--   (3, 'Level 3', 120),
--   (4, 'Level 1', 40),
--   (5, 'Level 2', 75);

-- INSERT INTO admins (user_id, access_level)
-- VALUES
--   (1, 'superadmin');   

-- INSERT INTO courses (title, course_code, description)
-- VALUES
--   ('Introduction to Programming', 'CPCS202', 'Learn basic programming.'),
--   ('Data Structures', 'CPCS204', 'Learn about data structures.');

-- INSERT INTO course_instructors (course_id, instructor_id)
-- VALUES
--   (1, 1),  
--   (2, 2);   




-- INSERT INTO labs (course_id, title, type, video_url, markdown_text)
-- VALUES
--   (1, 'Lab 1 - Variables', 'markdown', NULL, '# Variables Lab\nLearn variables.'),
--   (1, 'Lab 2 - Loops', 'video', 'https://youtube.com/video123', NULL),
--   (2, 'Lab 1 - Arrays', 'markdown', NULL, '## Arrays Lab\nWork on arrays.');



-- INSERT INTO enrollments (student_id, course_id, grade, status)
-- VALUES
--   (1, 1, 'A', 'active'),
--   (2, 1, 'B', 'completed'),
--   (3, 2, 'A', 'active');



-- INSERT INTO manages (admin_id, course_id, permission_level)
-- VALUES
--   (1, 1, 'full'),
--   (1, 2, 'edit');
