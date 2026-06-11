const express = require('express'); // Import the Express framework for creating the web server
const sqlite3 = require('sqlite3').verbose(); // Import the SQLite3 module for database operations, with verbose logging enabled
const cors = require('cors'); // Import the CORS middleware to handle Cross-Origin Resource Sharing
const path = require('path'); // Import the path module to securely construct file system paths
const nodemailer = require('nodemailer'); // Import the Nodemailer library for sending emails

const app = express(); // Initialize the Express application instance

// Increase JSON limit to 50mb to allow for base64 image uploads in emails // Comment explaining the reason for the increased payload limits
app.use(cors()); // Apply the CORS middleware globally to allow requests from different origins
app.use(express.json({ limit: '50mb' })); // Configure Express to parse incoming JSON payloads with a size limit of 50 megabytes
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Configure Express to parse URL-encoded bodies with a 50 megabyte limit
app.use(express.static(__dirname)); // Serve all static files from the current directory automatically

const dbPath = path.join(__dirname, 'world.db'); // Construct the absolute path to the local SQLite database file
const db = new sqlite3.Database(dbPath, (err) => { // Connect to the SQLite database
    if (!err) { // Check if the connection was successful without errors
        db.serialize(() => { // Force the execution of database queries in a strict sequential order
            // Original Student Tables // Comment marking the section for original student-related database tables
            db.run(`CREATE TABLE IF NOT EXISTS Students ( // Execute a query to create the Students table if it doesn't already exist
                id INTEGER PRIMARY KEY AUTOINCREMENT, // Define the 'id' column as an auto-incrementing primary key
                name TEXT, // Define the 'name' column as a text field
                student_email TEXT, // Define the 'student_email' column as a text field
                guardian_email TEXT, // Define the 'guardian_email' column as a text field
                contacts_info TEXT, // Define the 'contacts_info' column to store JSON-formatted contact objects
                class_name TEXT // Define the 'class_name' column to associate the student with a specific class group
            )`); // End of the Students table creation query
            db.run("ALTER TABLE Students ADD COLUMN contacts_info TEXT", (err) => { }); // Attempt to add the contacts_info column just in case an older version of the table exists; ignore errors if it already does

            // New Textbook Inventory Tables // Comment marking the section for the new textbook inventory system tables
            db.run(`CREATE TABLE IF NOT EXISTS Courses ( // Execute a query to create the Courses table for textbook tracking
                course_code TEXT PRIMARY KEY, // Define 'course_code' as the unique text-based primary key
                title TEXT, // Define the 'title' column for the textbook name
                publisher TEXT, // Define the 'publisher' column for the publisher's name
                replacement_cost REAL, // Define 'replacement_cost' as a floating-point number for fines
                total_quantity INTEGER // Define 'total_quantity' to track how many copies exist
            )`); // End of the Courses table creation query

            db.run(`CREATE TABLE IF NOT EXISTS Copies ( // Execute a query to create the Copies table tracking individual books
                copy_number TEXT PRIMARY KEY, // Define 'copy_number' as the unique barcode/ID for this specific book
                course_code TEXT, // Define 'course_code' to link this copy back to its parent course
                student_name TEXT, // Define 'student_name' to track who currently holds the book
                teacher_name TEXT, // Define 'teacher_name' to track which teacher issued it
                location_status TEXT, // Define 'location_status' (e.g., Checked Out, Lost, Available)
                last_updated TEXT // Define 'last_updated' as a timestamp of the last scan
            )`); // End of the Copies table creation query

            db.run(`CREATE TABLE IF NOT EXISTS Liabilities ( // Execute a query to create the Liabilities ledger for tracking fines
                id INTEGER PRIMARY KEY AUTOINCREMENT, // Define the liability ID as an auto-incrementing primary key
                date_logged TEXT, // Define 'date_logged' to store the timestamp the fine was issued
                student_name TEXT, // Define 'student_name' to know who owes the fine
                teacher_name TEXT, // Define 'teacher_name' to know who issued the fine
                course_code TEXT, // Define the linked 'course_code'
                copy_number TEXT, // Define the linked 'copy_number'
                fine_amount REAL, // Define the monetary 'fine_amount'
                outcome TEXT, // Define 'outcome' to store notes on how it was resolved
                resolved INTEGER DEFAULT 0 // Define 'resolved' as a boolean flag (0=No, 1=Yes)
            )`); // End of the Liabilities table creation query
        }); // End of serialized database initialization
    } // End of error check
}); // End of database connection block

// --- NEW UNIFIED EMAIL ENDPOINT WITH ATTACHMENT SUPPORT --- // Section header comment
app.post('/api/send-emails', (req, res) => { // Define a POST endpoint for sending batched emails to students/guardians
    const { emailsToSend, senderEmail, senderPassword } = req.body; // Destructure the required payload parameters from the incoming request body

    if (!senderEmail || !senderPassword) return res.status(400).json({ error: "App password missing from profile!" }); // Reject the request if the user hasn't provided their email or app password

    const transporter = nodemailer.createTransport({ // Create a dynamic Nodemailer transport object
        service: 'gmail', // Specify Gmail as the email service provider
        auth: { user: senderEmail, pass: senderPassword } // Authenticate using the user's provided email and app password
    }); // End of transport configuration

    let promises = emailsToSend.map(mail => { // Loop through the array of emails to send and map them to an array of promises
        return transporter.sendMail({ // Call sendMail on the transport for each individual recipient
            from: senderEmail, // Set the sender address
            to: mail.to, // Set the recipient address
            subject: mail.subject, // Set the email subject line
            // Changed from 'text' to 'html' to support the new table format // Inline comment explaining the use of the html property
            html: mail.text, // Set the email body using HTML formatting
            attachments: mail.attachments || [] // Injects images if they exist // Attach any provided files, or default to an empty array
        }); // End of sendMail call
    }); // End of promise mapping

    Promise.all(promises) // Wait for all email sending promises to either resolve or reject
        .then(() => res.json({ message: "Emails sent!" })) // If all succeed, respond with a success message
        .catch(error => { // Catch any errors that occur during the batch send process
            console.error("Email send error:", error); // Log the specific email error to the server console
            res.status(500).json({ error: "Failed to send some emails." }) // Respond to the client with a 500 Internal Server Error status
        }); // End of promise block
}); // End of send-emails endpoint

// --- STANDARD STUDENT API ROUTES --- // Section header comment
app.post('/api/add', (req, res) => { // Define a POST endpoint for adding a new student to the database
    const { name, student_email, guardian_email, contacts_info, class_name } = req.body; // Extract student details from the request body
    db.run(`INSERT INTO Students (name, student_email, guardian_email, contacts_info, class_name) VALUES (?, ?, ?, ?, ?)`, // Execute an INSERT query parameterized to prevent SQL injection
        [name, student_email, guardian_email, contacts_info, class_name], (err) => { // Provide the array of values mapping to the query placeholders
            if (err) return res.status(500).json({ error: err.message }); // If the database throws an error, return a 500 status with the error message
            res.json({ status: "Success" }); // If successful, respond with a simple success JSON object
        }); // End of database insert
}); // End of add student endpoint

app.get('/api/data/:class_name', (req, res) => { // Define a GET endpoint to fetch all students for a specific class
    db.all("SELECT * FROM Students WHERE class_name = ?", [req.params.class_name], (err, rows) => res.json({ data: rows })); // Query the database for matches and respond with the resulting rows as JSON
}); // End of fetch data endpoint

app.put('/api/update/:id', (req, res) => { // Define a PUT endpoint to update an existing student's information by their ID
    const { name, student_email, guardian_email, contacts_info } = req.body; // Extract the updated fields from the request body
    db.run("UPDATE Students SET name = ?, student_email = ?, guardian_email = ?, contacts_info = ? WHERE id = ?", // Execute an UPDATE query filtering by the specific student ID
        [name, student_email, guardian_email, contacts_info, req.params.id], (err) => { // Bind the updated values and the ID parameter from the URL route
            if (err) return res.status(500).json({ error: err.message }); // Return an error response if the database update fails
            res.json({ status: "Updated" }); // Respond with success status upon completion
        }); // End of database update
}); // End of update student endpoint

app.delete('/api/delete/:id', (req, res) => { // Define a DELETE endpoint to remove a specific student by ID
    db.run("DELETE FROM Students WHERE id = ?", [req.params.id], (err) => res.json({ status: "Deleted" })); // Execute the DELETE query and respond upon completion
}); // End of delete student endpoint

app.delete('/api/delete-class/:class_name', (req, res) => { // Define a DELETE endpoint to drop an entire class roster
    db.run("DELETE FROM Students WHERE class_name = ?", [req.params.class_name], function (err) { // Execute the DELETE query targeting all students with the specified class name
        if (err) return res.status(500).json({ error: err.message }); // Check for errors and return them to the client
        res.json({ status: "Deleted", rowsAffected: this.changes }); // Respond with success and the number of database rows that were removed
    }); // End of delete query
}); // End of delete class endpoint

app.put('/api/rename-class', (req, res) => { // Define a PUT endpoint to rename a class globally
    const { oldClassName, newClassName } = req.body; // Destructure the old and new class names from the payload
    db.run("UPDATE Students SET class_name = ? WHERE class_name = ?", [newClassName, oldClassName], function (err) { // Update the class_name property for all matching rows
        if (err) return res.status(500).json({ error: err.message }); // Catch and report any database errors
        res.json({ status: "Renamed", rowsAffected: this.changes }); // Return success along with the count of updated records
    }); // End of database update
}); // End of rename class endpoint

app.put('/api/migrate-email', (req, res) => { // Define a PUT endpoint to migrate classes when a teacher changes their account email address
    const { oldEmail, newEmail } = req.body; // Extract the old and new teacher emails
    const sql = `UPDATE Students SET class_name = ? || substr(class_name, length(?) + 1) WHERE class_name LIKE ? || '_%'`; // Construct an SQL string manipulation query to replace the email prefix on all linked classes
    db.run(sql, [newEmail, oldEmail, oldEmail], function (err) { // Execute the string replacement query, binding the old and new strings securely
        if (err) return res.status(500).json({ error: err.message }); // Handle any execution errors
        res.json({ status: "Migrated", rows: this.changes }); // Return a success response indicating the migration was finished
    }); // End of query
}); // End of email migration endpoint


// --- NEW TEXTBOOK INVENTORY API ROUTES --- // Section header comment

// Courses // Sub-header comment
app.get('/api/inventory/courses', (req, res) => { // Define a GET endpoint to retrieve the list of textbook courses
    db.all("SELECT * FROM Courses", [], (err, rows) => { // Select all rows from the Courses table
        if (err) return res.status(500).json({ error: err.message }); // Check for and handle errors
        res.json({ courses: rows }); // Return the retrieved course catalog to the client
    }); // End of database query
}); // End of GET courses endpoint

app.post('/api/inventory/courses', (req, res) => { // Define a POST endpoint to add a new course/textbook
    const { course_code, title, publisher, replacement_cost, total_quantity } = req.body; // Extract textbook properties from payload
    db.run(`INSERT INTO Courses (course_code, title, publisher, replacement_cost, total_quantity) VALUES (?, ?, ?, ?, ?)`, // Insert the new course into the database
        [course_code, title, publisher, replacement_cost, total_quantity], function (err) { // Bind the values securely
            if (err) return res.status(500).json({ error: err.message }); // Handle insertion errors
            res.json({ status: "Success" }); // Report success
        }); // End of insertion query
}); // End of POST courses endpoint

app.delete('/api/inventory/courses/:course_code', (req, res) => { // Define a DELETE endpoint to remove a course by its code
    db.run("DELETE FROM Courses WHERE course_code = ?", [req.params.course_code], (err) => { // Execute a query to delete the target course record
        if (err) return res.status(500).json({ error: err.message }); // Stop execution and report an error if deletion fails
        // Clean up linked copies // Inline comment indicating cascading deletion
        db.run("DELETE FROM Copies WHERE course_code = ?", [req.params.course_code], (err2) => { // Execute a secondary query to delete all physical copies linked to the removed course
            res.json({ status: "Deleted" }); // Return success after cascading deletes finish
        }); // End of cascading copy deletion
    }); // End of course deletion
}); // End of DELETE courses endpoint

// Copies (Individual Books) // Sub-header comment
app.get('/api/inventory/copies/:course_code', (req, res) => { // Define a GET endpoint to fetch all physical copies for a specific course
    db.all("SELECT * FROM Copies WHERE course_code = ?", [req.params.course_code], (err, rows) => { // Query the Copies table filtering by the provided course code
        if (err) return res.status(500).json({ error: err.message }); // Return errors if the query fails
        res.json({ copies: rows }); // Send the array of physical copies back to the client
    }); // End of database query
}); // End of GET copies endpoint

app.post('/api/inventory/copies', (req, res) => { // Define a POST endpoint to register a new physical book copy
    const { copy_number, course_code, student_name, teacher_name, location_status } = req.body; // Destructure the physical copy metadata
    const last_updated = new Date().toISOString(); // Generate a standard ISO timestamp for the current moment
    db.run(`INSERT INTO Copies (copy_number, course_code, student_name, teacher_name, location_status, last_updated) VALUES (?, ?, ?, ?, ?, ?)`, // Insert the new copy record into the database
        [copy_number, course_code, student_name, teacher_name, location_status, last_updated], function (err) { // Bind all metadata along with the generated timestamp
            if (err) return res.status(500).json({ error: err.message }); // Reject on failure
            res.json({ status: "Success" }); // Acknowledge success
        }); // End of insertion
}); // End of POST copies endpoint

app.put('/api/inventory/copies/:copy_number', (req, res) => { // Define a PUT endpoint to update the status/location of a specific book
    const { student_name, teacher_name, location_status } = req.body; // Extract the new assignment and status fields
    const last_updated = new Date().toISOString(); // Generate a fresh timestamp to record when the status was changed
    db.run("UPDATE Copies SET student_name = ?, teacher_name = ?, location_status = ?, last_updated = ? WHERE copy_number = ?", // Execute an update query targeting the specific barcode/copy number
        [student_name, teacher_name, location_status, last_updated, req.params.copy_number], (err) => { // Apply the updated assignments and timestamp
            if (err) return res.status(500).json({ error: err.message }); // Handle errors gracefully
            res.json({ status: "Updated" }); // Confirm the update was successful
        }); // End of update
}); // End of PUT copies endpoint

app.delete('/api/inventory/copies/:copy_number', (req, res) => { // Define a DELETE endpoint to remove a specific book from the system
    db.run("DELETE FROM Copies WHERE copy_number = ?", [req.params.copy_number], (err) => { // Execute a query deleting the specific copy number
        if (err) return res.status(500).json({ error: err.message }); // Reject if a database error occurs
        res.json({ status: "Deleted" }); // Resolve successfully
    }); // End of deletion query
}); // End of DELETE copies endpoint

// Liabilities (Ledger) // Sub-header comment
app.get('/api/inventory/liabilities', (req, res) => { // Define a GET endpoint to pull the entire fine/liability ledger
    db.all("SELECT * FROM Liabilities", [], (err, rows) => { // Query every row inside the Liabilities table
        if (err) return res.status(500).json({ error: err.message }); // Check for SQL errors
        res.json({ liabilities: rows }); // Respond with the ledger payload
    }); // End of database fetch
}); // End of GET liabilities endpoint

app.post('/api/inventory/liabilities', (req, res) => { // Define a POST endpoint to register a new fine/liability
    const { date_logged, student_name, teacher_name, course_code, copy_number, fine_amount } = req.body; // Extract the fine details from the incoming request body
    db.run(`INSERT INTO Liabilities (date_logged, student_name, teacher_name, course_code, copy_number, fine_amount, outcome, resolved) VALUES (?, ?, ?, ?, ?, ?, '', 0)`, // Insert the fine into the table, initializing outcome as empty and resolved as 0 (false)
        [date_logged, student_name, teacher_name, course_code, copy_number, fine_amount], function (err) { // Bind the incoming values safely to the query
            if (err) return res.status(500).json({ error: err.message }); // Handle insertion errors
            res.json({ status: "Success" }); // Send success confirmation
        }); // End of insert query
}); // End of POST liabilities endpoint

app.put('/api/inventory/liabilities/:id/resolve', (req, res) => { // Define a PUT endpoint to mark a specific liability as resolved
    db.run("UPDATE Liabilities SET resolved = 1 WHERE id = ?", [req.params.id], (err) => { // Update the 'resolved' boolean flag to 1 for the matching liability ID
        if (err) return res.status(500).json({ error: err.message }); // Return errors if the update fails
        res.json({ status: "Resolved" }); // Output a resolved status
    }); // End of update query
}); // End of PUT liabilities resolve endpoint

app.delete('/api/inventory/liabilities/:id', (req, res) => { // Define a DELETE endpoint to remove a fine entirely from the ledger
    db.run("DELETE FROM Liabilities WHERE id = ?", [req.params.id], (err) => { // Target the record by ID and delete it
        if (err) return res.status(500).json({ error: err.message }); // Watch for SQL errors
        res.json({ status: "Deleted" }); // Return success text
    }); // End of delete execution
}); // End of DELETE liabilities endpoint

app.put('/api/inventory/liabilities/:id', (req, res) => { // Define a PUT endpoint to update the textual outcome/notes of a fine
    const { outcome } = req.body; // Extract the updated outcome text block
    db.run("UPDATE Liabilities SET outcome = ? WHERE id = ?", [outcome, req.params.id], (err) => { // Write the new outcome text to the targeted liability ID
        if (err) return res.status(500).json({ error: err.message }); // Guard against SQL errors
        res.json({ status: "Updated" }); // Respond affirmatively
    }); // End of database logic
}); // End of PUT liabilities endpoint


// --- SYSTEM EMAIL SETUP --- // Section header comment
const systemTransporter = nodemailer.createTransport({ // Initialize a fixed, hard-coded Nodemailer transport for the master system account
    service: 'gmail', // Set the email service provider to Gmail
    auth: { // Provide hard-coded credentials block
        user: 'owensirrichard@gmail.com', // Define the master sending email address
        pass: 'eanr zmoa tdjs ypzl' // Define the master app password allowing server-side dispatch
    } // Close auth block
}); // End of transporter definition

app.post('/api/send-recovery', (req, res) => { // Define a POST endpoint triggered during the password recovery process
    const { email, code } = req.body; // Pull the target user's email and the generated PIN code from the payload
    const mailOptions = { // Construct the configuration block for the outgoing email
        from: 'owensirrichard@gmail.com', // Force the 'from' address to match the master system account
        to: email, // Set the destination to the user requesting the recovery
        subject: 'MathTrack PIN Recovery Code', // Apply a clear, identifying subject line
        text: `Your MathTrack 4-Digit PIN recovery code is: ${code}\n\nIf you did not request this, please ignore this email.` // Generate the plain text body injecting the secret PIN code
    }; // Close options block
    systemTransporter.sendMail(mailOptions, (error) => { // Fire the sendMail function via the master system transport
        if (error) return res.status(500).json({ error: "Failed to send recovery email." }); // Verify no networking or auth errors stopped the dispatch
        res.json({ message: "Recovery email sent." }); // If all is well, inform the client to proceed to the next step
    }); // End of dispatch function
}); // End of send-recovery endpoint

app.listen(3000, () => console.log(`Server live at http://localhost:3000`)); // Start the Express web server listening on port 3000 and log a confirmation line