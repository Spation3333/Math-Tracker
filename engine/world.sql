DROP TABLE IF EXISTS Students;

CREATE TABLE Students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    guardian_email TEXT,
    lesson_name TEXT,
    completion_pct INTEGER,
    is_late INTEGER -- 0 for on-time 1 for late
);

-- Add a test student
INSERT INTO Students (name, guardian_email, lesson_name, completion_pct, is_late) 
VALUES ('John Doe', 'parent@example.com', 'Algebra 1.1', 75, 0);




