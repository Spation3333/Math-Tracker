const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');


// 1. Set up the connection using your sender email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'owensirrichard@gmail.com',
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
// Using path.join ensures it finds the DB file in the same folder as this script
const dbPath = path.join(__dirname, 'world.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("Database connection error:", err.message);
    else console.log("Connected to MathTrack database.");
});


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
        res.json({ data: rows });
    });
});


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