const fs = require('fs');

let js = fs.readFileSync('studentScript.js', 'utf8');

// 1. toggleAddStudentForm
let toggleOld = `        document.getElementById('new-fname').value = ''; // Reset
        document.getElementById('new-lname').value = ''; // Reset
        document.getElementById('new-semail').value = ''; // Reset
        document.getElementById('new-cname').value = ''; // Reset
        document.getElementById('new-crel').value = ''; // Reset
        document.getElementById('new-cemail').value = ''; // Reset`;

let toggleNew = `        document.getElementById('new-fname').value = ''; // Reset
        document.getElementById('new-lname').value = ''; // Reset
        document.getElementById('new-semail').value = ''; // Reset
        document.getElementById('new-cname1').value = ''; // Reset
        document.getElementById('new-crel1').value = ''; // Reset
        document.getElementById('new-cemail1').value = ''; // Reset
        document.getElementById('new-cname2').value = ''; // Reset
        document.getElementById('new-crel2').value = ''; // Reset
        document.getElementById('new-cemail2').value = ''; // Reset`;

js = js.replace(toggleOld, toggleNew);

// 2. saveNewStudent
let saveOld = `    const fName = document.getElementById('new-fname').value.trim(); // Gather info
    const lName = document.getElementById('new-lname').value.trim(); // Gather info
    const sEmail = document.getElementById('new-semail').value.trim(); // Gather info
    const cName = document.getElementById('new-cname').value.trim(); // Gather info
    const cRel = document.getElementById('new-crel').value.trim(); // Gather info
    const cEmail = document.getElementById('new-cemail').value.trim(); // Gather info

    if (!fName || !lName) { // Failsafe require name
        return alert("First and Last name are required to add a student."); // Break
    } // End

    const studentName = \`\${fName} \${lName}\`; // Synthesize

    let contacts = []; // Init JSON
    let emails = []; // Init legacy

    if (cName || cEmail) { // If any data was put into contact fields
        contacts.push({ name: cName, rel: cRel, email: cEmail }); // Push JSON object
        if (cEmail) emails.push(cEmail); // Push string
    } // Check end

    try { // Network block
        await fetch('http://localhost:3000/api/add', { // Post to server
            method: 'POST', // POST verb
            headers: { 'Content-Type': 'application/json' }, // HTTP headers
            body: JSON.stringify({ // Convert to string
                name: studentName, // Field mapping
                student_email: sEmail, // Field mapping
                guardian_email: emails.join(','), // Field mapping
                contacts_info: JSON.stringify(contacts), // Field mapping
                class_name: currentClass // Assign to current class bucket
            }) // Object end
        }); // Request end

        document.getElementById('new-fname').value = ''; // Reset UI
        document.getElementById('new-lname').value = ''; // Reset UI
        document.getElementById('new-semail').value = ''; // Reset UI
        document.getElementById('new-cname').value = ''; // Reset UI
        document.getElementById('new-crel').value = ''; // Reset UI
        document.getElementById('new-cemail').value = ''; // Reset UI`;

let saveNew = `    const fName = document.getElementById('new-fname').value.trim(); // Gather info
    const lName = document.getElementById('new-lname').value.trim(); // Gather info
    const sEmail = document.getElementById('new-semail').value.trim(); // Gather info
    const cName1 = document.getElementById('new-cname1').value.trim();
    const cRel1 = document.getElementById('new-crel1').value.trim();
    const cEmail1 = document.getElementById('new-cemail1').value.trim();
    const cName2 = document.getElementById('new-cname2').value.trim();
    const cRel2 = document.getElementById('new-crel2').value.trim();
    const cEmail2 = document.getElementById('new-cemail2').value.trim();

    if (!fName || !lName) {
        return alert("First and Last name are required to add a student.");
    }

    const studentName = \`\${fName} \${lName}\`;

    let contacts = [];
    let emails = [];

    if (cName1 || cEmail1) {
        contacts.push({ name: cName1, rel: cRel1, email: cEmail1 });
        if (cEmail1) emails.push(cEmail1);
    }
    if (cName2 || cEmail2) {
        contacts.push({ name: cName2, rel: cRel2, email: cEmail2 });
        if (cEmail2) emails.push(cEmail2);
    }

    try {
        await fetch('http://localhost:3000/api/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: studentName,
                student_email: sEmail,
                guardian_email: emails.join(','),
                contacts_info: JSON.stringify(contacts),
                class_name: currentClass
            })
        });

        document.getElementById('new-fname').value = '';
        document.getElementById('new-lname').value = '';
        document.getElementById('new-semail').value = '';
        document.getElementById('new-cname1').value = '';
        document.getElementById('new-crel1').value = '';
        document.getElementById('new-cemail1').value = '';
        document.getElementById('new-cname2').value = '';
        document.getElementById('new-crel2').value = '';
        document.getElementById('new-cemail2').value = '';`;

js = js.replace(saveOld, saveNew);

// 3. Update alerts
js = js.replace(
    'alert("Error adding student. Make sure your server is running.");',
    'alert("Error adding student: " + err.message + "\\nMake sure your server is running.");'
);
js = js.replace(
    'await fetch(`http://localhost:3000/api/data/${encodeURIComponent(currentClass)}`);',
    'await fetch(`http://localhost:3000/api/data/${encodeURIComponent(currentClass)}?t=${Date.now()}`);'
);

// 4. Buttons replacement (revert_buttons.js behavior)
js = js.replace(/\.buttons([\s\-{,:])/g, '.btn$1');
js = js.replace(/class="buttons /g, 'class="btn ');
js = js.replace(/class='buttons /g, "class='btn ");
js = js.replace(/class="([^"]*)\sbuttons\s([^"]*)"/g, 'class="$1 btn $2"');
js = js.replace(/class="([^"]*)\sbuttons"/g, 'class="$1 btn"');
js = js.replace(/\sbuttons-/g, ' btn-');
js = js.replace(/"buttons-/g, '"btn-');
js = js.replace(/'buttons-/g, "'btn-");
js = js.replace(/classList\.add\('buttons'\)/g, "classList.add('btn')");
js = js.replace(/classList\.remove\('buttons'\)/g, "classList.remove('btn')");
js = js.replace(/className = 'buttons /g, "className = 'btn ");
js = js.replace(/className = 'buttons'/g, "className = 'btn'");
js = js.replace(/class="buttons"/g, 'class="btn"');
js = js.replace(/class='buttons'/g, "class='btn'");

// Save the beautifully structured file
fs.writeFileSync('studentScript.js', js, 'utf8');
console.log("Successfully restored and patched studentScript.js");
