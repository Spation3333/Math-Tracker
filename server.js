const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');

<<<<<<< HEAD
const app = express();

// --- EMAIL SETUP ---
=======
// 1. Set up the connection using your sender email
>>>>>>> 5ef86dac68c6895e96081190d71777c0c0f2eb67
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'owensirrichard@gmail.com',
<<<<<<< HEAD
        pass: 'eanr zmoa tdjs ypzl' 
    }
});

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const dbPath = path.join(__dirname, 'world.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (!err) {
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS Students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                student_email TEXT,
                guardian_email TEXT,
                class_name TEXT
            )`);
=======
        pass: 'eanr zmoa tdjs ypzl' // Paste the Google code here (no spaces)
    }
});

const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json()); // Allows the server to read JSON from the website
// This tells Express to serve your HTML/CSS files from your folder
app.use(express.static(__dirname));
// --- DATABASE CONNECTION ---

// --- PERMANENT DATABASE SETUP ---
const dbPath = path.join(__dirname, 'world.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Database connection error:", err.message);
    } else {
        console.log("Connected to MathTrack database.");
        // This block runs every time the server starts to ensure the schema is perfect
        db.serialize(() => {
            // 1. Create the table if it's missing
            db.run(`CREATE TABLE IF NOT EXISTS Students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                guardian_email TEXT,
                class_name TEXT
            )`);

            // 2. Automatically add the class_name column if an old version of the DB is being used
            db.run("ALTER TABLE Students ADD COLUMN class_name TEXT", (err) => {
                if (err && !err.message.includes("duplicate column name")) {
                    console.error("Error verifying columns:", err.message);
                }
            });
>>>>>>> 5ef86dac68c6895e96081190d71777c0c0f2eb67
        });
    }
});

<<<<<<< HEAD
const getRecipients = (student) => {
    const list = [];
    if (student.student_email && student.student_email.trim()) {
        list.push(student.student_email.trim());
    }
    if (student.guardian_email && student.guardian_email.trim()) {
        const parents = student.guardian_email.split(',').map(e => e.trim()).filter(Boolean);
        list.push(...parents);
    }
    return [...new Set(list)];
};

// 1. POST: Send Individual Email (Accepts custom subject and text)
app.post('/send-individual/:id', (req, res) => {
    const { id } = req.params;
    const { subject, text } = req.body; 

    db.get("SELECT * FROM Students WHERE id = ?", [id], (err, student) => {
        if (err || !student) return res.status(404).json({ error: "Student not found." });

        const recipients = getRecipients(student);
        if (recipients.length === 0) return res.status(400).json({ error: "No email addresses found." });

        const mailOptions = {
            from: 'owensirrichard@gmail.com',
            to: recipients, 
            subject: subject || `MathTrack Progress Update`,
            text: text || `Hello ${student.name},\n\nThis is an update regarding your MathTrack progress.`
        };

        transporter.sendMail(mailOptions, (error) => {
            if (error) return res.status(500).json({ error: "Failed to send" });
            res.json({ message: "Emails sent to student and guardian!" });
        });
    });
});

// 2. POST: Send Bulk Class Emails (Accepts customized messages mapped by student ID)
app.post('/send-all/:class_name', (req, res) => {
    const className = req.params.class_name;
    const messages = req.body.messages || {}; // Maps student ID to their specific grades message

    db.all("SELECT * FROM Students WHERE class_name = ?", [className], (err, rows) => {
        if (err || rows.length === 0) return res.status(404).json({ error: "No students found." });

        rows.forEach(student => {
            const recipients = getRecipients(student);
            if (recipients.length > 0) {
                const customMsg = messages[student.id] || {};
                const mailOptions = {
                    from: 'owensirrichard@gmail.com',
                    to: recipients,
                    subject: customMsg.subject || `MathTrack Bulk Update: ${className}`,
                    text: customMsg.text || `Hello ${student.name},\n\nThis is a progress notification for your class.`
                };
                transporter.sendMail(mailOptions);
            }
        });
        res.json({ message: "Class emails are processing!" });
    });
});

// --- STANDARD API ROUTES ---
app.post('/api/add', (req, res) => {
    const { name, student_email, guardian_email, class_name } = req.body;
    db.run(`INSERT INTO Students (name, student_email, guardian_email, class_name) VALUES (?, ?, ?, ?)`, 
    [name, student_email, guardian_email, class_name], (err) => {
        res.json({ status: "Success" });
    });
});

app.get('/api/data/:class_name', (req, res) => {
    db.all("SELECT * FROM Students WHERE class_name = ?", [req.params.class_name], (err, rows) => {
=======
// --- ROUTES ---
// 1. GET: Fetch all student progress
// This route handles fetching students for a SPECIFIC class (A, B, C, or D)
app.get('/api/data/:class_name', (req, res) => {
    const className = req.params.class_name;
    const sql = "SELECT * FROM Students WHERE class_name = ?";
   
    db.all(sql, [className], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
>>>>>>> 5ef86dac68c6895e96081190d71777c0c0f2eb67
        res.json({ data: rows });
    });
});

<<<<<<< HEAD
app.put('/api/update/:id', (req, res) => {
    const { name, student_email, guardian_email } = req.body;
    db.run("UPDATE Students SET name = ?, student_email = ?, guardian_email = ? WHERE id = ?", 
    [name, student_email, guardian_email, req.params.id], (err) => {
        res.json({ status: "Updated" });
    });
});

app.delete('/api/delete/:id', (req, res) => {
    db.run("DELETE FROM Students WHERE id = ?", [req.params.id], (err) => {
        res.json({ status: "Deleted" });
    });
});

app.listen(3000, () => console.log(`Server live at http://localhost:3000`));
=======
// This route handles the old "All Students" request just in case
app.get('/api/data', (req, res) => {
    db.all("SELECT * FROM Students", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ data: rows });
    });
});

// 2. POST: Add a new student or lesson update
app.post('/api/add', (req, res) => {
    // NEW: We added class_name here so the server knows what class to put them in!
    const { name, guardian_email, class_name } = req.body;
   
    // NEW: Updated the SQL to save the name, email, and class_name
    const sql = `INSERT INTO Students (name, guardian_email, class_name)
                 VALUES (?, ?, ?)`;
    const params = [name, guardian_email, class_name];

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
            status: "Success",
            id: this.lastID
        });
    });
});

// 2. Update the email sending route
app.post('/send-all/:class_name', (req, res) => {
    const className = req.params.class_name;
    const sql = "SELECT * FROM Students WHERE class_name = ?";
   
    db.all(sql, [className], (err, rows) => {
        if (err || rows.length === 0) {
            return res.status(500).json({ error: "No students found." });
        }

        // Loop through the students and send an email
        rows.forEach(student => {
            const mailOptions = {
                from: 'owensirrichard@gmail.com', // MUST match your auth user
                to: student.guardian_email, // This will be sahelsajin@gmail.com from the database
                subject: `MathTrack Update: ${className}`,
                text: `Hello ${student.name},\n\nThis is a test email sent from my MathTrack Node.js server!`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(`Failed to send to ${student.guardian_email}:`, error);
                } else {
                    console.log(`Email successfully sent to ${student.guardian_email}`);
                }
            });
        });

        res.json({ message: "Emails are processing!" });
    });
});

// 3. DELETE: Remove a student entry
app.delete('/api/delete/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM Students WHERE id = ?";

    db.run(sql, id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ status: "Deleted", rowsAffected: this.changes });
    });
});

// Add this to your ROUTES section in server.js
// 4. DELETE: Clear all students (for overwriting during import)
app.delete('/api/clear', (req, res) => {
    const sql = "DELETE FROM Students";
    db.run(sql, [], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ status: "Table cleared", rowsAffected: this.changes });
    });
});

// 5. PUT: Update an existing student
app.put('/api/update/:id', (req, res) => {
    const id = req.params.id;
    const { name, guardian_email } = req.body;
    const sql = "UPDATE Students SET name = ?, guardian_email = ? WHERE id = ?";
   
    db.run(sql, [name, guardian_email, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ status: "Updated", rowsAffected: this.changes });
    });
});

// --- SHUTDOWN ROUTE ---
app.post('/api/quit', (req, res) => {
    res.json({ message: "Server shutting down..." });
    console.log("Shutdown signal received. Closing server...");
   
    // Small delay to allow the response to reach the browser before dying
    setTimeout(() => {
        process.exit(0);
    }, 500);
});

// --- START SERVER ---
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server live at http://localhost:${PORT}`);
    console.log("Press Ctrl+C to stop.");
});
>>>>>>> 5ef86dac68c6895e96081190d71777c0c0f2eb67
