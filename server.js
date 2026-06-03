const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();

// Increase JSON limit to 50mb to allow for base64 image uploads in emails
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(__dirname));

const dbPath = path.join(__dirname, 'world.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (!err) {
        db.serialize(() => {
            // Original Student Tables
            db.run(`CREATE TABLE IF NOT EXISTS Students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                student_email TEXT,
                guardian_email TEXT,
                contacts_info TEXT,
                class_name TEXT
            )`);
            db.run("ALTER TABLE Students ADD COLUMN contacts_info TEXT", (err) => { });

            // New Textbook Inventory Tables
            db.run(`CREATE TABLE IF NOT EXISTS Courses (
                course_code TEXT PRIMARY KEY,
                title TEXT,
                publisher TEXT,
                replacement_cost REAL,
                total_quantity INTEGER
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS Copies (
                copy_number TEXT PRIMARY KEY,
                course_code TEXT,
                student_name TEXT,
                teacher_name TEXT,
                location_status TEXT,
                last_updated TEXT
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS Liabilities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date_logged TEXT,
                student_name TEXT,
                teacher_name TEXT,
                course_code TEXT,
                copy_number TEXT,
                fine_amount REAL,
                outcome TEXT,
                resolved INTEGER DEFAULT 0
            )`);
        });
    }
});

// --- NEW UNIFIED EMAIL ENDPOINT WITH ATTACHMENT SUPPORT ---
app.post('/api/send-emails', (req, res) => {
    const { emailsToSend, senderEmail, senderPassword } = req.body;

    if (!senderEmail || !senderPassword) return res.status(400).json({ error: "App password missing from profile!" });

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: senderEmail, pass: senderPassword }
    });

    let promises = emailsToSend.map(mail => {
        return transporter.sendMail({
            from: senderEmail,
            to: mail.to,
            subject: mail.subject,
            // Changed from 'text' to 'html' to support the new table format
            html: mail.text,
            attachments: mail.attachments || [] // Injects images if they exist
        });
    });

    Promise.all(promises)
        .then(() => res.json({ message: "Emails sent!" }))
        .catch(error => {
            console.error("Email send error:", error);
            res.status(500).json({ error: "Failed to send some emails." })
        });
});

// --- STANDARD STUDENT API ROUTES ---
app.post('/api/add', (req, res) => {
    const { name, student_email, guardian_email, contacts_info, class_name } = req.body;
    db.run(`INSERT INTO Students (name, student_email, guardian_email, contacts_info, class_name) VALUES (?, ?, ?, ?, ?)`,
        [name, student_email, guardian_email, contacts_info, class_name], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ status: "Success" });
        });
});

app.get('/api/data/:class_name', (req, res) => {
    db.all("SELECT * FROM Students WHERE class_name = ?", [req.params.class_name], (err, rows) => res.json({ data: rows }));
});

app.put('/api/update/:id', (req, res) => {
    const { name, student_email, guardian_email, contacts_info } = req.body;
    db.run("UPDATE Students SET name = ?, student_email = ?, guardian_email = ?, contacts_info = ? WHERE id = ?",
        [name, student_email, guardian_email, contacts_info, req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ status: "Updated" });
        });
});

app.delete('/api/delete/:id', (req, res) => {
    db.run("DELETE FROM Students WHERE id = ?", [req.params.id], (err) => res.json({ status: "Deleted" }));
});

app.delete('/api/delete-class/:class_name', (req, res) => {
    db.run("DELETE FROM Students WHERE class_name = ?", [req.params.class_name], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ status: "Deleted", rowsAffected: this.changes });
    });
});

app.put('/api/rename-class', (req, res) => {
    const { oldClassName, newClassName } = req.body;
    db.run("UPDATE Students SET class_name = ? WHERE class_name = ?", [newClassName, oldClassName], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ status: "Renamed", rowsAffected: this.changes });
    });
});

app.put('/api/migrate-email', (req, res) => {
    const { oldEmail, newEmail } = req.body;
    const sql = `UPDATE Students SET class_name = ? || substr(class_name, length(?) + 1) WHERE class_name LIKE ? || '_%'`;
    db.run(sql, [newEmail, oldEmail, oldEmail], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ status: "Migrated", rows: this.changes });
    });
});


// --- NEW TEXTBOOK INVENTORY API ROUTES ---

// Courses
app.get('/api/inventory/courses', (req, res) => {
    db.all("SELECT * FROM Courses", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ courses: rows });
    });
});

app.post('/api/inventory/courses', (req, res) => {
    const { course_code, title, publisher, replacement_cost, total_quantity } = req.body;
    db.run(`INSERT INTO Courses (course_code, title, publisher, replacement_cost, total_quantity) VALUES (?, ?, ?, ?, ?)`,
        [course_code, title, publisher, replacement_cost, total_quantity], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ status: "Success" });
        });
});

app.delete('/api/inventory/courses/:course_code', (req, res) => {
    db.run("DELETE FROM Courses WHERE course_code = ?", [req.params.course_code], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        // Clean up linked copies
        db.run("DELETE FROM Copies WHERE course_code = ?", [req.params.course_code], (err2) => {
            res.json({ status: "Deleted" });
        });
    });
});

// Copies (Individual Books)
app.get('/api/inventory/copies/:course_code', (req, res) => {
    db.all("SELECT * FROM Copies WHERE course_code = ?", [req.params.course_code], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ copies: rows });
    });
});

app.post('/api/inventory/copies', (req, res) => {
    const { copy_number, course_code, student_name, teacher_name, location_status } = req.body;
    const last_updated = new Date().toISOString();
    db.run(`INSERT INTO Copies (copy_number, course_code, student_name, teacher_name, location_status, last_updated) VALUES (?, ?, ?, ?, ?, ?)`,
        [copy_number, course_code, student_name, teacher_name, location_status, last_updated], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ status: "Success" });
        });
});

app.put('/api/inventory/copies/:copy_number', (req, res) => {
    const { student_name, teacher_name, location_status } = req.body;
    const last_updated = new Date().toISOString();
    db.run("UPDATE Copies SET student_name = ?, teacher_name = ?, location_status = ?, last_updated = ? WHERE copy_number = ?",
        [student_name, teacher_name, location_status, last_updated, req.params.copy_number], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ status: "Updated" });
        });
});

app.delete('/api/inventory/copies/:copy_number', (req, res) => {
    db.run("DELETE FROM Copies WHERE copy_number = ?", [req.params.copy_number], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ status: "Deleted" });
    });
});

// Liabilities (Ledger)
app.get('/api/inventory/liabilities', (req, res) => {
    db.all("SELECT * FROM Liabilities", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ liabilities: rows });
    });
});

app.post('/api/inventory/liabilities', (req, res) => {
    const { date_logged, student_name, teacher_name, course_code, copy_number, fine_amount } = req.body;
    db.run(`INSERT INTO Liabilities (date_logged, student_name, teacher_name, course_code, copy_number, fine_amount, outcome, resolved) VALUES (?, ?, ?, ?, ?, ?, '', 0)`,
        [date_logged, student_name, teacher_name, course_code, copy_number, fine_amount], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ status: "Success" });
        });
});

app.put('/api/inventory/liabilities/:id/resolve', (req, res) => {
    db.run("UPDATE Liabilities SET resolved = 1 WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ status: "Resolved" });
    });
});

app.delete('/api/inventory/liabilities/:id', (req, res) => {
    db.run("DELETE FROM Liabilities WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ status: "Deleted" });
    });
});

app.put('/api/inventory/liabilities/:id', (req, res) => {
    const { outcome } = req.body;
    db.run("UPDATE Liabilities SET outcome = ? WHERE id = ?", [outcome, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ status: "Updated" });
    });
});


// --- SYSTEM EMAIL SETUP ---
const systemTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'owensirrichard@gmail.com',
        pass: 'eanr zmoa tdjs ypzl'
    }
});

app.post('/api/send-recovery', (req, res) => {
    const { email, code } = req.body;
    const mailOptions = {
        from: 'owensirrichard@gmail.com',
        to: email,
        subject: 'MathTrack PIN Recovery Code',
        text: `Your MathTrack 4-Digit PIN recovery code is: ${code}\n\nIf you did not request this, please ignore this email.`
    };
    systemTransporter.sendMail(mailOptions, (error) => {
        if (error) return res.status(500).json({ error: "Failed to send recovery email." });
        res.json({ message: "Recovery email sent." });
    });
});

app.listen(3000, () => console.log(`Server live at http://localhost:3000`));