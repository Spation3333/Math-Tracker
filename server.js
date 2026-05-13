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
                class_name TEXT
            )`);
        });
    }
});

// --- SYSTEM EMAIL SETUP (For Password Recovery) ---
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
        if (error) {
            console.error("Recovery Email Error:", error);
            return res.status(500).json({ error: "Failed to send recovery email." });
        }
        res.json({ message: "Recovery email sent." });
    });
});

const getRecipients = (student) => {
    const list = [];
    if (student.student_email && student.student_email.trim()) list.push(student.student_email.trim());
    if (student.guardian_email && student.guardian_email.trim()) {
        const parents = student.guardian_email.split(',').map(e => e.trim()).filter(Boolean);
        list.push(...parents);
    }
    return [...new Set(list)];
};

// 1. POST: Send Individual Email (Dynamic Auth)
app.post('/send-individual/:id', (req, res) => {
    const { id } = req.params;
    const { subject, text, senderEmail, senderPassword } = req.body; 

    if (!senderEmail || !senderPassword) return res.status(400).json({error: "App password missing from profile!"});

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: senderEmail, pass: senderPassword }
    });

    db.get("SELECT * FROM Students WHERE id = ?", [id], (err, student) => {
        if (err || !student) return res.status(404).json({ error: "Student not found." });
        const recipients = getRecipients(student);
        if (recipients.length === 0) return res.status(400).json({ error: "No email addresses found." });

        const mailOptions = {
            from: senderEmail,
            to: recipients, 
            subject: subject || `MathTrack Progress Update`,
            text: text || `Hello ${student.name},\n\nThis is an update regarding your MathTrack progress.`
        };

        transporter.sendMail(mailOptions, (error) => {
            if (error) return res.status(500).json({ error: "Failed to send. Check App Password." });
            res.json({ message: "Emails sent to student and guardian!" });
        });
    });
});

// 2. POST: Send Bulk Class Emails (Dynamic Auth)
app.post('/send-all/:class_name', (req, res) => {
    const className = req.params.class_name;
    const { messages, senderEmail, senderPassword } = req.body;

    if (!senderEmail || !senderPassword) return res.status(400).json({error: "App password missing from profile!"});

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: senderEmail, pass: senderPassword }
    });

    db.all("SELECT * FROM Students WHERE class_name = ?", [className], (err, rows) => {
        if (err || rows.length === 0) return res.status(404).json({ error: "No students found." });

        rows.forEach(student => {
            const recipients = getRecipients(student);
            if (recipients.length > 0) {
                const customMsg = messages[student.id] || {};
                const mailOptions = {
                    from: senderEmail,
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
    [name, student_email, guardian_email, class_name], (err) => res.json({ status: "Success" }));
});

app.get('/api/data/:class_name', (req, res) => {
    db.all("SELECT * FROM Students WHERE class_name = ?", [req.params.class_name], (err, rows) => res.json({ data: rows }));
});

app.put('/api/update/:id', (req, res) => {
    const { name, student_email, guardian_email } = req.body;
    db.run("UPDATE Students SET name = ?, student_email = ?, guardian_email = ? WHERE id = ?", 
    [name, student_email, guardian_email, req.params.id], (err) => res.json({ status: "Updated" }));
});

app.delete('/api/delete/:id', (req, res) => {
    db.run("DELETE FROM Students WHERE id = ?", [req.params.id], (err) => res.json({ status: "Deleted" }));
});

app.delete('/api/delete-class/:class_name', (req, res) => {
    db.run("DELETE FROM Students WHERE class_name = ?", [req.params.class_name], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ status: "Deleted", rowsAffected: this.changes });
    });
});

// EMAIL MIGRATION ROUTE
app.put('/api/migrate-email', (req, res) => {
    const { oldEmail, newEmail } = req.body;
    const sql = `UPDATE Students SET class_name = ? || substr(class_name, length(?) + 1) WHERE class_name LIKE ? || '_%'`;
    db.run(sql, [newEmail, oldEmail, oldEmail], function(err) {
        if (err) return res.status(500).json({error: err.message});
        res.json({status: "Migrated", rows: this.changes});
    });
});

app.listen(3000, () => console.log(`Server live at http://localhost:3000`));