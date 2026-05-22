const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const cron = require('node-cron'); // <--- ADD THIS LINE

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
            text: mail.text,
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

// --- AUTOMATED WEEKLY EMAIL CRON JOB ---
// '15 14 * * 5' executes exactly at 14:15 (2:15 PM) every Friday (day 5)
cron.schedule('15 14 * * 5', () => {
    console.log('Cron Job Triggered: Fetching student roster for weekly automated emails...');

    // Queries your existing database table
    db.all("SELECT * FROM Students", [], (err, rows) => {
        if (err) {
            console.error("Error fetching students for cron email:", err.message);
            return;
        }

        if (!rows || rows.length === 0) {
            console.log("No students found in the database to email.");
            return;
        }

        // Iterate through each student to dispatch their notification
        rows.forEach((student) => {
            const recipients = [];
            
            // Gather guardian email(s) if present (splitting commas if multiple exist)
            if (student.guardian_email) {
                recipients.push(...student.guardian_email.split(','));
            }
            // Gather student email if present
            if (student.student_email) {
                recipients.push(student.student_email);
            }

            // Filter out empty strings/whitespace and remove any duplicates
            const cleanRecipients = [...new Set(recipients.filter(email => email && email.trim() !== ''))];

            if (cleanRecipients.length === 0) {
                console.log(`Skipping student ${student.name} (ID: ${student.id}) - No valid email addresses.`);
                return;
            }

            // Configure the email options utilizing your systemTransporter authentication
            const mailOptions = {
                from: '"MathTrack Portal" <owensirrichard@gmail.com>',
                to: cleanRecipients.join(', '),
                subject: `Weekly Progress Update - ${student.name}`,
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px;">
                        <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Weekly MathTrack Update</h2>
                        <p>Dear Guardian / Student,</p>
                        <p>This is an automated weekly summary report regarding <strong>${student.name}</strong> in your <strong>${student.class_name}</strong> class.</p>
                        <p>Please log in to your MathTrack Portal dashboard to view this week's updated lesson subjects, track homework completion rates, and view the latest evaluation metrics.</p>
                        <br>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="font-size: 0.8em; color: #7f8c8d; text-align: center;">This is a system-generated notification. Please do not reply directly to this email message.</p>
                    </div>
                `
            };

            // Send the email using your existing systemTransporter
            systemTransporter.sendMail(mailOptions, (mailErr, info) => {
                if (mailErr) {
                    console.error(`Failed to send automated email to ${student.name}:`, mailErr.message);
                } else {
                    console.log(`Weekly automated email successfully sent to ${student.name} (${cleanRecipients.join(', ')})`);
                }
            });
        });
    });
}, {
    scheduled: true,
    timezone: "America/New_York" // Sets execution context to Eastern Time regardless of physical hosting location
});

app.listen(3000, () => console.log(`Server live at http://localhost:3000`));