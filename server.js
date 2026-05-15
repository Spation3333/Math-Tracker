const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();

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
                contacts_info TEXT,
                class_name TEXT
            )`);
            db.run("ALTER TABLE Students ADD COLUMN contacts_info TEXT", (err) => { });
        });
    }
});

// --- NEW UNIFIED EMAIL ENDPOINT ---
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
            text: mail.text
        });
    });

    Promise.all(promises)
        .then(() => res.json({ message: "Emails sent!" }))
        .catch(error => {
            console.error("Email send error:", error);
            res.status(500).json({ error: "Failed to send some emails." })
        });
});

// --- STANDARD API ROUTES ---
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

// NEW: RENAME CLASS ROUTE
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