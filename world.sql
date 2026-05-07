DROP TABLE IF EXISTS Students;

CREATE TABLE Students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    guardian_email TEXT,
    lesson_name TEXT,
    completion_pct INTEGER,
    is_late INTEGER,
    class_name TEXT NOT NULL -- Added this to separate Classes A, B, C, and D
);

-- Add a test student for Class A
<<<<<<< HEAD
INSERT INTO Students (name, guardian_email, lesson_name, completion_pct, is_late, class_name) 
=======
INSERT INTO Students (name, guardian_email, lesson_name, completion_pct, is_late, class_name)
>>>>>>> 5ef86dac68c6895e96081190d71777c0c0f2eb67
VALUES ('John Doe', 'parent@example.com', 'Algebra 1.1', 75, 0, 'Class A');