const currentUser = JSON.parse(localStorage.getItem('currentUser')); // Fetch the currently active user session from local storage and parse it as a JSON object
if (!currentUser) window.location.href = 'index.html'; // If no active user session exists, redirect the browser to the main login index page

const storageKey = `savedClasses_${currentUser.email}`; // Construct a unique local storage key bound to the current user's email to isolate their class data

// Enforce the rigid 8-slot array structure immediately on load // Comment explaining the purpose of the array structure enforcement
let rawClassData = JSON.parse(localStorage.getItem(storageKey)); // Attempt to fetch and parse the saved classes array from local storage
if (!Array.isArray(rawClassData) || rawClassData.length !== 8) { // Check if the fetched data is missing, not an array, or not exactly 8 elements long
    let fixedArray = new Array(8).fill(null); // Create a new array with exactly 8 slots, all initialized to null
    if (Array.isArray(rawClassData)) { // Check if the fetched data was at least a valid array (just the wrong size)
        for (let i = 0; i < rawClassData.length && i < 8; i++) { // Loop through the existing array, up to a maximum of 8 elements
            fixedArray[i] = rawClassData[i]; // Copy the valid existing class objects into the newly sized array
        } // End of loop
    } // End of valid array check
    localStorage.setItem(storageKey, JSON.stringify(fixedArray)); // Save the corrected 8-slot array back into local storage to enforce the structure
    rawClassData = fixedArray; // Reassign the working variable to the corrected array
} // End of array validation block
let classData = rawClassData; // Alias the raw data to a more friendly variable name for general use

let currentClass = "Unknown Class"; // Initialize the current active class tracking variable with a fallback default string

let unitsData = []; // Initialize an empty array to track the selected weeks/units
let activeUnitIndex = 0; // Set the default active unit index pointer to 0 (the first week)

let classLessonsData = {}; // Initialize an empty object to store lesson titles keyed by unit index
let classMarksData = {}; // Initialize an empty object to store student grades/marks keyed by student ID and unit index
let studentsData = []; // Initialize an empty array to hold the list of student objects loaded from the database

// Refined default formatting matching your exact requested layout // Comment explaining the default email template
const DEFAULT_EMAIL_TEMPLATE = `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.4; color: #333;">
Hello [RecipientName],<br><br>
Here is [StudentName]'s progress for the week of [Week]:<br><br>
[Grades]<br><br>
[TeacherNotes]<br><br>
Best Regards,<br>
[TeacherName]
</div>`; // Define the standard HTML scaffolding for outgoing progress reports

// --- DATE UTILITY --- // Section header comment
function getSafeMonday(dateString) { // Define a helper function to reliably calculate the Monday of a given week string
    if (!dateString || dateString.startsWith("Unit")) { // If the string is missing or uses the legacy "Unit X" format
        dateString = new Date().toISOString().split('T')[0]; // Override it with today's date formatted as YYYY-MM-DD
    } // End of legacy check
    let parts = dateString.split('-'); // Split the date string into an array of [Year, Month, Day]
    if (parts.length === 3) { // Ensure the split resulted in exactly 3 parts
        let d = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0); // Construct a new Date object using local time noon to avoid timezone shift bugs
        let day = d.getDay(); // Determine the current day of the week (0-6, where 0 is Sunday)
        let diff = d.getDate() - day + (day === 0 ? -6 : 1); // Calculate the numerical offset needed to shift back to the most recent Monday
        d.setDate(diff); // Apply the offset to the Date object to lock it to Monday
        return d; // Return the adjusted Date object
    } // End of parts validation
    return new Date(); // If parsing fails entirely, return today's date as a fallback
} // End of getSafeMonday function

function attachEyeToggles() { // Define a helper function to add show/hide password logic to the profile modal
    const toggleApp = document.getElementById('toggleProfApp'); // Get the DOM element for the App Password eye icon
    const togglePin = document.getElementById('toggleProfPin'); // Get the DOM element for the PIN eye icon
    if (toggleApp) { // If the App Password toggle exists
        toggleApp.addEventListener('click', function () { // Add a click event listener
            const input = document.getElementById('prof-apppass'); // Locate the corresponding input field
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password'; // Toggle the type between password and text
            input.setAttribute('type', type); // Apply the new type to the input
            this.textContent = type === 'password' ? '👁️' : '🔒'; // Update the toggle icon to reflect the new state
        }); // End of App Password event listener
    } // End of App Password toggle check
    if (togglePin) { // If the PIN toggle exists
        togglePin.addEventListener('click', function () { // Add a click event listener
            const input = document.getElementById('prof-pin'); // Locate the corresponding input field
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password'; // Toggle the type between password and text
            input.setAttribute('type', type); // Apply the new type to the input
            this.textContent = type === 'password' ? '👁️' : '🔒'; // Update the toggle icon to reflect the new state
        }); // End of PIN event listener
    } // End of PIN toggle check
} // End of attachEyeToggles function

window.onload = () => { // Attach a listener to execute code once the DOM has fully loaded
    document.getElementById('currentdate').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); // Set the top-left date display widget to today's date formatted elegantly

    const themeToggle = document.getElementById('theme-toggle'); // Locate the dark mode switch in the DOM
    if (localStorage.getItem('theme') === 'dark') { document.body.classList.add('darkmode'); themeToggle.checked = true; } // If dark mode was previously selected, apply the class and check the switch
    themeToggle.addEventListener('change', function () { // Add an event listener to the dark mode toggle
        document.body.classList.toggle('darkmode', this.checked); // Add or remove the 'darkmode' class based on the switch state
        localStorage.setItem('theme', this.checked ? 'dark' : 'light'); // Save the user's preference back to local storage
    }); // End of dark mode listener

    const urlParams = new URLSearchParams(window.location.search); // Parse the current URL query parameters to check what class is loaded
    if (urlParams.get('class')) currentClass = urlParams.get('class'); // If a class query parameter exists, update the active class tracker

    const classInput = document.getElementById('current-class-input'); // Locate the editable text input displaying the class name at the top
    classInput.value = currentClass.replace(currentUser.email + "_", ""); // Strip the user email prefix and set the input's visual value

    classInput.addEventListener('change', async function () { // Add an event listener triggering when the user renames the class
        const newRawName = this.value.trim(); // Retrieve and trim the new class name typed by the user
        const oldRawName = currentClass.replace(currentUser.email + "_", ""); // Calculate the previous raw class name

        if (!newRawName || newRawName === oldRawName) { // If the new name is blank or unchanged
            this.value = oldRawName; // Revert the input to the old name visually
            return; // Exit the function to prevent unnecessary processing
        } // End of blank check

        const newDbName = currentUser.email + "_" + newRawName; // Construct the new full unique identifier string using the email prefix

        const classIndex = classData.findIndex(c => c !== null && c.name === oldRawName); // Find the index of the old class name in the global 8-slot array
        if (classIndex !== -1) { // If the class was found in the array
            classData[classIndex].name = newRawName; // Update the class object's internal name property
            localStorage.setItem(storageKey, JSON.stringify(classData)); // Save the updated 8-slot array to local storage
        } // End of array update block

        const keysToMigrate = ['lessons', 'marks', 'units']; // Define an array of local storage prefixes linked to the class
        keysToMigrate.forEach(prefix => { // Loop through each prefix category
            const oldStr = localStorage.getItem(`${prefix}_${currentClass}`); // Fetch the data string stored under the old name
            if (oldStr) { // If data existed for this prefix
                localStorage.setItem(`${prefix}_${newDbName}`, oldStr); // Re-save the identical string data under the new class name key
                localStorage.removeItem(`${prefix}_${currentClass}`); // Delete the old key to free up storage space and prevent duplicates
            } // End of data check
        }); // End of migration loop

        try { // Try block to handle asynchronous database network calls
            await fetch('http://localhost:3000/api/rename-class', { // Send a PUT request to the backend server to rename the class globally in SQLite
                method: 'PUT', // Define HTTP method
                headers: { 'Content-Type': 'application/json' }, // Define headers declaring JSON payload
                body: JSON.stringify({ oldClassName: currentClass, newClassName: newDbName }) // Transmit the old and new full identifiers
            }); // End of fetch call
        } catch (e) { // Catch block for network errors
            console.error("DB Rename error", e); // Log the failure without interrupting the client-side experience
        } // End of try/catch

        currentClass = newDbName; // Update the active class tracker memory pointer
        const url = new URL(window.location); // Create a URL object from the current window location
        url.searchParams.set('class', newDbName); // Update the query parameter natively to reflect the new class name
        window.history.pushState({}, '', url); // Push the updated URL to the browser history bar seamlessly

        renderClassNav(); // Redraw the top navigation bar to display the new class name
    }); // End of class rename listener

    const evalInput = document.getElementById('next-eval-input'); // Locate the 'Next Eval' date input widget
    if (evalInput) { // If the input exists on the page
        const currentClassObj = classData.find(c => c !== null && `${currentUser.email}_${c.name}` === currentClass); // Find the active class object
        if (currentClassObj && currentClassObj.eval) { // If the object exists and has an evaluation date set
            evalInput.value = currentClassObj.eval; // Apply the stored date to the input visually
        } // End of eval date check
        evalInput.addEventListener('change', function () { // Attach a listener when the evaluation date is changed
            const classIndex = classData.findIndex(c => c !== null && `${currentUser.email}_${c.name}` === currentClass); // Find the active class's index
            if (classIndex !== -1) { // If found
                classData[classIndex].eval = this.value.trim(); // Update the memory object with the newly selected date
                localStorage.setItem(storageKey, JSON.stringify(classData)); // Persist the updated array to local storage
                renderRosterTable(); // Redraw the roster table to visually highlight the new evaluation column if applicable
            } // End of index check
        }); // End of evaluation date listener
    } // End of eval input check

    classLessonsData = JSON.parse(localStorage.getItem(`lessons_${currentClass}`)) || {}; // Load lesson titles for this class from local storage
    classMarksData = JSON.parse(localStorage.getItem(`marks_${currentClass}`)) || {}; // Load student marks for this class from local storage

    renderProfileBox(); // Update the profile widget with the user's name
    attachEyeToggles(); // Attach show/hide logic to the profile modal inputs
    renderClassNav(); // Draw the 8 class buttons at the top of the screen
    initUnits(); // Initialize the weekly tabs
    loadStudentsData(); // Fetch the student roster from the server
}; // End of window.onload function

// --- PROFILE LOGIC --- // Section header comment
function renderProfileBox() { // Define function to update the top-right profile widget text
    if (document.getElementById('profile-name')) { // Verify the element exists
        document.getElementById('profile-name').textContent = `${currentUser.firstName} ${currentUser.lastName}`; // Inject the active user's full name
        document.getElementById('profile-email').textContent = currentUser.email; // Inject the active user's email address
    } // End of element check
} // End of renderProfileBox

function openProfileModal() { // Define function to open and populate the profile editing modal
    document.getElementById('prof-fname').value = currentUser.firstName; // Set the First Name input to the user's current memory state
    document.getElementById('prof-lname').value = currentUser.lastName; // Set the Last Name input to the user's current memory state
    document.getElementById('prof-email').value = currentUser.email; // Set the Email input to the user's current memory state
    document.getElementById('prof-apppass').value = currentUser.appPassword || ''; // Set the App Password input, falling back to blank if missing
    document.getElementById('prof-pin').value = ''; // Blank out the PIN authorization input for security

    document.getElementById('prof-apppass').setAttribute('type', 'password'); // Reset App Password visibility back to hidden
    document.getElementById('prof-pin').setAttribute('type', 'password'); // Reset PIN visibility back to hidden
    if (document.getElementById('toggleProfApp')) document.getElementById('toggleProfApp').textContent = '👁️'; // Reset App Password icon
    if (document.getElementById('toggleProfPin')) document.getElementById('toggleProfPin').textContent = '👁️'; // Reset PIN icon

    document.getElementById('profile-modal').style.display = 'flex'; // Make the modal container visible
} // End of openProfileModal

function closeProfileModal() { // Define function to hide the profile modal
    document.getElementById('profile-modal').style.display = 'none'; // Set the display style to none, hiding the modal
} // End of closeProfileModal

async function saveProfile() { // Define an asynchronous function to handle profile updates
    const pin = document.getElementById('prof-pin').value; // Retrieve the PIN typed by the user
    if (pin !== currentUser.pin) return alert("Incorrect PIN! Cannot save changes."); // Verify the typed PIN matches the active session PIN

    const newFname = document.getElementById('prof-fname').value.trim(); // Retrieve and trim the updated first name
    const newLname = document.getElementById('prof-lname').value.trim(); // Retrieve and trim the updated last name
    const newEmail = document.getElementById('prof-email').value.trim().toLowerCase(); // Retrieve, trim, and lowercase the updated email
    const newAppPass = document.getElementById('prof-apppass').value.trim(); // Retrieve and trim the updated app password

    if (!newFname || !newLname || !newEmail || !newAppPass) return alert("All fields are required."); // Reject the update if any critical fields were cleared

    const users = JSON.parse(localStorage.getItem('mathTrackUsers')) || {}; // Fetch the global users database from local storage

    if (newEmail !== currentUser.email && users[newEmail]) return alert("Email already in use!"); // Prevent claiming an email that belongs to another offline account

    const oldEmail = currentUser.email; // Cache the current email to use as a search/replace target

    if (newEmail !== oldEmail) { // If the user has changed their primary email address
        try { // Open a try block to handle database mutation safely
            await fetch('http://localhost:3000/api/migrate-email', { // Issue a PUT request to the migration endpoint
                method: 'PUT', // Specify HTTP PUT verb
                headers: { 'Content-Type': 'application/json' }, // Define headers
                body: JSON.stringify({ oldEmail, newEmail }) // Send the old and new emails to execute the string replacement
            }); // End of fetch call
        } catch (e) { console.error("DB Migration Error", e); } // Silently log errors to the console

        const keysToMigrate = []; // Initialize an array to track local storage keys that need updating
        for (let i = 0; i < localStorage.length; i++) { // Loop through all keys currently in local storage
            const key = localStorage.key(i); // Retrieve the key name at index i
            if (key && key.includes(oldEmail)) keysToMigrate.push(key); // If the key contains the old email string, flag it for migration
        } // End of key extraction loop
        keysToMigrate.forEach(key => { // Iterate over all flagged keys
            const newKey = key.replace(oldEmail, newEmail); // Calculate what the new key name should be by replacing the email prefix
            localStorage.setItem(newKey, localStorage.getItem(key)); // Save the existing data blob under the new key name
            localStorage.removeItem(key); // Delete the old key to free memory and prevent orphaned data
        }); // End of migration loop
    } // End of email change check

    delete users[oldEmail]; // Remove the old user footprint from the local database dictionary
    const updatedUser = { firstName: newFname, lastName: newLname, email: newEmail, appPassword: newAppPass, pin: currentUser.pin }; // Reconstruct the clean, updated user object
    users[newEmail] = updatedUser; // Map the new user object into the dictionary under the new email address

    localStorage.setItem('mathTrackUsers', JSON.stringify(users)); // Persist the global user database
    localStorage.setItem('currentUser', JSON.stringify(updatedUser)); // Update the active session token

    alert("Profile updated successfully!"); // Affirm to the user the process succeeded

    const currentClassName = currentClass.replace(oldEmail + "_", ""); // Strip the old prefix from the active class view
    window.location.href = `studentList.html?class=${encodeURIComponent(newEmail + "_" + currentClassName)}`; // Forcibly reload the page simulating the new email prefix to purge stale state
} // End of saveProfile

async function deleteAccount() { // Define async function allowing the user to wipe their entire account presence
    const pin = document.getElementById('prof-pin').value; // Prompt the user to prove authorization via PIN
    if (!pin) return alert("Please enter your PIN to authorize account deletion."); // Reject if blank
    if (pin !== currentUser.pin) return alert("Incorrect PIN! Cannot delete account."); // Reject if the PIN is wrong

    if (confirm("WARNING: Are you absolutely sure you want to delete your account? This will permanently erase all your classes, students, and grades. This action CANNOT be undone.")) { // Enforce a dramatic double-check confirm box

        const email = currentUser.email; // Capture the active user email
        const users = JSON.parse(localStorage.getItem('mathTrackUsers')) || {}; // Fetch the global users table
        const storageKey = `savedClasses_${email}`; // Determine the active classes key
        const archiveKey = `archivedClasses_${email}`; // Determine the archived classes key

        const userClasses = JSON.parse(localStorage.getItem(storageKey)) || []; // Fetch the array of active classes
        const archivedClasses = JSON.parse(localStorage.getItem(archiveKey)) || []; // Fetch the array of archived classes

        const allClasses = [...userClasses, ...archivedClasses].filter(c => c !== null); // Merge them into a single array and strip out any null placeholders

        for (let i = 0; i < allClasses.length; i++) { // Loop sequentially through every known class associated with this account
            const uniqueDbClassName = email + "_" + allClasses[i].name; // Reconstruct the full unique database class identifier string
            try { // Execute deletion inside a try-catch for network safety
                await fetch(`http://localhost:3000/api/delete-class/${encodeURIComponent(uniqueDbClassName)}`, { method: 'DELETE' }); // Tell the server to completely purge the SQLite database of students attached to this specific class
            } catch (e) { // Catch block
                console.error("Error deleting class from database:", e); // Log failure to console
            } // End of catch
        } // End of class deletion loop

        const keysToDelete = []; // Array to catalog storage keys slated for destruction
        for (let i = 0; i < localStorage.length; i++) { // Loop through all local storage keys
            const key = localStorage.key(i); // Read the key
            if (key && key.includes(email)) { // Check if the key contains the user's email prefix anywhere
                keysToDelete.push(key); // Flag for deletion
            } // End of prefix check
        } // End of read loop
        keysToDelete.forEach(k => localStorage.removeItem(k)); // Obliterate every single flagged key belonging to the user

        delete users[email]; // Erase the user's registration block from the master dictionary
        localStorage.setItem('mathTrackUsers', JSON.stringify(users)); // Save the dictionary minus the user
        localStorage.removeItem('currentUser'); // Sever the active session token

        alert("Account permanently deleted."); // Confirm deletion
        window.location.href = 'index.html'; // Kick the user back out to the main login portal
    } // End of confirmation block
} // End of deleteAccount

function renderClassNav() { // Define a function to draw the 8 primary navigation buttons
    const navBar = document.getElementById('class-nav-bar'); // Retrieve the parent container from the DOM
    navBar.innerHTML = ''; // Empty the container fully to prepare for a redraw

    for (let i = 0; i < 8; i++) { // Loop exactly 8 times to maintain the rigid slot system
        const btn = document.createElement('button'); // Generate a new button element
        btn.className = 'btn-class-nav'; // Assign the CSS classes needed for styling

        if (classData[i] !== null) { // Check if a populated class exists in this specific slot
            btn.innerText = classData[i].name; // Assign the class name to the button text
            btn.style.backgroundColor = 'var(--primary)'; // Color it solidly to show it's active
            if (`${currentUser.email}_${classData[i].name}` === currentClass) { // Check if this specific button matches the class currently being viewed on the screen
                btn.style.boxShadow = '0 0 0 3px var(--accent)'; // Apply a glowing border box shadow to highlight the active tab
            } // End of active tab check
            btn.onclick = () => window.location.href = `studentList.html?class=${encodeURIComponent(currentUser.email + '_' + classData[i].name)}`; // Bind a click listener that redirects to the class URL payload
        } else { // If the slot is null/empty
            btn.innerText = '+ Untitled'; // Apply placeholder text indicating it can be added
            btn.style.backgroundColor = '#a9a9a9'; // Shade it gray to show it is inactive
            btn.onclick = () => { // Bind a click listener to trigger the class creation logic
                let baseName = "Untitled"; // Set the root name of the new class
                let count = 1; // Initialize a numerical offset counter
                let uniqueName = baseName; // Start testing the base name
                while (classData.some(c => c !== null && c.name === uniqueName)) { // Loop continuously checking if the generated name already exists in the classData array
                    count++; // Increment the offset counter
                    uniqueName = `${baseName} ${count}`; // Append the number to the base name and try the loop condition again
                } // End of unique name generation loop

                const newClass = { // Construct a fresh class object
                    name: uniqueName, // Assign the verified unique name
                    students: 0, // Default to 0 students
                    eval: "", // Initialize an empty evaluation date string
                    font: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", // Set the default UI font
                    bgColor: "#f9f9f9", // Set the default background color
                    textColor: "#000000" // Set the default text color
                }; // End of object initialization

                classData[i] = newClass; // Assign the new object directly into the empty array slot that was clicked
                localStorage.setItem(storageKey, JSON.stringify(classData)); // Save the modified 8-slot array to local storage
                window.location.href = `studentList.html?class=${encodeURIComponent(currentUser.email + '_' + newClass.name)}`; // Redirect the user to their newly spawned class view
            }; // End of click listener
        } // End of empty slot logic
        navBar.appendChild(btn); // Append the fully configured button into the DOM bar
    } // End of 8-slot loop
} // End of renderClassNav
// --- UNIT LOGIC --- // Section header comment
function initUnits() { // Define function to initialize weekly units on page load
    const unitStorageKey = `units_${currentClass}`; // Construct the storage key specific to the active class
    let storedUnits = JSON.parse(localStorage.getItem(unitStorageKey)); // Attempt to load saved units from local storage

    if (!storedUnits || storedUnits.length === 0 || storedUnits[0].startsWith("Unit")) { // If no units exist, or they use the legacy "Unit 1" naming format
        let mondayDate = getSafeMonday(new Date().toISOString().split('T')[0]); // Calculate the most recent Monday
        let y = mondayDate.getFullYear(); // Extract the full year
        let m = String(mondayDate.getMonth() + 1).padStart(2, '0'); // Extract the month, 1-indexed, padded to 2 digits
        let d = String(mondayDate.getDate()).padStart(2, '0'); // Extract the day, padded to 2 digits
        unitsData = [`${y}-${m}-${d}`]; // Create a new array with the calculated Monday date string as the first unit
        localStorage.setItem(unitStorageKey, JSON.stringify(unitsData)); // Save this newly initialized array to local storage
    } else { // If valid saved units exist
        unitsData = storedUnits; // Load them into the working memory array
    } // End of conditional
    renderUnits(); // Draw the unit tabs onto the screen
} // End of initUnits

function renderUnits() { // Define function to redraw the horizontal unit tab bar
    const unitsContainer = document.getElementById('units-container'); // Retrieve the container element
    if (!unitsContainer) return; // Exit if the container doesn't exist on this page
    unitsContainer.innerHTML = ''; // Empty out any existing HTML tabs

    unitsData.forEach((unitStr, index) => { // Loop through the array of unit date strings
        let unitDiv = document.createElement('div'); // Create a new div element to act as the tab
        unitDiv.className = 'unit-box' + (index === activeUnitIndex ? ' active' : ''); // Apply the base class, plus 'active' if it matches the current pointer

        let safeDate = getSafeMonday(unitStr); // Parse the string back into a reliable Date object
        unitDiv.innerText = safeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // Set the tab text to a human-readable "Jan 1" format

        unitDiv.onclick = () => { // Add a click listener to the tab
            activeUnitIndex = index; // Update the global pointer to this tab's index
            renderUnits(); // Redraw the tabs to update the visual active state
            renderRosterTable(); // Redraw the entire gradebook table for the new selected week
        }; // End of click listener

        const delBtn = document.createElement('button'); // Create a tiny delete button to place on the tab
        delBtn.className = 'unit-delete'; // Assign styling class
        delBtn.innerText = '×'; // Set the text icon
        delBtn.onclick = (e) => { // Add a click listener
            e.stopPropagation(); // Prevent the click from bubbling down to the tab itself, which would change the active tab
            if (confirm(`Delete this week and all its marks?`)) { // Ask for confirmation before permanent deletion
                unitsData.splice(index, 1); // Remove the unit from the array
                delete classLessonsData[index]; // Delete the lesson titles associated with this index

                for (let studentId in classMarksData) { // Loop through every student's grades
                    if (classMarksData[studentId]) { // Ensure data exists for the student
                        delete classMarksData[studentId][index]; // Delete grades specifically for the removed week
                        for (let j = index + 1; j <= unitsData.length; j++) { // Loop through all subsequent weeks
                            if (classMarksData[studentId][j]) { // If data exists in the next week
                                classMarksData[studentId][j - 1] = classMarksData[studentId][j]; // Shift the data down one index to fill the gap
                                delete classMarksData[studentId][j]; // Clear the old higher index
                            } // End of shift check
                        } // End of grade shifting loop
                    } // End of student existence check
                } // End of student loop

                for (let j = index + 1; j <= unitsData.length; j++) { // Do the exact same shifting logic for the lesson titles
                    if (classLessonsData[j]) { // If titles exist for a future week
                        classLessonsData[j - 1] = classLessonsData[j]; // Shift them down
                        delete classLessonsData[j]; // Delete the old key
                    } // End of title shift check
                } // End of title shifting loop

                localStorage.setItem(`units_${currentClass}`, JSON.stringify(unitsData)); // Persist the shortened unit array
                localStorage.setItem(`lessons_${currentClass}`, JSON.stringify(classLessonsData)); // Persist the shifted lesson data
                localStorage.setItem(`marks_${currentClass}`, JSON.stringify(classMarksData)); // Persist the shifted grade data

                activeUnitIndex = 0; // Reset the active view back to the first week for safety
                renderUnits(); // Redraw the tabs
                renderRosterTable(); // Redraw the gradebook
            } // End of confirmation block
        }; // End of delete button click listener
        unitDiv.appendChild(delBtn); // Attach the delete button to the tab div

        unitsContainer.appendChild(unitDiv); // Attach the finalized tab to the DOM container
    }); // End of loop generating tabs

    let addBox = document.createElement('div'); // Create a special tab for adding new weeks
    addBox.className = 'unit-add-box'; // Apply styling
    addBox.innerText = '+'; // Set the icon
    addBox.onclick = () => { // Add a click listener
        let nextMondayStr; // Declare a variable to hold the calculated next date
        if (unitsData.length > 0) { // If there are existing weeks
            let lastSafeDate = getSafeMonday(unitsData[unitsData.length - 1]); // Grab the date of the very last week in the array
            lastSafeDate.setDate(lastSafeDate.getDate() + 7); // Add exactly 7 days to it to jump to the next Monday

            let y = lastSafeDate.getFullYear(); // Extract year
            let m = String(lastSafeDate.getMonth() + 1).padStart(2, '0'); // Extract padded month
            let d = String(lastSafeDate.getDate()).padStart(2, '0'); // Extract padded day
            nextMondayStr = `${y}-${m}-${d}`; // Format the new string
        } else { // If the array is entirely empty
            let safeDate = getSafeMonday(new Date().toISOString().split('T')[0]); // Default to the current real-world week
            let y = safeDate.getFullYear(); // Extract year
            let m = String(safeDate.getMonth() + 1).padStart(2, '0'); // Extract padded month
            let d = String(safeDate.getDate()).padStart(2, '0'); // Extract padded day
            nextMondayStr = `${y}-${m}-${d}`; // Format the string
        } // End of empty check

        unitsData.push(nextMondayStr); // Append the newly calculated week to the array
        localStorage.setItem(`units_${currentClass}`, JSON.stringify(unitsData)); // Save the expanded array to storage
        renderUnits(); // Redraw the tabs to show the new one
    }; // End of add button click listener
    unitsContainer.appendChild(addBox); // Append the add button to the DOM
} // End of renderUnits

function selectUnit(index) { // Define helper function to change units programmatically
    activeUnitIndex = index; // Update the pointer
    renderUnits(); // Redraw tabs
    renderRosterTable(); // Redraw grades
} // End of selectUnit

// --- DATA & TABLE LOGIC --- // Section header comment
async function loadStudentsData() { // Define an asynchronous function to fetch the student roster from the SQLite database
    try { // Open try block for network request
        const response = await fetch(`http://localhost:3000/api/data/${encodeURIComponent(currentClass)}`); // Send GET request to fetch roster matching active class
        const json = await response.json(); // Parse the server's response
        studentsData = json.data || []; // Load the array into working memory, defaulting to empty if missing

        const savedOrder = JSON.parse(localStorage.getItem(`studentOrder_${currentClass}`)) || []; // Fetch any custom sorting order the user applied previously
        if (savedOrder.length > 0) { // If a custom order exists
            studentsData.sort((a, b) => { // Apply the custom sort to the fetched array
                let indexA = savedOrder.indexOf(a.id); // Find where student A belongs
                let indexB = savedOrder.indexOf(b.id); // Find where student B belongs
                if (indexA === -1) indexA = 999999; // If missing, push to bottom
                if (indexB === -1) indexB = 999999; // If missing, push to bottom
                return indexA - indexB; // Return the differential to perform the sort
            }); // End of custom sort function
        } // End of custom order check

        renderRosterTable(); // Draw the table using the loaded and sorted data
    } catch (err) { // Catch block
        document.getElementById('roster-container').innerHTML = '<p style="color:var(--danger);">Error connecting to server.</p>'; // Display an error message directly on the page if the server is unreachable
    } // End of try/catch
} // End of loadStudentsData

function ensureUnitStructure() { // Helper to guarantee lesson title objects exist
    if (!classLessonsData[activeUnitIndex]) classLessonsData[activeUnitIndex] = { titles: ["", "", "", "", ""] }; // If the current week is missing, mock it
    if (!classLessonsData[activeUnitIndex].titles) classLessonsData[activeUnitIndex].titles = ["", "", "", "", ""]; // If the titles array is missing, mock it
} // End of ensureUnitStructure

function toggleCustomView(checkbox, studentId, markKey) { // Function to switch between preset radio buttons and the granular slider
    const cellDiv = checkbox.closest('.mark-cell-wrapper'); // Find the parent UI container
    const radioGroup = cellDiv.querySelector('.radio-group-container'); // Find the radio block
    const sliderGroup = cellDiv.querySelector('.custom-slider-container'); // Find the slider block

    if (checkbox.checked) { // If the custom toggle was switched ON
        radioGroup.style.display = 'none'; // Hide radios
        sliderGroup.style.display = 'flex'; // Show slider
        const slider = sliderGroup.querySelector('input[type="range"]'); // Locate slider element
        updateMark(studentId, markKey, slider.value); // Immediately commit the slider's default value to memory
    } else { // If the custom toggle was switched OFF
        sliderGroup.style.display = 'none'; // Hide slider
        radioGroup.style.display = 'flex'; // Show radios
        const checkedRadio = radioGroup.querySelector('input[type="radio"]:checked'); // Find which radio is currently selected
        updateMark(studentId, markKey, checkedRadio ? checkedRadio.value : ''); // Commit the radio value to memory, or clear if none
    } // End of toggle check

    if (!classMarksData[studentId]) classMarksData[studentId] = {}; // Ensure student object exists
    if (!classMarksData[studentId][activeUnitIndex]) classMarksData[studentId][activeUnitIndex] = {}; // Ensure week object exists
    classMarksData[studentId][activeUnitIndex][markKey + '_custom'] = checkbox.checked; // Persist the visual toggle state so it survives page reloads
    localStorage.setItem(`marks_${currentClass}`, JSON.stringify(classMarksData)); // Save to storage
} // End of toggleCustomView

function updateLateStatus(studentId, markKey, isLate) { // Function to toggle the 'Late' penalty flag
    if (!classMarksData[studentId]) classMarksData[studentId] = {}; // Ensure structure
    if (!classMarksData[studentId][activeUnitIndex]) classMarksData[studentId][activeUnitIndex] = {}; // Ensure structure
    classMarksData[studentId][activeUnitIndex][markKey + '_late'] = isLate; // Save boolean flag
    localStorage.setItem(`marks_${currentClass}`, JSON.stringify(classMarksData)); // Persist to storage
} // End of updateLateStatus

function updateMark(studentId, markKey, value) { // Function to save a numerical grade
    if (!classMarksData[studentId]) classMarksData[studentId] = {}; // Ensure structure
    if (!classMarksData[studentId][activeUnitIndex]) classMarksData[studentId][activeUnitIndex] = {}; // Ensure structure
    classMarksData[studentId][activeUnitIndex][markKey] = value; // Apply string value of grade
    localStorage.setItem(`marks_${currentClass}`, JSON.stringify(classMarksData)); // Persist
} // End of updateMark

function updateNote(studentId, text) { // Function to save the text block for private teacher notes
    if (!classMarksData[studentId]) classMarksData[studentId] = {}; // Ensure structure
    if (!classMarksData[studentId][activeUnitIndex]) classMarksData[studentId][activeUnitIndex] = {}; // Ensure structure
    classMarksData[studentId][activeUnitIndex]['notes'] = text; // Apply text body
    localStorage.setItem(`marks_${currentClass}`, JSON.stringify(classMarksData)); // Persist
} // End of updateNote

function updateLessonTitle(dayIndex, title) { // Function to save the header title for a specific lesson day
    ensureUnitStructure(); // Guarantee memory structure
    classLessonsData[activeUnitIndex].titles[dayIndex] = title; // Update the array at the correct day index
    localStorage.setItem(`lessons_${currentClass}`, JSON.stringify(classLessonsData)); // Persist
} // End of updateLessonTitle

// --- IMAGE ATTACHMENT LOGIC --- // Section header comment
function uploadNoteImage(studentId, inputElement) { // Function to handle attaching an image file to a note
    const file = inputElement.files[0]; // Retrieve the selected file
    if (!file) return; // Exit if user cancelled

    const reader = new FileReader(); // Instantiate a FileReader to convert the image to base64
    reader.onload = (e) => { // Trigger when file is fully read into memory
        const img = new Image(); // Create a virtual image object
        img.onload = () => { // Trigger when virtual image finishes processing the base64 string
            const canvas = document.createElement('canvas'); // Create a virtual canvas to resize the image
            const MAX_WIDTH = 800; // Define max constraint
            const MAX_HEIGHT = 800; // Define max constraint
            let width = img.width; // Grab original width
            let height = img.height; // Grab original height

            if (width > height) { // If image is in landscape
                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } // Scale height proportionally and lock width
            } else { // If portrait or square
                if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } // Scale width proportionally and lock height
            } // End of scale calculations

            canvas.width = width; // Apply new width to canvas
            canvas.height = height; // Apply new height to canvas
            const ctx = canvas.getContext('2d'); // Fetch the 2d drawing context
            ctx.drawImage(img, 0, 0, width, height); // Draw the original image onto the smaller canvas, effectively shrinking it

            const dataUrl = canvas.toDataURL('image/jpeg', 0.7); // Compress the result heavily to 70% quality JPEG to save storage quota

            if (!classMarksData[studentId]) classMarksData[studentId] = {}; // Ensure structure
            if (!classMarksData[studentId][activeUnitIndex]) classMarksData[studentId][activeUnitIndex] = {}; // Ensure structure

            classMarksData[studentId][activeUnitIndex]['note_image'] = dataUrl; // Save the compressed base64 string directly into the gradebook memory
            localStorage.setItem(`marks_${currentClass}`, JSON.stringify(classMarksData)); // Persist
            renderRosterTable(); // Redraw the UI so the user sees the attached image
        }; // End of virtual image load
        img.src = e.target.result; // Pass the raw base64 data to the virtual image
    }; // End of FileReader load
    reader.readAsDataURL(file); // Command the FileReader to begin reading the file from the hard drive
} // End of uploadNoteImage

function removeNoteImage(studentId) { // Function to detach an image
    if (classMarksData[studentId] && classMarksData[studentId][activeUnitIndex]) { // Ensure the node exists to prevent crashing
        classMarksData[studentId][activeUnitIndex]['note_image'] = ''; // Overwrite the base64 string with a blank string
        localStorage.setItem(`marks_${currentClass}`, JSON.stringify(classMarksData)); // Persist
        renderRosterTable(); // Redraw UI
    } // End of check
} // End of removeNoteImage

function buildMarkCellHTML(studentId, markKey, markVal, isLate, isCustom) { // Function generating HTML for the grade input controls
    let showSlider = isCustom; // Initialize local toggle state

    const standardMarks = ['0', '25', '50', '75', '100', '']; // Define the values available via the preset radio buttons
    if (markVal !== '' && !standardMarks.includes(String(markVal))) { // If the stored grade is 88%, it can't be shown on the radios
        showSlider = true; // Force the slider to be visible to display the granular grade accurately
        isCustom = true; // Override state
    } // End of precision check

    const radios = ['0', '25', '50', '75', '100'].map(val => ` 
        <label style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <input type="radio" style="margin: 0; cursor: pointer;" name="mark_${studentId}_${markKey}" value="${val}" ${String(markVal) === val && !showSlider ? 'checked' : ''} onchange="updateMark(${studentId}, '${markKey}', this.value)">
            <span>${val}</span>
        </label>
    `).join(''); // Loop over the 5 standard values to programmatically build the 5 radio buttons and bind their change events

    return `<td class="mark-cell"> 
                <div class="mark-cell-wrapper" style="display: flex; align-items: center; justify-content: center; min-width: 180px; font-size: 0.75em;">
                    <div style="display: flex; flex-direction: row; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: center;">
                        
                        <div style="display: flex; gap: 8px; border-right: 1px solid var(--border-color); padding-right: 10px;">
                            <label style="display: flex; flex-direction: column; align-items: center; cursor: pointer; color: var(--danger);">
                                <input type="checkbox" style="margin: 0; cursor: pointer;" ${isLate ? 'checked' : ''} onchange="updateLateStatus(${studentId}, '${markKey}', this.checked)">
                                <span>Late</span>
                            </label>
                            <label style="display: flex; flex-direction: column; align-items: center; cursor: pointer; color: var(--accent);">
                                <input type="checkbox" style="margin: 0; cursor: pointer;" ${showSlider ? 'checked' : ''} onchange="toggleCustomView(this, ${studentId}, '${markKey}')">
                                <span>Custom</span>
                            </label>
                        </div>
                        
                        <div class="radio-group-container" style="display: ${showSlider ? 'none' : 'flex'}; gap: 8px;">
                            ${radios}
                        </div>
                        
                        <div class="custom-slider-container" style="display: ${showSlider ? 'flex' : 'none'}; flex-direction: column; align-items: center; width: 90px;">
                            <input type="range" min="0" max="100" value="${markVal || 50}" style="width: 100%; cursor: pointer; margin: 0;" 
                                oninput="this.nextElementSibling.innerText = this.value; updateMark(${studentId}, '${markKey}', this.value)">
                            <span style="font-weight: bold; font-size: 1.1em; color: var(--accent); margin-top: 2px;">${markVal || 50}</span>
                        </div>

                    </div>
                </div>
            </td>`; // Return the sprawling multi-element HTML string constituting a single day's grade cell
} // End of buildMarkCellHTML

function filterStudents() { // Function to hide/show students based on the search bar
    const searchVal = document.getElementById('search-student-input').value.toLowerCase(); // Fetch and lowercase the typed search
    const rows = document.querySelectorAll('.student-row'); // Get all rendered student rows
    
    rows.forEach(row => { // Loop through each row
        const studentId = row.getAttribute('data-student-id'); // Read the embedded ID
        const student = studentsData.find(s => s.id == studentId); // Look up the actual data object
        if (!student) return; // Failsafe
        
        if (student.name.toLowerCase().includes(searchVal)) { // Check if their name contains the search string
            row.style.display = ''; // Make visible
        } else { // If no match
            row.style.display = 'none'; // Hide entirely
        } // End of check
    }); // End of loop
} // End of filterStudents

function sortStudents() { // Function to handle alphabetical sorting dropsdown
    const sortVal = document.getElementById('sort-student-select').value; // Read the selected option
    
    studentsData.sort((a, b) => { // Trigger array sort on the global database
        let nameA = a.name ? a.name.trim().toLowerCase() : ""; // Normalize A
        let nameB = b.name ? b.name.trim().toLowerCase() : ""; // Normalize B
        
        let aParts = nameA.split(' '); // Split A into first/last
        let bParts = nameB.split(' '); // Split B into first/last
        
        let aFirst = aParts[0] || ""; // Extract first name A
        let aLast = aParts.length > 1 ? aParts.slice(1).join(' ') : ""; // Extract remainder as last name A
        
        let bFirst = bParts[0] || ""; // Extract first name B
        let bLast = bParts.length > 1 ? bParts.slice(1).join(' ') : ""; // Extract remainder as last name B
        
        if (sortVal === "first-asc") { // Sort by first name ascending
            return nameA.localeCompare(nameB); // Compare natively
        } else if (sortVal === "first-desc") { // Sort by first name descending
            return nameB.localeCompare(nameA); // Inverse compare natively
        } else if (sortVal === "last-asc") { // Sort by last name ascending
            let res = aLast.localeCompare(bLast); // Compare last names first
            if (res === 0) res = aFirst.localeCompare(bFirst); // If identical, fallback to first name
            return res; // Return calculated value
        } else if (sortVal === "last-desc") { // Sort by last name descending
            let res = bLast.localeCompare(aLast); // Inverse compare last names
            if (res === 0) res = bFirst.localeCompare(aFirst); // Fallback to first
            return res; // Return value
        } // End of condition chain
        return 0; // Default fallback does nothing
    }); // End of sort block

    const newOrder = studentsData.map(s => s.id); // Map the newly sorted list down to an array of just IDs
    localStorage.setItem(`studentOrder_${currentClass}`, JSON.stringify(newOrder)); // Save the custom array arrangement
    
    renderRosterTable(); // Redraw the UI
    filterStudents(); // Re-apply the search filter just in case
} // End of sortStudents
function renderRosterTable() { // Define function to draw the main gradebook grid
    const container = document.getElementById('roster-container'); // Locate the parent container
    if (!container) return; // Exit if not found

    if (studentsData.length === 0) { // If there are no students loaded
        container.innerHTML = '<p>No students tracked. Please import a CSV or manually add a student above.</p>'; // Show a helper message instead of an empty table
        return; // Exit
    } // End of student check

    if (unitsData.length === 0) { // If there are no weeks created
        container.innerHTML = '<p>No weeks available. Please click the + button above to add a week.</p>'; // Show a helper message
        return; // Exit
    } // End of week check

    ensureUnitStructure(); // Guarantee that the memory structure for this week's lesson titles is intact

    const currentClassObj = classData.find(c => c !== null && `${currentUser.email}_${c.name}` === currentClass); // Extract the class object from the global array
    let evalDateObj = null; // Initialize the parsed evaluation date variable
    if (currentClassObj && currentClassObj.eval) { // If the class object exists and has an evaluation date configured
        let parsed = new Date(currentClassObj.eval); // Try parsing it natively
        if (!isNaN(parsed)) { // Check if parsing succeeded
            if (parsed.getFullYear() < new Date().getFullYear() - 5) { // If it's absurdly old (e.g. typed without year)
                parsed.setFullYear(new Date().getFullYear()); // Fast forward to the current year
            } // End of year check
            let today = new Date(); // Grab today's real date
            if (parsed < today && (today - parsed) > (1000 * 60 * 60 * 24 * 30)) { // If it's more than 30 days in the past
                parsed.setFullYear(today.getFullYear() + 1); // Assume they meant next year and bump it forward
            } // End of past check
            evalDateObj = parsed; // Finalize the parsed date object
        } // End of NaN check
    } // End of eval check

    let thHTML = `<th style="text-align:left;">Student Details</th>`; // Initialize the table header HTML with the student name column
    const mondayStr = unitsData[activeUnitIndex]; // Retrieve the string of the active week's Monday

    [0, 1, 2, 3, 4].forEach(i => { // Loop through the 5 weekdays (Monday-Friday)
        let d = getSafeMonday(mondayStr); // Base the date calculation on the safe Monday
        d.setDate(d.getDate() + i); // Shift the date object forward by i days
        let dateLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }); // Format the date elegantly for display
        let titleVal = classLessonsData[activeUnitIndex].titles[i] || ""; // Retrieve the lesson title from memory, defaulting to blank

        let isEvalDay = false; // Initialize the highlight flag
        if (evalDateObj && d.getMonth() === evalDateObj.getMonth() && d.getDate() === evalDateObj.getDate() && d.getFullYear() === evalDateObj.getFullYear()) { // If the specific day matches the evaluation date perfectly
            isEvalDay = true; // Throw the flag
        } // End of evaluation check

        let headerColorStyle = isEvalDay ? 'color: var(--danger, #e74c3c); font-weight: bold;' : ''; // If flagged, prepare red text styling
        let inputColorStyle = isEvalDay ? 'color: var(--danger, #e74c3c); font-weight: bold;' : ''; // If flagged, prepare red input styling

        thHTML += `
            <th>
                <div class="lesson-header" style="${headerColorStyle}">
                    <span>${dateLabel}</span>
                    <input type="text" class="lesson-date" placeholder="Lesson Title" value="${titleVal}" onchange="updateLessonTitle(${i}, this.value)" style="width: 100%; box-sizing: border-box; text-align: center; border: 1px solid var(--border-color); border-radius: 4px; padding: 4px; margin-top: 5px; ${inputColorStyle}">
                </div>
            </th>`; // Append the fully constructed day column header
    }); // End of weekday loop

    thHTML += `<th style="min-width: 250px;"><div class="lesson-header"><span>Teacher Notes</span></div></th>`; // Cap the header row with the notes column

    let tbodyHTML = ''; // Initialize the table body HTML string
    studentsData.forEach((student, index) => { // Loop through every student in the active class
        const sMarks = (classMarksData[student.id] && classMarksData[student.id][activeUnitIndex]) || {}; // Load the student's grades for this week

        let parsedContacts = []; // Initialize contact array
        if (student.contacts_info) { // If the modern JSON format exists
            try { parsedContacts = JSON.parse(student.contacts_info); } catch (e) { } // Parse it safely
        } else if (student.guardian_email) { // If falling back to the legacy comma-separated list
            student.guardian_email.split(',').forEach(e => parsedContacts.push({ name: '', rel: '', email: e.trim() })); // Split and map to standard objects
        } // End of contact load

        let contactsDisplayHtml = ''; // Initialize HTML block for the contacts widget

        if (student.student_email && student.student_email.trim() !== '') { // If the student has their own email attached
            contactsDisplayHtml += `<div style="font-size: 0.8em; margin-top: 2px; line-height: 1.3;">
                <span style="color: gray;">${student.student_email.trim()}</span>
            </div>`; // Render it lightly colored
        } // End of student email check

        parsedContacts.forEach(c => { // Loop through all parents/guardians
            if (c.email || c.name) { // Ensure the record isn't totally blank
                contactsDisplayHtml += `<div style="font-size: 0.8em; margin-top: 6px; line-height: 1.3;">
                    <span style="font-weight: bold; color: var(--text-color);">${c.name || 'Guardian'} ${c.rel ? `(${c.rel})` : ''}</span><br>
                    <span style="color: gray;">${c.email || 'No email'}</span>
                </div>`; // Render the guardian's details securely
            } // End of validation check
        }); // End of contact HTML loop

        if (parsedContacts.length === 0) parsedContacts.push({ name: '', rel: '', email: '' }); // Guarantee at least one empty row exists so they can add someone

        let parentEditHtml = ''; // Initialize HTML block for the editable form
        parsedContacts.forEach(c => { // Loop through all contacts again
            parentEditHtml += `
                <div class="parent-email-row" style="display: flex; gap: 5px; margin-bottom: 5px;">
                    <input type="text" class="parent-name-input" placeholder="Name" value="${c.name || ''}" style="width: 30%; flex: 1; padding: 6px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--input-bg); color: var(--text-color);" onchange="saveStudentChanges(${student.id})">
                    <input type="text" class="parent-rel-input" placeholder="Relation" value="${c.rel || ''}" style="width: 30%; flex: 1; padding: 6px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--input-bg); color: var(--text-color);" onchange="saveStudentChanges(${student.id})">
                    <input type="text" class="parent-email-input" placeholder="Email" value="${c.email || ''}" style="flex: 2; padding: 6px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--input-bg); color: var(--text-color);" onchange="saveStudentChanges(${student.id})">
                </div>
            `; // Build the editable inputs hooked up to auto-save
        }); // End of editable form loop

        const nameParts = student.name ? student.name.split(' ') : ["Unknown"]; // Safely split the full name for the edit form
        const fName = nameParts[0]; // Isolate first name
        const lName = nameParts.slice(1).join(' '); // Re-join any remaining parts as the last name

        tbodyHTML += `
            <tr data-student-id="${student.id}" class="student-row">
                <td class="student-cell" style="text-align:left;">
                    <div class="student-card">
                        <div class="student-header" onclick="toggleStudentDetails(${student.id})" style="align-items: flex-start; cursor: pointer;">
                            <div id="student-header-info-${student.id}">
                                <h4 style="margin: 0; font-size: 1.1em;">${index + 1}. ${student.name}</h4>
                                ${contactsDisplayHtml}
                            </div>
                            <div class="student-actions" style="display: flex; flex-direction: column; gap: 5px; align-items: flex-end;">
                                <div style="display: flex; gap: 5px;">
                                    <button class="btn btn-success" style="font-size: 0.75em; padding: 4px 8px;" onclick="emailIndividualStudent(event, ${student.id})">Send</button>
                                    <button class="btn btn-danger" style="font-size: 0.75em; padding: 4px 8px;" onclick="deleteStudent(event, ${student.id})">Del</button>
                                </div>
                                <button class="btn btn-primary" style="font-size: 0.75em; padding: 4px 8px; width: 100%; box-sizing: border-box;" onclick="openIndividualEmailModal(event, ${student.id})">✎ Edit Email</button>
                            </div>
                        </div>
                        <div class="student-details" id="details-${student.id}" style="display:none; margin-top: 10px;">
                            <div class="form-row" style="display:flex; gap:10px;">
                                <div class="form-group" style="flex:1;"><label style="font-weight:bold; font-size:0.8em;">First</label><input type="text" id="fname-${student.id}" value="${fName}" style="width:100%; padding:5px;" onchange="saveStudentChanges(${student.id})"></div>
                                <div class="form-group" style="flex:1;"><label style="font-weight:bold; font-size:0.8em;">Last</label><input type="text" id="lname-${student.id}" value="${lName}" style="width:100%; padding:5px;" onchange="saveStudentChanges(${student.id})"></div>
                            </div>
                            <div class="form-group" style="margin-top:10px;"><label style="font-weight:bold; font-size:0.8em;">Student Email (Optional)</label><input type="text" id="semail-${student.id}" value="${student.student_email || ''}" style="width:100%; padding:5px;" onchange="saveStudentChanges(${student.id})"></div>
                            <div class="form-group" id="parent-container-${student.id}" style="margin-top:10px;"><label style="font-weight:bold; font-size:0.8em;">Contacts (Name, Relationship, Email)</label>
                                ${parentEditHtml}
                            </div>
                            <div style="display:flex; justify-content:flex-start; margin-top: 10px;">
                                <button class="btn-add-circle" onclick="addParentInput(${student.id})">+</button>
                            </div>
                        </div>
                    </div>
                </td>`; // Append the fully configured accordion card for this student to the row

        [0, 1, 2, 3, 4].forEach(i => { // Loop through the 5 weekdays again for the marks
            const markKey = `d${i}`; // Generate the specific memory key (d0, d1, d2)
            const markVal = sMarks[markKey] || ''; // Retrieve stored value
            const isLate = sMarks[markKey + '_late'] || false; // Retrieve late boolean
            const isCustom = sMarks[markKey + '_custom'] || false; // Retrieve custom view boolean
            tbodyHTML += buildMarkCellHTML(student.id, markKey, markVal, isLate, isCustom); // Inject the grade widget HTML into the row
        }); // End of weekday loop

        const studentNote = sMarks['notes'] || ''; // Load note string
        const studentNoteImg = sMarks['note_image'] || ''; // Load base64 image data

        let imgHtml = ''; // Initialize block
        if (studentNoteImg) { // If an image exists
            imgHtml = `
                <div style="position:relative; display:inline-block; margin-top:5px; width: 100%; text-align:center;">
                    <img src="${studentNoteImg}" style="max-width: 100%; max-height: 100px; border-radius: 4px; border: 1px solid var(--border-color);">
                    <button onclick="removeNoteImage(${student.id})" title="Remove Image" style="position:absolute; top:-5px; right:-5px; background:var(--danger); color:white; border:none; border-radius:50%; cursor:pointer; width:22px; height:22px; font-size:12px; font-weight:bold;">×</button>
                </div>
            `; // Construct the image preview with floating delete button
        } // End of image block

        tbodyHTML += `<td class="notes-cell" style="vertical-align: top;">
                        <textarea class="mark-input" spellcheck="true" autocorrect="on" style="width: 100%; height: 60px; resize: vertical; text-align: left; font-weight: normal; font-family: inherit; margin-bottom: 5px;" 
                            placeholder="Add private notes here..." 
                            onchange="updateNote(${student.id}, this.value)">${studentNote}</textarea>
                        
                        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                            <label style="cursor:pointer; font-size:0.8em; color:var(--accent); font-weight:bold; display:flex; align-items:center; gap:5px;">
                                📎 Attach Image
                                <input type="file" accept="image/*" style="display:none;" onchange="uploadNoteImage(${student.id}, this)">
                            </label>
                        </div>
                        ${imgHtml}
                    </td></tr>`; // Cap the row by appending the notes block and closing the TR tag
    }); // End of student rendering loop

    container.innerHTML = `<table class="roster-table"><thead><tr>${thHTML}</tr></thead><tbody>${tbodyHTML}</tbody></table>`; // Finalize DOM insertion of the complete table

    // --- DRAG AND DROP LISTENERS --- // Section header comment
    const rows = container.querySelectorAll('tbody tr.student-row'); // Gather all rendered rows
    let dragStartIndex = -1; // Initialize the drag index pointer

    rows.forEach((row, index) => { // Loop through the physical DOM rows
        row.draggable = true; // Enable HTML5 dragging

        row.addEventListener('dragstart', function (e) { // Define behavior when drag begins
            const targetTag = e.target.tagName.toLowerCase(); // Check exactly what element was dragged
            if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'button' || targetTag === 'select') { // If it was a form element
                e.preventDefault(); // Stop the drag completely so they can highlight text instead
                return; // Exit
            } // End of form trap
            dragStartIndex = index; // Log the starting row index
            this.style.opacity = '0.4'; // Dim the row slightly
            this.style.backgroundColor = 'rgba(0,0,0,0.05)'; // Apply a highlight
        }); // End of dragstart

        row.addEventListener('dragend', function () { // When drag finishes via dropping or cancelling
            this.style.opacity = '1'; // Restore opacity
            this.style.backgroundColor = ''; // Remove highlight
            rows.forEach(r => r.style.borderTop = ''); // Purge all visual landing targets across the table
        }); // End of dragend

        row.addEventListener('dragover', function (e) { // When hovering over another row
            e.preventDefault(); // Required by browser API to allow drops
        }); // End of dragover

        row.addEventListener('dragenter', function (e) { // Entering another row's bounding box
            e.preventDefault(); // Standard
            this.style.borderTop = '3px solid var(--accent)'; // Draw a target line above the row
        }); // End of dragenter

        row.addEventListener('dragleave', function () { // Leaving another row's bounding box
            this.style.borderTop = ''; // Clear target line
        }); // End of dragleave

        row.addEventListener('drop', function () { // Releasing the mouse over a row
            this.style.borderTop = ''; // Clear target line immediately
            const dragEndIndex = index; // Log destination index

            if (dragStartIndex !== -1 && dragStartIndex !== dragEndIndex) { // As long as it genuinely moved
                const itemToMove = studentsData.splice(dragStartIndex, 1)[0]; // Rip the student out of the memory array
                studentsData.splice(dragEndIndex, 0, itemToMove); // Splice it back in at the new coordinates

                const newOrder = studentsData.map(s => s.id); // Map the freshly sorted array into a list of IDs
                localStorage.setItem(`studentOrder_${currentClass}`, JSON.stringify(newOrder)); // Save the new order

                renderRosterTable(); // Redraw immediately to apply cleanly
            } // End of movement check
        }); // End of drop
    }); // End of row binding loop
} // End of renderRosterTable

// --- STUDENT MANAGER --- // Section header comment
function toggleStudentDetails(id) { // Function to show/hide the student accordion
    const div = document.getElementById(`details-${id}`); // Get target div
    div.style.display = div.style.display === "block" ? "none" : "block"; // Toggle state
} // End of toggleStudentDetails

function addParentInput(id) { // Function to dynamically inject an empty contact row without redrawing table
    const container = document.getElementById(`parent-container-${id}`); // Get parent
    const newRow = document.createElement('div'); // Create block
    newRow.className = 'parent-email-row'; // Apply classes
    newRow.style.cssText = 'display: flex; gap: 5px; margin-bottom: 5px;'; // Apply inline styling to match
    newRow.innerHTML = `
        <input type="text" class="parent-name-input" placeholder="Name" style="width: 30%; flex: 1; padding: 6px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--input-bg); color: var(--text-color);" onchange="saveStudentChanges(${id})">
        <input type="text" class="parent-rel-input" placeholder="Relation" style="width: 30%; flex: 1; padding: 6px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--input-bg); color: var(--text-color);" onchange="saveStudentChanges(${id})">
        <input type="text" class="parent-email-input" placeholder="Email" style="flex: 2; padding: 6px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--input-bg); color: var(--text-color);" onchange="saveStudentChanges(${id})">
    `; // Load raw HTML into block
    container.appendChild(newRow); // Attach block
} // End of addParentInput

// Seamless Auto-Save Function // Header comment
async function saveStudentChanges(id) { // Async function to save inline edits instantly to the database
    const fname = document.getElementById(`fname-${id}`).value.trim(); // Get first name
    const lname = document.getElementById(`lname-${id}`).value.trim(); // Get last name
    const sEmail = document.getElementById(`semail-${id}`).value.trim(); // Get student email

    const parentRows = document.getElementById(`parent-container-${id}`).querySelectorAll('.parent-email-row'); // Select all custom parent rows
    let contactsList = []; // Initialize JSON payload
    let emailList = []; // Initialize comma-separated payload for legacy compat

    parentRows.forEach(row => { // Loop through rows
        let name = row.querySelector('.parent-name-input').value.trim(); // Read form
        let rel = row.querySelector('.parent-rel-input').value.trim(); // Read form
        let email = row.querySelector('.parent-email-input').value.trim(); // Read form
        if (email || name) { // If it isn't entirely blank
            contactsList.push({ name, rel, email }); // Add to JSON
            if (email) emailList.push(email); // Add to legacy list
        } // End of blank check
    }); // End of row loop

    const guardian_email = emailList.join(','); // Join legacy string
    const contacts_info = JSON.stringify(contactsList); // Serialize JSON
    const fullName = `${fname} ${lname}`.trim(); // Combine full name

    // Silently update the local memory array without full table redraw // Comment explaining stealth update methodology
    const sIndex = studentsData.findIndex(s => s.id === id); // Find index
    if (sIndex > -1) { // Failsafe
        studentsData[sIndex].name = fullName; // Update name
        studentsData[sIndex].student_email = sEmail; // Update sEmail
        studentsData[sIndex].guardian_email = guardian_email; // Update legacy email
        studentsData[sIndex].contacts_info = contacts_info; // Update JSON info

        // Visually update the header text specifically to avoid stealing focus // Comment
        const headerInfoDiv = document.getElementById(`student-header-info-${id}`); // Get widget parent
        if (headerInfoDiv) { // Failsafe
            let contactsDisplayHtml = ''; // Init text
            if (sEmail && sEmail !== '') { // If sEmail exists
                contactsDisplayHtml += `<div style="font-size: 0.8em; margin-top: 2px; line-height: 1.3;"><span style="color: gray;">${sEmail}</span></div>`; // Inject
            } // End sEmail block
            contactsList.forEach(c => { // Loop
                if (c.email || c.name) { // Validate
                    contactsDisplayHtml += `<div style="font-size: 0.8em; margin-top: 6px; line-height: 1.3;"><span style="font-weight: bold; color: var(--text-color);">${c.name || 'Guardian'} ${c.rel ? `(${c.rel})` : ''}</span><br><span style="color: gray;">${c.email || 'No email'}</span></div>`; // Inject
                } // Validate end
            }); // Loop end
            headerInfoDiv.innerHTML = `<h4 style="margin: 0; font-size: 1.1em;">${sIndex + 1}. ${fullName}</h4>${contactsDisplayHtml}`; // Push the new HTML specifically over the header widget
        } // Failsafe end
    } // Find index end

    try { // Network try block
        await fetch(`http://localhost:3000/api/update/${id}`, { // Ping server to persist changes to SQLite immediately
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, // Format request
            body: JSON.stringify({ // Stringify payload
                name: fullName, // Payload name
                student_email: sEmail, // Payload email
                guardian_email: guardian_email, // Payload legacy email
                contacts_info: contacts_info // Payload JSON string
            }) // Payload end
        }); // Request end
    } catch (err) { console.error("Error auto-saving.", err); } // Catch and silently discard network errors to prevent interrupting user
} // saveStudentChanges end

async function deleteStudent(event, id) { // Async function to delete student
    event.stopPropagation(); // Stop click from toggling accordion
    if (confirm("Remove this student?")) { // Confirm deletion
        try { // Network block
            await fetch(`http://localhost:3000/api/delete/${id}`, { method: 'DELETE' }); // Tell server to obliterate row by ID
            loadStudentsData(); // Repull and redraw entire roster
        } catch (e) { // Network catch
            console.error("DB Error", e); // Log error natively
            alert("Error trying to communicate with server"); // Present error to user since action is destructive and failed
        } // End block
    } // Confirm end
} // Delete function end

async function deleteClassRoster() { // Async function attached to global delete button
    if (confirm("Are you sure you want to delete EVERY student in this roster? This cannot be undone.")) { // Enforce brutal confirmation dialog
        try { // Try block
            const response = await fetch(`http://localhost:3000/api/delete-class/${encodeURIComponent(currentClass)}`, { method: 'DELETE' }); // Send DELETE verb targeting entire class key
            if (response.ok) { // If server agrees
                loadStudentsData(); // Redraw to show empty screen
            } else { // Server protested
                alert("Failed to delete roster. Check server console."); // Notify
            } // Check end
        } catch (err) { // Network catch
            alert("Server offline."); // Notify
        } // Block end
    } // Confirm end
} // Function end

// --- MANUAL ADD STUDENT LOGIC --- // Section block comment
function toggleAddStudentForm() { // Show hide add student block
    const form = document.getElementById('add-student-form'); // Locate form
    form.style.display = form.style.display === 'none' || form.style.display === '' ? 'block' : 'none'; // Flip logic
    if (form.style.display === 'none') { // If just hidden, wipe values so they are fresh next time
        document.getElementById('new-fname').value = ''; // Reset
        document.getElementById('new-lname').value = ''; // Reset
        document.getElementById('new-semail').value = ''; // Reset
        document.getElementById('new-cname').value = ''; // Reset
        document.getElementById('new-crel').value = ''; // Reset
        document.getElementById('new-cemail').value = ''; // Reset
    } // Check end
} // Function end

async function saveNewStudent() { // Function to save newly input student
    const fName = document.getElementById('new-fname').value.trim(); // Gather info
    const lName = document.getElementById('new-lname').value.trim(); // Gather info
    const sEmail = document.getElementById('new-semail').value.trim(); // Gather info
    const cName = document.getElementById('new-cname').value.trim(); // Gather info
    const cRel = document.getElementById('new-crel').value.trim(); // Gather info
    const cEmail = document.getElementById('new-cemail').value.trim(); // Gather info

    if (!fName || !lName) { // Failsafe require name
        return alert("First and Last name are required to add a student."); // Break
    } // End

    const studentName = `${fName} ${lName}`; // Synthesize

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
        document.getElementById('new-cemail').value = ''; // Reset UI

        toggleAddStudentForm(); // Hide UI
        loadStudentsData(); // Refetch table so new addition appears

    } catch (err) { // Network catch
        alert("Error adding student. Make sure your server is running."); // Notify
    } // Block end
} // Function end
// --- EMAIL LOGIC --- // Section header comment

function openTemplateModal() { // Open the global email template editor modal
    const modal = document.getElementById('template-modal'); // Get modal wrapper
    const editor = document.getElementById('template-textarea'); // Get textarea editor
    let template = localStorage.getItem(`emailTemplate_${currentClass}`); // Try to fetch a custom class template from memory

    if (!template) { // If there isn't one
        template = DEFAULT_EMAIL_TEMPLATE; // Use the raw HTML scaffolding string
    } // Check end
    editor.innerHTML = template; // Push text to editor
    modal.style.display = 'flex'; // Show modal
} // Function end

function saveTemplate() { // Save edits made in modal
    const editor = document.getElementById('template-textarea'); // Find editor
    localStorage.setItem(`emailTemplate_${currentClass}`, editor.innerHTML); // Persist raw HTML directly to local storage
    closeTemplateModal(); // Hide modal
    alert("Class email template saved successfully!"); // Feedback
} // Function end

function closeTemplateModal() { // Hide modal UI
    document.getElementById('template-modal').style.display = 'none'; // Style none
} // Function end

function restoreDefaultGlobalTemplate() { // Wipe custom memory and revert
    if (confirm("Are you sure you want to revert to the default template? This will overwrite your current edits.")) { // Hard confirmation
        document.getElementById('template-textarea').innerHTML = DEFAULT_EMAIL_TEMPLATE; // Apply default string back into editor UI
    } // Confirm end
} // Function end


let currentIndividualEmailId = null; // Pointer for the specific student being edited

function openIndividualEmailModal(event, id) { // Show modal for granular email editing
    event.stopPropagation(); // Stop click-through
    currentIndividualEmailId = id; // Update pointer

    // Load the raw tag template saved specific to this student, or default back to global template // Comment
    const overrideKey = `emailOverride_${currentClass}_${activeUnitIndex}_${id}`; // Calculate override key string
    let draftMsg = localStorage.getItem(overrideKey); // Try to get it

    if (!draftMsg) { // If missing
        draftMsg = localStorage.getItem(`emailTemplate_${currentClass}`) || DEFAULT_EMAIL_TEMPLATE; // Cascade down to class level, then global level
    } // Check end

    document.getElementById('individual-email-textarea').innerHTML = draftMsg; // Display to user
    document.getElementById('individual-email-modal').style.display = 'flex'; // Show wrapper
} // Function end

function closeIndividualEmailModal() { // Hide granular modal
    document.getElementById('individual-email-modal').style.display = 'none'; // Style none
    currentIndividualEmailId = null; // Clear pointer
} // Function end

// Saves the custom text into localStorage and closes modal // Comment
function saveIndividualEmailModal() { // Commit custom student email template to memory
    if (currentIndividualEmailId === null) return; // Failsafe
    const customText = document.getElementById('individual-email-textarea').innerHTML; // Retrieve content
    const overrideKey = `emailOverride_${currentClass}_${activeUnitIndex}_${currentIndividualEmailId}`; // Generate key
    localStorage.setItem(overrideKey, customText); // Persist
    closeIndividualEmailModal(); // Close window
} // Function end

function restoreDefaultIndividualEmail() { // Clear specific student override
    if (confirm("Are you sure you want to revert to the default email format? This will overwrite your current edits.")) { // Ask user
        const id = currentIndividualEmailId; // Get pointer
        const overrideKey = `emailOverride_${currentClass}_${activeUnitIndex}_${id}`; // Calculate key
        localStorage.removeItem(overrideKey); // Purge from system

        let draftMsg = localStorage.getItem(`emailTemplate_${currentClass}`) || DEFAULT_EMAIL_TEMPLATE; // Load fallback
        document.getElementById('individual-email-textarea').innerHTML = draftMsg; // Draw fallback
    } // Confirm end
} // Function end

// Dynamically assembles the final HTML string with active values from database right before send // Comment
function buildGradeMessage(studentName, recipientName, sMarks, isStudent, customTemplate = null) { // HTML builder function
    const mondayStr = unitsData[activeUnitIndex]; // Get base date string
    let weekDate = getSafeMonday(mondayStr); // Calc actual Date

    let tableHeaders = `<th style="border: 1px solid black; padding: 5px; text-align: left; font-weight: bold;">Date</th>`; // Setup table skeleton
    let tableTitles = `<td style="border: 1px solid black; padding: 5px; text-align: left; font-weight: bold;">Lesson</td>`; // Setup table skeleton
    let tableMarks = `<td style="border: 1px solid black; padding: 5px; text-align: left; font-weight: bold;">Marks</td>`; // Setup table skeleton

    [0, 1, 2, 3, 4].forEach(i => { // Iterate weekdays
        let d = getSafeMonday(mondayStr); // Base date
        d.setDate(d.getDate() + i); // Offset date
        let fullDateName = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); // Format beautiful date string

        let title = (classLessonsData[activeUnitIndex] && classLessonsData[activeUnitIndex].titles) ? classLessonsData[activeUnitIndex].titles[i] : ""; // Fetch title safely

        const mark = sMarks[`d${i}`] || ""; // Fetch grade safely
        const markText = mark === "" ? "" : `${mark}%`; // Append % if not blank
        const isLate = sMarks[`d${i}_late`] ? " (late)" : ""; // Check late toggle

        tableHeaders += `<th style="border: 1px solid black; padding: 5px; text-align: left; font-weight: normal;">${fullDateName}</th>`; // Grow HTML table
        tableTitles += `<td style="border: 1px solid black; padding: 5px; text-align: left;">${title}</td>`; // Grow HTML table
        tableMarks += `<td style="border: 1px solid black; padding: 5px; text-align: left;">${markText}${isLate}</td>`; // Grow HTML table
    }); // Loop end

    let gradesHTMLTable = `
    <table style="border-collapse: collapse; width: 100%; max-width: 800px; font-family: Arial, sans-serif; color: #333; margin-top: 5px; margin-bottom: 5px;">
        <tr>${tableHeaders}</tr>
        <tr>${tableTitles}</tr>
        <tr>${tableMarks}</tr>
    </table>`; // Assemble the components into a rigid HTML layout structure

    let notesText = ""; // Init string
    if (sMarks['notes'] && sMarks['notes'].trim() !== "") { // If notes exist
        notesText = sMarks['notes'].replace(/\n/g, '<br>'); // Translate newline characters into HTML line breaks
    } // Check end

    let template = customTemplate || localStorage.getItem(`emailTemplate_${currentClass}`) || DEFAULT_EMAIL_TEMPLATE; // Cascade template logic

    // Purges old subheading text just in case it was saved natively globally before this update // Comment
    template = template.replace(/<strong>Teacher Notes:<\/strong><br>/g, ''); // String replace

    // Clean up empty notes spacing elegantly so we don't get double spaces if notes are empty // Comment
    if (notesText === "") { // If blank
        template = template.replace(/\s*\[TeacherNotes\]\s*(?:<br>\s*){0,2}/g, ''); // RegEx to clean up the tag entirely
    } // Check end

    let text = template // Open string chaining
        .replace(/\[RecipientName\]/g, recipientName) // Inject variable
        .replace(/\[StudentName\]/g, studentName) // Inject variable
        .replace(/\[Week\]/g, weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })) // Inject variable
        .replace(/\[Grades\]/g, gradesHTMLTable) // Inject literal HTML block
        .replace(/\[TeacherNotes\]/g, notesText) // Inject HTML block
        .replace(/\[TeacherName\]/g, `${currentUser.firstName} ${currentUser.lastName}`); // Inject static names

    return text.trim(); // Send string back formatted
} // Function end

function getEmailAttachments(studentId) { // Check for and package any image payloads attached to notes
    const sMarks = (classMarksData[studentId] && classMarksData[studentId][activeUnitIndex]) || {}; // Get grades
    let attachments = []; // Init array
    if (sMarks['note_image']) { // If image string exists
        attachments.push({ // Create Nodemailer friendly object
            filename: 'teacher_note.jpg', // Label
            path: sMarks['note_image'] // Data
        }); // Push end
    } // Check end
    return attachments; // Return the array of packaged images
} // Function end

// REFACTORED SHARED EMAIL BUILDER LOGIC
function gatherStudentEmails(student) { // Shared logic resolving target emails per student
    let emailsToSend = []; // Array to track objects
    const attachments = getEmailAttachments(student.id); // Scan for attachments
    const sMarks = (classMarksData[student.id] && classMarksData[student.id][activeUnitIndex]) || {}; // Load marks
    const overrideKey = `emailOverride_${currentClass}_${activeUnitIndex}_${student.id}`; // Generate key
    const customOverrideTemplate = localStorage.getItem(overrideKey); // Try to fetch override

    if (student.student_email && student.student_email.trim()) { // If the student has an email natively
        emailsToSend.push({ // Append payload
            to: student.student_email.trim(), // Recipient
            subject: `MathTrack Grades - ${student.name}`, // Subject
            text: buildGradeMessage(student.name, student.name, sMarks, true, customOverrideTemplate), // Formatted HTML body
            attachments: attachments // Add images
        }); // Array push
    } // Block end

    let parsedContacts = []; // Init
    if (student.contacts_info) { // If JSON
        try { parsedContacts = JSON.parse(student.contacts_info); } catch (e) { } // Parse safely
    } else if (student.guardian_email) { // Fallback
        student.guardian_email.split(',').forEach(e => parsedContacts.push({ name: '', rel: '', email: e.trim() })); // Map to JSON format
    } // Block end

    parsedContacts.forEach(c => { // Loop through all contacts
        if (c.email && c.email.trim()) { // Validate
            let contactName = (c.name && c.name.trim()) ? c.name.trim() : 'Guardian'; // Assign default
            emailsToSend.push({ // Create payload
                to: c.email.trim(), // Recipient
                subject: `MathTrack Grades - ${student.name}`, // Subject
                text: buildGradeMessage(student.name, contactName, sMarks, false, customOverrideTemplate), // Formatted body
                attachments: attachments // Add images
            }); // Array push
        } // Check end
    }); // Loop end
    
    return emailsToSend; // Yield the array of constructed emails
} // Function end

// Primary send function dynamically utilizing the refactored helper // Comment
async function emailIndividualStudent(event, id) { // Async trigger for clicking single 'Send' button
    event.stopPropagation(); // Halt bubbling
    const btn = event.target; // Identify trigger element
    const student = studentsData.find(s => s.id === id); // Fetch full student object

    const oldText = btn.innerText; btn.innerText = "..."; // UI feedback

    let emailsToSend = gatherStudentEmails(student); // Invoke the newly consolidated helper function!

    if (emailsToSend.length === 0) { // If no valid emails found
        alert("No email addresses found for this student."); // Inform user
        btn.innerText = oldText; // Restore UI
        return; // Break
    } // Check end

    try { // Try network call
        const response = await fetch(`http://localhost:3000/api/send-emails`, { // Send the payload
            method: 'POST', // POST verb
            headers: { 'Content-Type': 'application/json' }, // Headers
            body: JSON.stringify({ // Stringify JSON
                emailsToSend: emailsToSend, // Map constructed array
                senderEmail: currentUser.email, // Bind App user
                senderPassword: currentUser.appPassword // Bind App password
            }) // Stringify end
        }); // Request end
        btn.innerText = response.ok ? "Sent!" : "Fail"; // Conditionally update button based on HTTP code
    } catch (err) { btn.innerText = "Err"; } // Catch hard failures
    setTimeout(() => btn.innerText = oldText, 3000); // Revert UI after delay
} // Function end

async function emailAllStudents() { // Dispatch entire global roster grades
    const status = document.getElementById('emailStatus'); // Fetch progress text element
    status.innerText = "Generating reports..."; // Notify UI

    let emailsToSend = []; // Init

    studentsData.forEach(student => { // Iterate global array
        emailsToSend = emailsToSend.concat(gatherStudentEmails(student)); // Utilize shared helper function to aggregate all outgoing mail safely and efficiently!
    }); // Loop end

    if (emailsToSend.length === 0) { // Verify list isn't blank
        status.innerText = "❌ No emails found in class."; // Notify
        setTimeout(() => status.innerText = "", 4000); // Fade text
        return; // Break
    } // Check end

    try { // Network block
        status.innerText = "Sending to server..."; // Notify
        const response = await fetch(`http://localhost:3000/api/send-emails`, { // Ship payload
            method: 'POST', // POST verb
            headers: { 'Content-Type': 'application/json' }, // Headers
            body: JSON.stringify({ // Stringify
                emailsToSend: emailsToSend, // The huge combined batch payload
                senderEmail: currentUser.email, // App auth
                senderPassword: currentUser.appPassword // App auth
            }) // Object end
        }); // Fetch end
        status.innerText = response.ok ? "✅ All grades dispatched!" : "❌ Failed. Check App Password."; // UI resolution
    } catch (err) { status.innerText = "❌ Server offline."; } // Hard fallback
    setTimeout(() => status.innerText = "", 4000); // Clear element
} // Function end

// --- CSV IMPORT & ROSTER DELETION --- // Comment header
async function handleCSV() { // Function logic to process massive flat file string data natively in JS
    const fileInput = document.getElementById('csv-file'); // Get input element
    const file = fileInput.files[0]; // Get the raw file byte block
    if (!file) return alert("Select a file first."); // Exit if empty

    const reader = new FileReader(); // Create API reader
    reader.onload = async (e) => { // Bind load behavior
        const rows = e.target.result.split('\n'); // Split gigantic text block by newline chars

        let startIndex = 1; // Guess offset
        let headers = []; // Empty array

        for (let i = 0; i < rows.length; i++) { // Walk rows
            let rowLower = rows[i].toLowerCase(); // Case insensitive
            if (rowLower.includes('last name') && rowLower.includes('first name')) { // Try to logically deduce the header row
                headers = rows[i].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase().replace(/\s+/g, ' ')); // Normalize and clean header tags
                startIndex = i + 1; // Mark real data start point
                break; // Exit deduction phase
            } // Check end
        } // Loop end

        let hIdx = { sLast: -1, sFirst: -1, sEmail: -1, c1Rel: -1, c1Last: -1, c1First: -1, c1Email: -1, c2Rel: -1, c2Last: -1, c2First: -1, c2Email: -1 }; // State machine for index mapping

        headers.forEach((h, idx) => { // Map raw text header strings to numerical column indexes to support messy incoming datasets
            if (h === 'last name' && hIdx.sLast === -1) hIdx.sLast = idx; // Check
            else if (h === 'first name' && hIdx.sFirst === -1) hIdx.sFirst = idx; // Check
            else if ((h.includes('student') && h.includes('email')) || h === 'email address') hIdx.sEmail = idx; // Check
            else if (h.includes('1st') && h.includes('relationship')) hIdx.c1Rel = idx; // Check
            else if (h.includes('1st') && h.includes('last name')) hIdx.c1Last = idx; // Check
            else if (h.includes('1st') && h.includes('first name')) hIdx.c1First = idx; // Check
            else if (h.includes('1st') && h.includes('email')) hIdx.c1Email = idx; // Check
            else if (h.includes('2nd') && h.includes('relationship')) hIdx.c2Rel = idx; // Check
            else if (h.includes('2nd') && h.includes('last name')) hIdx.c2Last = idx; // Check
            else if (h.includes('2nd') && h.includes('first name')) hIdx.c2First = idx; // Check
            else if (h.includes('2nd') && h.includes('email')) hIdx.c2Email = idx; // Check
        }); // Loop end

        if (hIdx.sLast === -1) hIdx.sLast = 1; // Fallback mapping
        if (hIdx.sFirst === -1) hIdx.sFirst = 2; // Fallback mapping
        if (hIdx.c1Rel === -1) hIdx.c1Rel = 3; // Fallback mapping
        if (hIdx.c1Last === -1) hIdx.c1Last = 4; // Fallback mapping
        if (hIdx.c1First === -1) hIdx.c1First = 5; // Fallback mapping
        if (hIdx.c1Email === -1) hIdx.c1Email = 6; // Fallback mapping
        if (hIdx.c2Rel === -1) hIdx.c2Rel = 7; // Fallback mapping
        if (hIdx.c2Last === -1) hIdx.c2Last = 8; // Fallback mapping
        if (hIdx.c2First === -1) hIdx.c2First = 9; // Fallback mapping
        if (hIdx.c2Email === -1) hIdx.c2Email = 10; // Fallback mapping

        for (let i = startIndex; i < rows.length; i++) { // Process the actual data rows sequentially
            const row = rows[i]; // Load row string
            if (!row.trim()) continue; // Skip blank lines

            const cols = row.split(','); // Convert comma separated line into string array
            if (cols.length < 3) continue; // Skip corrupt lines lacking data

            let safeGet = (idx) => (cols[idx] ? cols[idx].replace(/"/g, '').trim() : ''); // Arrow function wrapper to prevent index-out-of-bounds crashes during string extraction

            let lastName = safeGet(hIdx.sLast); // Extract
            let firstName = safeGet(hIdx.sFirst); // Extract
            let studentEmail = hIdx.sEmail !== -1 ? safeGet(hIdx.sEmail) : ''; // Extract

            if (!lastName && !firstName) continue; // Abandon if missing vital identifiers
            let studentName = `${firstName} ${lastName}`.trim(); // Generate label

            let contacts = []; // JSON holder
            let emails = []; // Legacy holder

            let c1EmailVal = safeGet(hIdx.c1Email); // Extract string
            let c1FirstVal = safeGet(hIdx.c1First); // Extract string
            let c1LastVal = safeGet(hIdx.c1Last); // Extract string
            if (c1EmailVal.includes('@') || c1FirstVal || c1LastVal) { // Look for any sign data exists
                contacts.push({ // Create block
                    rel: safeGet(hIdx.c1Rel), // Add
                    name: `${c1FirstVal} ${c1LastVal}`.trim(), // Build
                    email: c1EmailVal // Add
                }); // Push block
                if (c1EmailVal.includes('@')) emails.push(c1EmailVal); // Verify email format before pushing legacy array
            } // Check end

            let c2EmailVal = safeGet(hIdx.c2Email); // Extract string
            let c2FirstVal = safeGet(hIdx.c2First); // Extract string
            let c2LastVal = safeGet(hIdx.c2Last); // Extract string
            if (c2EmailVal.includes('@') || c2FirstVal || c2LastVal) { // Similar validation
                contacts.push({ // Object creation
                    rel: safeGet(hIdx.c2Rel), // Load
                    name: `${c2FirstVal} ${c2LastVal}`.trim(), // Synthesize
                    email: c2EmailVal // Load
                }); // Push
                if (c2EmailVal.includes('@')) emails.push(c2EmailVal); // Push to legacy array
            } // End of conditional block

            await fetch('http://localhost:3000/api/add', { // Automatically spool up a database insertion job
                method: 'POST', headers: { 'Content-Type': 'application/json' }, // HTTP headers
                body: JSON.stringify({ // Payload body
                    name: studentName, // Map property
                    student_email: studentEmail, // Map property
                    guardian_email: emails.join(','), // Collapse legacy structure
                    contacts_info: JSON.stringify(contacts), // Formatted new schema
                    class_name: currentClass // Affix to active class
                }) // Payload string
            }); // Fetch end
        } // Mega-loop end
        alert("Import complete."); // Visually alert
        loadStudentsData(); // Re-trigger the primary global fetch to show all 100+ new additions inside the table UI
    }; // Load logic end
    reader.readAsText(file); // Commence native file read into RAM
} // Function end

// --- KEYBOARD NAVIGATION --- // Comment header
document.addEventListener('keydown', function (e) { // Massive listener tracking global key down events
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { // Intercept arrow keys specifically
        const target = e.target; // Establish origin of keypress

        // Check if we are inside a mark cell // Comment indicating focus area
        const currentTd = target.closest('td.mark-cell'); // Bubble up DOM tree looking for mark cell class
        if (!currentTd) return; // Exit if not in grid

        if (target.tagName.toLowerCase() === 'input' && (target.type === 'radio' || target.type === 'checkbox' || target.type === 'range')) { // Restrict focus intercept strictly to the inputs we care about manipulating
            e.preventDefault(); // Stop default up/down scrolling behavior imposed by browser

            const currentRow = target.closest('tr.student-row'); // Get parent TR element representing student
            if (!currentRow) return; // Break if impossible

            const tbody = currentRow.parentElement; // Identify grouping container
            const rows = Array.from(tbody.querySelectorAll('tr.student-row')); // Construct mathematical array mapping out every row on screen
            const rowIndex = rows.indexOf(currentRow); // Find coordinates
            const cellIndex = Array.from(currentRow.children).indexOf(currentTd); // Find coordinates

            let nextRowIndex = rowIndex + (e.key === 'ArrowDown' ? 1 : -1); // Shift coordinates according to user input direction vector
            if (nextRowIndex >= 0 && nextRowIndex < rows.length) { // Prevent out-of-bounds error
                const nextRow = rows[nextRowIndex]; // Capture element physically located at calculated mathematical boundary
                const nextCell = nextRow.children[cellIndex]; // Capture specific column cell

                if (nextCell) { // Guarantee existence
                    // If target was a radio, find corresponding radio or slider // Comment logic handler
                    if (target.type === 'radio') { // Radio processing logic
                        const nextSliderContainer = nextCell.querySelector('.custom-slider-container'); // Look for open slider
                        if (nextSliderContainer && nextSliderContainer.style.display !== 'none') { // If slider exists and is visible
                            const nextSlider = nextCell.querySelector('input[type="range"]'); // Identify slider element
                            if (nextSlider) nextSlider.focus(); // Jump focus
                        } else { // Proceed with radio to radio jump
                            const nextRadios = Array.from(nextCell.querySelectorAll('input[type="radio"]')); // Identify array of radio elements
                            if (nextRadios.length > 0) { // Safety check
                                const toFocus = nextRadios.find(r => r.value === target.value) || nextRadios.find(r => r.checked) || nextRadios[0]; // Intelligent fallback prioritizing matching numerical values
                                toFocus.focus(); // Switch focus organically
                            } // Check end
                        } // Branch end
                    } // Block end
                    // If target was a slider, find the slider or radio // Comment logic handler
                    else if (target.type === 'range') { // Range processing logic
                        const nextSliderContainer = nextCell.querySelector('.custom-slider-container'); // Find slider box
                        if (nextSliderContainer && nextSliderContainer.style.display !== 'none') { // Visible validation
                            const nextSlider = nextCell.querySelector('input[type="range"]'); // Pinpoint
                            if (nextSlider) nextSlider.focus(); // Execute
                        } else { // Radio fallback
                            const nextRadios = Array.from(nextCell.querySelectorAll('input[type="radio"]')); // Radio array mapped
                            if (nextRadios.length > 0) { // Safety validate
                                const toFocus = nextRadios.find(r => r.checked) || nextRadios[0]; // Intelligent fallback system
                                if (toFocus) toFocus.focus(); // Fire
                            } // End
                        } // End
                    } // End
                    // If target was a checkbox, find the checkbox with the same label // Comment logic handler
                    else if (target.type === 'checkbox') { // Checkbox processing logic
                        const isLate = target.nextElementSibling && target.nextElementSibling.innerText.includes('Late'); // Isolate which specific column the user was traversing down
                        const nextCheckboxes = Array.from(nextCell.querySelectorAll('input[type="checkbox"]')); // Get array of target boxes
                        for (let cb of nextCheckboxes) { // Loop them
                            if (cb.nextElementSibling && cb.nextElementSibling.innerText.includes(isLate ? 'Late' : 'Custom')) { // Compare the sister element text to guarantee identical column behavior mapping
                                cb.focus(); // Fire execution context
                                break; // Break out of iterative search immediately for speed
                            } // Check end
                        } // Loop end
                    } // Block end
                } // Cell existence block end
            } // Row bounds block end
        } // Restrict block end
    } // Keys block end
}); // Global listener end

// --- PRINTING LOGIC --- // Comment header
function printClassRoster() { // Draw printable black and white DOM override for hard copies
    let printDiv = document.getElementById('print-area'); // Locate placeholder
    if (!printDiv) { // Ensure exists
        printDiv = document.createElement('div'); // Create div
        printDiv.id = 'print-area'; // Configure div ID
        document.body.appendChild(printDiv); // Embed div
    } // Validate check end
    
    const mondayStr = unitsData[activeUnitIndex]; // Get unit offset string
    let dateHeaders = `<th style="border: 1px solid black; padding: 8px; text-align: left; font-weight: bold; background-color: #f2f2f2;">Date</th>`; // HTML
    let lessonHeaders = `<th style="border: 1px solid black; padding: 8px; text-align: left; font-weight: bold; background-color: #f2f2f2;">Lesson</th>`; // HTML
    
    [0, 1, 2, 3, 4].forEach(i => { // 5-day cycle
        let d = getSafeMonday(mondayStr); // Calculate based off string
        d.setDate(d.getDate() + i); // Shift mathematically
        let fullDateName = d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' }); // Local string formatting
        let title = (classLessonsData[activeUnitIndex] && classLessonsData[activeUnitIndex].titles) ? classLessonsData[activeUnitIndex].titles[i] : ""; // Title
        
        dateHeaders += `<th style="border: 1px solid black; padding: 8px; text-align: left; font-weight: bold;">${fullDateName}</th>`; // Append
        lessonHeaders += `<td style="border: 1px solid black; padding: 8px; text-align: left; font-weight: bold;">${title}</td>`; // Append
    }); // Loop cycle end
    
    let rowsHtml = ''; // Init
    studentsData.forEach(student => { // Cycle full database
        const sMarks = (classMarksData[student.id] && classMarksData[student.id][activeUnitIndex]) || {}; // Retrieve row dict
        let studentRow = `<td style="border: 1px solid black; padding: 8px; font-weight: normal; width: 250px;">${student.name}</td>`; // Name column
        
        [0, 1, 2, 3, 4].forEach(i => { // Nested cycle mapping
            const mark = sMarks[`d${i}`] || ""; // Get specific grade
            const markText = mark === "" ? "" : `${mark}%`; // Formulate UI percentage
            const isLate = sMarks[`d${i}_late`] ? " (late)" : ""; // Extract penalty
            studentRow += `<td style="border: 1px solid black; padding: 8px; text-align: left;">${markText}${isLate}</td>`; // Merge inline string
        }); // Loop end
        
        rowsHtml += `<tr>${studentRow}</tr>`; // Combine row
    }); // Parent loop end
    
    let currentClassName = "Unknown Class"; // Fallback text
    if (currentClass) { // Strip string logic
        let parts = currentClass.split('_'); // Remove user auth split
        if (parts.length > 1) { // Size validation
            currentClassName = parts.slice(1).join('_'); // Formulate plain name
        } // Inner check end
    } // Outer check end

    printDiv.innerHTML = ` 
        <div style="margin-bottom: 20px; font-family: Arial, sans-serif;">
            <h2 style="margin-top: 0; margin-bottom: 15px; color: #333;">${currentClassName} - Class List</h2>
            <table style="border-collapse: collapse; width: 100%; max-width: 1200px; font-family: Arial, sans-serif; color: #333;">
                <thead>
                    <tr>${dateHeaders}</tr>
                    <tr>${lessonHeaders}</tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        </div> 
    `; // Massive DOM injection string with minimal styling for ink-saving pure black-and-white print layouts // Comment about styling
    
    window.print(); // Prompt native browser OS dialogue immediately
} // Final line execution wrap
//m
