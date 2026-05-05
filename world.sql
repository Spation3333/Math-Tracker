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
INSERT INTO Students (name, guardian_email, lesson_name, completion_pct, is_late, class_name)
VALUES ('John Doe', 'parent@example.com', 'Algebra 1.1', 75, 0, 'Class A');