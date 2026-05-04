const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');


// Tell it where the DB and SQL files are
const dbPath = path.join(__dirname, 'world.db');
const sqlPath = path.join(__dirname, 'world.sql');


// Connect to the database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) return console.error("Could not connect:", err.message);
});


// Read your world.sql file
const sql = fs.readFileSync(sqlPath, 'utf8');


// Execute the SQL commands
db.exec(sql, (err) => {
    if (err) {
        console.error("Error creating database:", err.message);
    } else {
        console.log("✅ Database initialized successfully! The class_name column is ready.");
    }
    db.close(); // Close it up when done
});