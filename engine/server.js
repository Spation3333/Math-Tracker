const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');

// Set up the transporter at the top so it's ready to go
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'lponc1@ocdsb.ca', 
    pass: 'vrzhdgknjwydtogt' // Replace with your real app password
  }
});

const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json()); // Allows the server to read JSON from the website
// This tells Express to serve your HTML/CSS files from your folder
app.use(express.static(__dirname));
// --- DATABASE CONNECTION ---
// Using path.join ensures it finds the DB file in the same folder as this script
const dbPath = path.join(__dirname, 'world.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("Database connection error:", err.message);
    else console.log("Connected to MathTrack database.");
});

// --- ROUTES ---

// 1. GET: Fetch all student progress
app.get('/api/data', (req, res) => {
    const sql = "SELECT * FROM Students ORDER BY name ASC";
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ data: rows });
    });
});

// 2. POST: Add a new student or lesson update
app.post('/api/add', (req, res) => {
    const { name, guardian_email, lesson_name, completion_pct, is_late } = req.body;
    
    const sql = `INSERT INTO Students (name, guardian_email, lesson_name, completion_pct, is_late) 
                 VALUES (?, ?, ?, ?, ?)`;
    
    const params = [name, guardian_email, lesson_name, completion_pct, is_late];

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ 
            status: "Success", 
            id: this.lastID 
        });
    });
});

// This is the new endpoint your HTML button is talking to
app.post('/send-all', (req, res) => {
    console.log("Email request received! Fetching students...");

    // 1. Get the students from your SQLite database
    const sql = "SELECT guardian_email FROM Students WHERE guardian_email IS NOT NULL AND guardian_email != ''";
    
    db.all(sql, [], async (err, students) => {
        if (err) {
            console.error("Database error:", err.message);
            return res.status(500).send('Database error');
        }

        try {
            // 2. Loop through the list and send the email
            for (let i = 0; i < students.length; i++) {
                const studentEmail = students[i].guardian_email;

                await transporter.sendMail({
                    from: 'lponc1@ocdsb.ca',
                    to: studentEmail,
                    subject: 'Weekly Update',
                    text: 'Hello! This is your weekly update from the database.'
                });
                console.log(`Sent to: ${studentEmail}`);
            }

            console.log("All emails finished sending!");
            res.status(200).send('Success');

        } catch (error) {
            console.error("Error sending emails:", error);
            res.status(500).send('Failed');
        }
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