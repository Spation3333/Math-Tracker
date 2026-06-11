const themeToggle = document.getElementById('theme-toggle'); // Retrieve the theme toggle switch element from the DOM by its ID
const body = document.body; // Assign the document's body element to a constant for easier access

function togglePassword(inputId) { // Define a function to toggle password visibility for a given input ID
    const password = document.getElementById(inputId); // Retrieve the password input element using the provided ID
    const toggleButton = password.nextElementSibling; // Get the next sibling element, which is the eye toggle button
    if (password.type === "password") { // Check if the input type is currently set to 'password'
        password.type = "text"; // Change the input type to 'text' to reveal the password characters
        toggleButton.textContent = "🔒"; // Change the toggle button text to a lock emoji to indicate it can be hidden
    } else { // If the input type is not 'password' (meaning it's 'text')
        password.type = "password"; // Change the input type back to 'password' to hide the characters
        toggleButton.textContent = "👁️"; // Change the toggle button text back to an eye emoji to indicate it can be revealed
    }
} // End of togglePassword function

function attachEyeToggles() { // Define a function to attach eye toggle event listeners to profile password inputs
    const toggleApp = document.getElementById('toggleProfApp'); // Retrieve the app password toggle button element
    const togglePin = document.getElementById('toggleProfPin'); // Retrieve the PIN toggle button element
    if (toggleApp) { // Check if the app password toggle button exists on the page
        toggleApp.addEventListener('click', function () { // Add a click event listener to the app password toggle button
            const input = document.getElementById('prof-apppass'); // Retrieve the app password input element
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password'; // Determine the new input type based on the current type
            input.setAttribute('type', type); // Apply the determined type to the input element
            this.textContent = type === 'password' ? '👁️' : '🔒'; // Update the toggle button text accordingly
        }); // End of app password toggle click listener
    } // End of app password toggle check
    if (togglePin) { // Check if the PIN toggle button exists on the page
        togglePin.addEventListener('click', function () { // Add a click event listener to the PIN toggle button
            const input = document.getElementById('prof-pin'); // Retrieve the PIN input element
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password'; // Determine the new input type based on the current type
            input.setAttribute('type', type); // Apply the determined type to the input element
            this.textContent = type === 'password' ? '👁️' : '🔒'; // Update the toggle button text accordingly
        }); // End of PIN toggle click listener
    } // End of PIN toggle check
} // End of attachEyeToggles function

if (localStorage.getItem('theme') === 'dark') { // Check if the saved theme in local storage is 'dark'
    body.classList.add('darkmode'); // Add the 'darkmode' class to the body to apply dark styles
    if (themeToggle) themeToggle.checked = true; // If the theme toggle element exists, set it to checked
} // End of dark mode initial check

if (themeToggle) { // Check if the theme toggle element exists on the page
    themeToggle.addEventListener('change', function () { // Add a change event listener to the theme toggle switch
        if (this.checked) { // Check if the switch is currently checked (turned on)
            body.classList.add('darkmode'); // Add the 'darkmode' class to the body element
            localStorage.setItem('theme', 'dark'); // Save 'dark' as the theme preference in local storage
        } else { // If the switch is not checked (turned off)
            body.classList.remove('darkmode'); // Remove the 'darkmode' class from the body element
            localStorage.setItem('theme', 'light'); // Save 'light' as the theme preference in local storage
        } // End of checked conditional
    }); // End of theme toggle change listener
} // End of theme toggle check

window.addEventListener('DOMContentLoaded', function () { // Add an event listener for when the HTML content is fully loaded
    if (document.getElementById('newclass')) { // Check if the 'newclass' element (class grid) exists on the page
        initializeFixedGrid(); // Call function to set up the fixed 8-slot grid structure
        updateClass(); // Call function to populate the grid with class data
    } // End of 'newclass' check
    if (document.getElementById('archive-container')) { // Check if the archive container exists (we are on archive.html)
        renderArchives(); // Call function to render archived classes
    } // End of archive container check
    if (document.getElementById('currentdate')) displayDate(); // If the current date element exists, call displayDate to show it
    attachEyeToggles(); // Call the function to set up password visibility toggles for the profile modal
}); // End of DOMContentLoaded listener

function displayDate() { // Define a function to display the current date in a specific format
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }; // Define the formatting options for the date string
    document.getElementById('currentdate').textContent = new Date().toLocaleDateString('en-US', options); // Set the text content of the date element to the formatted current date
} // End of displayDate function

const currentUser = JSON.parse(localStorage.getItem('currentUser')); // Retrieve and parse the current user data from local storage

// Redirect to index if not logged in and trying to access protected pages
if (!currentUser && (window.location.pathname.includes('select.html') || window.location.pathname.includes('archive.html'))) { // Check if there is no current user and the path is a protected page
    window.location.href = 'index.html'; // Redirect the browser to the login page
} // End of redirect check

// PROFILE SETUP
window.addEventListener('DOMContentLoaded', function () { // Add another DOMContentLoaded listener for profile-specific setup
    if (currentUser) { // Check if there is an active current user session
        if (document.getElementById('welcome-header')) { // Check if the welcome header element exists on the page
            document.getElementById('welcome-header').textContent = `Welcome ${currentUser.firstName} ${currentUser.lastName}!`; // Set the welcome text using the user's name
        } // End of welcome header check
        if (document.getElementById('profile-name')) { // Check if the profile name display element exists
            document.getElementById('profile-name').textContent = `${currentUser.firstName} ${currentUser.lastName}`; // Set the profile name display
            document.getElementById('profile-email').textContent = currentUser.email; // Set the profile email display
        } // End of profile name check
    } // End of current user check
}); // End of profile setup listener

function openProfileModal() { // Define a function to open and populate the profile editing modal
    document.getElementById('prof-fname').value = currentUser.firstName; // Fill the first name input with the user's data
    document.getElementById('prof-lname').value = currentUser.lastName; // Fill the last name input with the user's data
    document.getElementById('prof-email').value = currentUser.email; // Fill the email input with the user's data
    document.getElementById('prof-apppass').value = currentUser.appPassword || ''; // Fill the app password input with the user's data, or empty if none
    document.getElementById('prof-pin').value = ''; // Clear the PIN input field for security

    document.getElementById('prof-apppass').setAttribute('type', 'password'); // Ensure the app password input is obscured
    document.getElementById('prof-pin').setAttribute('type', 'password'); // Ensure the PIN input is obscured
    if (document.getElementById('toggleProfApp')) document.getElementById('toggleProfApp').textContent = '👁️'; // Reset app pass toggle to eye icon
    if (document.getElementById('toggleProfPin')) document.getElementById('toggleProfPin').textContent = '👁️'; // Reset PIN toggle to eye icon

    document.getElementById('profile-modal').style.display = 'flex'; // Make the profile modal visible
} // End of openProfileModal function

function closeProfileModal() { // Define a function to close the profile modal
    document.getElementById('profile-modal').style.display = 'none'; // Hide the profile modal
} // End of closeProfileModal function

async function saveProfile() { // Define an asynchronous function to save profile changes
    const pin = document.getElementById('prof-pin').value; // Get the entered PIN
    if (pin !== currentUser.pin) return alert("Incorrect PIN! Cannot save changes."); // Verify the PIN matches the current user's PIN before allowing changes

    const newFname = document.getElementById('prof-fname').value.trim(); // Get and trim the new first name
    const newLname = document.getElementById('prof-lname').value.trim(); // Get and trim the new last name
    const newEmail = document.getElementById('prof-email').value.trim().toLowerCase(); // Get, trim, and lowercase the new email
    const newAppPass = document.getElementById('prof-apppass').value.trim(); // Get and trim the new app password

    if (!newFname || !newLname || !newEmail || !newAppPass) return alert("All fields are required."); // Ensure no fields are left blank

    const users = JSON.parse(localStorage.getItem('mathTrackUsers')) || {}; // Fetch the user database from local storage

    if (newEmail !== currentUser.email && users[newEmail]) return alert("Email already in use!"); // Check if the new email is already taken by another account

    const oldEmail = currentUser.email; // Store the original email for reference during updates

    if (newEmail !== oldEmail) { // Check if the user is changing their email address
        try { // Start a try-catch block for the database migration API call
            await fetch('http://localhost:3000/api/migrate-email', { // Send a PUT request to the local server to update the email in the DB
                method: 'PUT', // Use the PUT HTTP method
                headers: { 'Content-Type': 'application/json' }, // Specify JSON content type
                body: JSON.stringify({ oldEmail, newEmail }) // Send the old and new emails in the request body
            }); // End of fetch call
        } catch (e) { console.error("DB Migration Error", e); } // Catch and log any errors during the database migration

        const keysToMigrate = []; // Initialize an array to track local storage keys that need updating
        for (let i = 0; i < localStorage.length; i++) { // Loop through all local storage keys
            const key = localStorage.key(i); // Get the key at the current index
            if (key && key.includes(oldEmail)) keysToMigrate.push(key); // If the key contains the old email, add it to the migration list
        } // End of local storage key loop
        keysToMigrate.forEach(key => { // Iterate over the keys marked for migration
            const newKey = key.replace(oldEmail, newEmail); // Create the new key by replacing the old email with the new one
            localStorage.setItem(newKey, localStorage.getItem(key)); // Save the data under the new key
            localStorage.removeItem(key); // Delete the old key to prevent duplicates
        }); // End of keys migration loop
    } // End of email change check

    delete users[oldEmail]; // Remove the old user record from the local users database
    const updatedUser = { firstName: newFname, lastName: newLname, email: newEmail, appPassword: newAppPass, pin: currentUser.pin }; // Construct the updated user object
    users[newEmail] = updatedUser; // Add the updated user object to the database using the new email as the key

    localStorage.setItem('mathTrackUsers', JSON.stringify(users)); // Save the updated users database back to local storage
    localStorage.setItem('currentUser', JSON.stringify(updatedUser)); // Update the current active session data

    alert("Profile updated successfully!"); // Alert the user of success
    window.location.reload(); // Reload the page to apply changes everywhere
} // End of saveProfile function

async function deleteAccount() { // Define an asynchronous function to delete the user account
    const pin = document.getElementById('prof-pin').value; // Get the entered PIN
    if (!pin) return alert("Please enter your PIN to authorize account deletion."); // Ensure a PIN was entered
    if (pin !== currentUser.pin) return alert("Incorrect PIN! Cannot delete account."); // Verify the PIN is correct

    if (confirm("WARNING: Are you absolutely sure you want to delete your account? This will permanently erase all your classes, students, and grades. This action CANNOT be undone.")) { // Prompt the user for final confirmation

        const email = currentUser.email; // Get the user's email
        const users = JSON.parse(localStorage.getItem('mathTrackUsers')) || {}; // Fetch the users database

        const storageKey = `savedClasses_${email}`; // Determine the local storage key for active classes
        const archiveKey = `archivedClasses_${email}`; // Determine the local storage key for archived classes

        const userClasses = JSON.parse(localStorage.getItem(storageKey)) || []; // Fetch the user's active classes
        const archivedClasses = JSON.parse(localStorage.getItem(archiveKey)) || []; // Fetch the user's archived classes

        const allClasses = [...userClasses, ...archivedClasses].filter(c => c !== null); // Combine all classes and remove any null slots

        for (let i = 0; i < allClasses.length; i++) { // Loop through all the user's classes
            const uniqueDbClassName = email + "_" + allClasses[i].name; // Construct the unique database identifier for the class
            try { // Start try-catch block for API call
                await fetch(`http://localhost:3000/api/delete-class/${encodeURIComponent(uniqueDbClassName)}`, { method: 'DELETE' }); // Send DELETE request to server
            } catch (e) { // Catch any errors
                console.error("Error deleting class from database:", e); // Log the error to console
            } // End of try-catch block
        } // End of class deletion loop

        const keysToDelete = []; // Initialize array for keys to delete from local storage
        for (let i = 0; i < localStorage.length; i++) { // Loop through all local storage keys
            const key = localStorage.key(i); // Get key at current index
            if (key && key.includes(email)) { // If key belongs to user
                keysToDelete.push(key); // Add to deletion list
            } // End of key ownership check
        } // End of local storage key loop
        keysToDelete.forEach(k => localStorage.removeItem(k)); // Delete all associated keys from local storage

        delete users[email]; // Remove user from the local users database
        localStorage.setItem('mathTrackUsers', JSON.stringify(users)); // Save updated users database
        localStorage.removeItem('currentUser'); // Clear the active session

        alert("Account permanently deleted."); // Alert user of success
        window.location.href = 'index.html'; // Redirect to login page
    } // End of confirmation block
} // End of deleteAccount function

const storageKey = currentUser ? `savedClasses_${currentUser.email}` : 'savedClasses'; // Determine storage key for active classes based on user
const archiveKey = currentUser ? `archivedClasses_${currentUser.email}` : 'archivedClasses'; // Determine storage key for archived classes based on user
let archivedData = JSON.parse(localStorage.getItem(archiveKey)) || []; // Retrieve and parse archived classes data, defaulting to an empty array

function initializeFixedGrid() { // Function to ensure the active classes array is exactly 8 slots
    let loadedData = JSON.parse(localStorage.getItem(storageKey)); // Load active classes data
    if (!Array.isArray(loadedData) || loadedData.length !== 8) { // Check if the data is not an array or doesn't have 8 slots
        let fixedArray = new Array(8).fill(null); // Create a new array with 8 null slots
        if (Array.isArray(loadedData)) { // If the loaded data was at least an array
            for (let i = 0; i < loadedData.length && i < 8; i++) { // Loop through up to 8 existing items
                fixedArray[i] = loadedData[i]; // Copy existing items into the fixed array
            } // End of copy loop
        } // End of array check
        localStorage.setItem(storageKey, JSON.stringify(fixedArray)); // Save the corrected array to local storage
    } // End of structure validation
} // End of initializeFixedGrid function

function getClassData() { // Function to safely retrieve the active classes data
    return JSON.parse(localStorage.getItem(storageKey)) || new Array(8).fill(null); // Return parsed data or a fresh 8-slot array if empty
} // End of getClassData function

let dragStart; // Variable to hold drag start information (unused in final code but kept for completeness)
let dragStartIndex; // Variable to track which slot is currently being dragged

function toggleCustomColor(type) { // Function to toggle the display of the custom color picker
    const select = document.getElementById(`${type}-color-select`); // Get the color dropdown element
    const custom = document.getElementById(`${type}-color-custom`); // Get the custom color input element
    if (select.value === 'custom') { // Check if 'custom' is selected
        custom.style.display = 'inline-block'; // Show the color picker
        custom.click(); // Programmatically click it to open the dialog
    } else { // If a preset color is selected
        custom.style.display = 'none'; // Hide the color picker
    } // End of selection check
} // End of toggleCustomColor function

function getFinalColor(type) { // Function to get the final chosen color (preset or custom)
    const select = document.getElementById(`${type}-color-select`); // Get the color dropdown element
    const custom = document.getElementById(`${type}-color-custom`); // Get the custom color input element
    return select.value === 'custom' ? custom.value : select.value; // Return custom value if 'custom' is selected, else return preset
} // End of getFinalColor function

function setDropdownColor(type, savedColor) { // Function to visually update the dropdowns when loading a class
    const select = document.getElementById(`${type}-color-select`); // Get the color dropdown element
    const custom = document.getElementById(`${type}-color-custom`); // Get the custom color input element
    let matchedOption = false; // Flag to track if the color matches a preset
    for (let i = 0; i < select.options.length; i++) { // Loop through all dropdown options
        if (select.options[i].value === savedColor) { // Check if option matches saved color
            select.selectedIndex = i; // Select the matching option
            matchedOption = true; // Set flag to true
            break; // Exit loop
        } // End of match check
    } // End of options loop
    if (matchedOption) { // If a preset matched
        custom.style.display = 'none'; // Hide the custom picker
    } else { // If no preset matched
        select.value = 'custom'; // Set dropdown to 'custom'
        custom.value = savedColor || (type === 'bg' ? '#ffffff' : '#000000'); // Set custom picker value to the saved color or default
        custom.style.display = 'inline-block'; // Show the custom picker
    } // End of match conditional
} // End of setDropdownColor function

function openClass(editIndex) { // Function to open the class creation/editing modal
    const modal = document.getElementById('modal'); // Get the modal element
    const title = document.getElementById('modalheader'); // Get the modal title element
    const indexTracker = document.getElementById('edit-index'); // Get the hidden input tracking the slot index
    modal.style.display = 'flex'; // Show the modal

    let classData = getClassData(); // Get current active classes data
    indexTracker.value = editIndex; // Set the hidden input to the clicked slot index

    if (classData[editIndex] !== null) { // If editing an existing class
        title.textContent = "Edit Class"; // Update modal title
        document.getElementById('classname').value = classData[editIndex].name; // Populate name field
        document.getElementById('font-family').value = classData[editIndex].font || "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"; // Populate font field
        setDropdownColor('bg', classData[editIndex].bgColor); // Set background color dropdowns
        setDropdownColor('text', classData[editIndex].textColor); // Set text color dropdowns
    } else { // If creating a new class in an empty slot
        title.textContent = "Create New Class"; // Update modal title
        document.getElementById('classname').value = ""; // Clear name field
        document.getElementById('font-family').selectedIndex = 0; // Reset font dropdown
        setDropdownColor('bg', '#f9f9f9'); // Reset background color
        setDropdownColor('text', '#000000'); // Reset text color
    } // End of existing class check
} // End of openClass function

function closeClass() { // Function to close the class creation/editing modal
    document.getElementById('modal').style.display = 'none'; // Hide the modal
} // End of closeClass function

function saveClass() { // Function to save changes made in the class modal
    const name = document.getElementById('classname').value; // Get the entered class name
    const font = document.getElementById('font-family').value; // Get the selected font
    const bgColor = getFinalColor('bg'); // Get the final background color
    const textColor = getFinalColor('text'); // Get the final text color
    const editIndex = parseInt(document.getElementById('edit-index').value); // Get the index of the slot being edited

    let classData = getClassData(); // Fetch current active classes array

    const currentStudents = classData[editIndex] !== null ? classData[editIndex].students : 0; // Preserve student count if editing, or set to 0 if new
    const currentEval = classData[editIndex] !== null ? classData[editIndex].eval : ""; // Preserve eval date if editing, or set empty if new

    const newClass = { // Create the new class object
        name: name, // Assign name
        students: currentStudents, // Assign student count
        eval: currentEval, // Assign eval date
        font: font, // Assign font
        bgColor: bgColor, // Assign background color
        textColor: textColor // Assign text color
    }; // End of new class object definition

    classData[editIndex] = newClass; // Place the new class object into the specific slot index
    localStorage.setItem(storageKey, JSON.stringify(classData)); // Save updated array to local storage

    closeClass(); // Close the modal
    updateClass(); // Re-render the grid
} // End of saveClass function

function deleteClass(index) { // Function to archive an active class
    if (confirm("Archive this class? (You can recover it later from the Archived Classes page)")) { // Ask for confirmation to archive
        let classData = getClassData(); // Get active classes
        const archiveKey = currentUser ? `archivedClasses_${currentUser.email}` : 'archivedClasses'; // Determine archive key
        let archivedData = JSON.parse(localStorage.getItem(archiveKey)) || []; // Fetch archived classes

        let archivedObj = classData[index]; // Get the class being archived
        archivedObj.originalIndex = index; // Store its original grid index so it can be recovered to the same spot
        archivedData.push(archivedObj); // Add it to the archive array
        localStorage.setItem(archiveKey, JSON.stringify(archivedData)); // Save updated archive array

        classData[index] = null; // Remove the class from the active grid by setting slot to null
        localStorage.setItem(storageKey, JSON.stringify(classData)); // Save updated active classes array

        updateClass(); // Re-render the grid
    } // End of confirmation block
} // End of deleteClass function

function getCurrentWeekLessonTitle(uniqueDbClassName) { // Function to calculate the current week's lesson title
    const unitsKey = `units_${uniqueDbClassName}`; // Key for the class units
    const lessonsKey = `lessons_${uniqueDbClassName}`; // Key for the class lessons

    const unitsStr = localStorage.getItem(unitsKey); // Fetch units data
    const lessonsStr = localStorage.getItem(lessonsKey); // Fetch lessons data

    if (!unitsStr || !lessonsStr) return "N/A"; // Return N/A if missing data

    const units = JSON.parse(unitsStr); // Parse units
    const lessons = JSON.parse(lessonsStr); // Parse lessons

    const today = new Date(); // Get current date
    today.setHours(12, 0, 0, 0); // Normalize time to noon to avoid timezone issues

    for (let i = units.length - 1; i >= 0; i--) { // Loop through units backwards to find the most recent
        let mondayParts = units[i].split('-'); // Split the unit date string
        if (mondayParts.length === 3) { // Ensure it split correctly
            let mondayDate = new Date(mondayParts[0], mondayParts[1] - 1, mondayParts[2], 12, 0, 0); // Reconstruct date

            if (today >= mondayDate) { // Check if the current date has reached or passed this unit's Monday
                const diffTime = Math.abs(today - mondayDate); // Calculate time difference
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // Convert to days

                if (diffDays >= 0 && diffDays <= 4) { // Ensure it's a weekday (0=Mon, 4=Fri)
                    if (lessons[i] && lessons[i].titles && lessons[i].titles[diffDays]) { // Ensure the lesson title exists
                        return lessons[i].titles[diffDays]; // Return the specific title
                    } // End of title check
                } // End of weekday check
                break; // Stop looking once the correct week is found
            } // End of date comparison
        } // End of part length check
    } // End of units loop
    return "N/A"; // Return N/A if no current lesson was found
} // End of getCurrentWeekLessonTitle function

function updateClass() { // Function to render the active classes grid
    const grid = document.getElementById('newclass'); // Get the grid container
    if (!grid) return; // Exit if not on the select.html page
    grid.innerHTML = ''; // Clear current grid contents

    let classData = getClassData(); // Fetch active class data

    for (let i = 0; i < 8; i++) { // Loop exactly 8 times to render the fixed grid
        const wrapper = document.createElement('div'); // Create wrapper div for the slot
        wrapper.className = 'cardwrapper'; // Assign class name

        wrapper.addEventListener('dragover', function (e) { e.preventDefault(); }); // Allow dropping on this slot
        wrapper.addEventListener('dragenter', function (e) { e.preventDefault(); this.classList.add('drag-over'); }); // Visual feedback on drag enter
        wrapper.addEventListener('dragleave', function () { this.classList.remove('drag-over'); }); // Remove visual feedback on drag leave
        wrapper.addEventListener('drop', function () { // Handle drop event
            this.classList.remove('drag-over'); // Remove visual feedback
            let data = getClassData(); // Fetch latest class data
            const draggedItem = data[dragStartIndex]; // Get the item that was dragged
            data[dragStartIndex] = data[i]; // Swap dragged item's original slot with target slot's content
            data[i] = draggedItem; // Put dragged item into target slot
            localStorage.setItem(storageKey, JSON.stringify(data)); // Save updated array
            updateClass(); // Re-render grid
        }); // End of drop listener

        const letter = document.createElement('div'); // Create letter element (A, B, C, etc.)
        letter.className = 'cardletter'; // Assign class
        letter.textContent = String.fromCharCode(65 + (i % 4)); // Calculate letter based on column index
        wrapper.appendChild(letter); // Add letter to wrapper

        if (classData[i] !== null) { // If there is a class in this slot
            wrapper.draggable = true; // Make the wrapper draggable
            wrapper.addEventListener('dragstart', function () { dragStartIndex = i; this.classList.add('dragging'); }); // Set start index on drag
            wrapper.addEventListener('dragend', function () { this.classList.remove('dragging'); }); // Clean up on drag end

            const card = document.createElement('div'); // Create the class card
            card.className = 'classcard'; // Assign class
            card.style.backgroundColor = classData[i].bgColor || '#f9f9f9'; // Set custom background color

            const countId = `student-count-${i}`; // Generate unique ID for student count
            const uniqueDbClassName = currentUser.email + "_" + classData[i].name; // Generate database class name
            const todaysLessonTitle = getCurrentWeekLessonTitle(uniqueDbClassName); // Get today's lesson title

            let evalText = "N/A"; // Initialize eval text
            if (classData[i].eval) { // If an eval date exists
                let eDate = new Date(classData[i].eval); // Parse date
                if (!isNaN(eDate)) { // Verify it's valid
                    let today = new Date(); // Get today's date
                    today.setHours(0, 0, 0, 0); // Normalize time

                    if (eDate.getFullYear() < today.getFullYear() - 5) { // Handle old invalid years
                        eDate.setFullYear(today.getFullYear()); // Snap to current year
                    } // End of old year fix

                    eDate.setHours(0, 0, 0, 0); // Normalize eval time

                    if (eDate < today && (today - eDate) > (1000 * 60 * 60 * 24 * 30)) { // If past and older than 30 days
                        eDate.setFullYear(today.getFullYear() + 1); // Assume it's for next year
                    } // End of past year fix

                    let diffTime = eDate.getTime() - today.getTime(); // Calculate difference in milliseconds
                    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert to days

                    if (diffDays === 0) evalText = "Today"; // Display 'Today'
                    else if (diffDays === 1) evalText = "1 day"; // Display singular day
                    else if (diffDays > 1) evalText = diffDays + " days"; // Display plural days
                    else evalText = "Past"; // Display 'Past' if overdue
                } else { // If date was unparseable string
                    evalText = classData[i].eval; // Just display the string
                } // End of valid date check
            } // End of eval presence check

            card.innerHTML = `
                <button class="buttons cardedit" onclick="event.stopPropagation(); openClass(${i})">✎</button>
                <button class="buttons carddelete" onclick="event.stopPropagation(); deleteClass(${i})">🗑️</button>
               
                <div onclick="window.location.href='studentList.html?class=${encodeURIComponent(uniqueDbClassName)}'"
                     style="cursor: pointer; padding-top: 10px; font-family: ${classData[i].font};">
                    <div class="class-title" style="color: ${classData[i].textColor || 'rgb(139, 107, 35)'};">${classData[i].name}</div>
                   
                    <p style="color: ${classData[i].textColor || 'black'};">Students: <span id="${countId}" style="font-weight:normal">Loading...</span></p>
                    <p style="color: ${classData[i].textColor || 'black'};">Lesson: <span style="font-weight:normal">${todaysLessonTitle}</span></p>
                    <p style="color: ${classData[i].textColor || 'black'};">Next Eval: <span style="font-weight:normal">${evalText}</span></p>
                </div>
            `; // Build the HTML structure for the card, injecting dynamic data

            wrapper.appendChild(card); // Add card to wrapper
            grid.appendChild(wrapper); // Add wrapper to grid

            fetch(`http://localhost:3000/api/data/${encodeURIComponent(uniqueDbClassName)}`) // Fetch actual student count from server
                .then(res => res.json()) // Parse JSON response
                .then(data => { // Handle data
                    const actualCount = (data.data) ? data.data.length : 0; // Calculate count
                    document.getElementById(countId).textContent = actualCount; // Update UI

                    let memoryData = getClassData(); // Fetch active classes
                    if (memoryData[i] !== null) { // Ensure class still exists in slot
                        memoryData[i].students = actualCount; // Update count in memory
                        localStorage.setItem(storageKey, JSON.stringify(memoryData)); // Save to local storage
                    } // End of memory update
                }) // End of fetch then
                .catch(err => { // Catch network errors
                    document.getElementById(countId).textContent = "Server Offline"; // Show error state
                }); // End of fetch catch
        } // End of class presence check
        else { // If slot is empty
            const addBox = document.createElement('div'); // Create placeholder box
            addBox.className = 'addbox'; // Assign class
            addBox.textContent = '+'; // Set content to plus sign
            addBox.onclick = function () { openClass(i); }; // Open modal on click, passing the slot index
            wrapper.appendChild(addBox); // Add placeholder to wrapper
            grid.appendChild(wrapper); // Add wrapper to grid
        } // End of empty slot logic
    } // End of grid loop
} // End of updateClass function

function renderArchives() { // Function to render the archived classes grid
    const grid = document.getElementById('archive-container'); // Get the archive grid container element
    if (!grid) return; // Exit if we aren't on the archive page
    grid.innerHTML = ''; // Clear out any existing HTML in the grid

    if (archivedData.length === 0) { // Check if there are no archived classes
        grid.innerHTML = '<p style="color: var(--text-color, #333); font-size: 1.2em; grid-column: 1/-1; text-align: center; margin-top: 50px;">No archived classes found.</p>'; // Display a message if empty
        return; // Exit the function early
    } // End of empty check

    for (let i = 0; i < archivedData.length; i++) { // Loop through all classes in the archivedData array
        const cls = archivedData[i]; // Get the current archived class object
        if (!cls) continue; // Skip to next iteration if the object is null or undefined

        const wrapper = document.createElement('div'); // Create a wrapper div for the card
        wrapper.className = 'cardwrapper'; // Assign the cardwrapper CSS class

        const letter = document.createElement('div'); // Create a div for the letter indicator
        letter.className = 'cardletter'; // Assign the cardletter CSS class
        letter.textContent = cls.originalIndex !== undefined ? String.fromCharCode(65 + (cls.originalIndex % 4)) : '?'; // Calculate and set the original letter based on its old index, or '?' if missing

        const card = document.createElement('div'); // Create the main card div
        card.className = 'classcard'; // Assign the classcard CSS class
        card.style.backgroundColor = cls.bgColor || '#f9f9f9'; // Apply the class's saved background color
        card.style.opacity = '0.75'; // Reduce opacity to visually indicate it is archived

        card.innerHTML = `
            <button class="buttons cardedit cardrecover" title="Recover Class" onclick="event.stopPropagation(); recoverClass(${i})">↩</button>
            <button class="buttons carddelete cardpermadelete" title="Permanently Delete" onclick="event.stopPropagation(); permanentDelete(${i})">🗑️</button>
           
            <div style="padding-top: 10px; font-family: ${cls.font || 'inherit'}; text-align: center;">
                <div class="class-title" style="color: ${cls.textColor || 'rgb(139, 107, 35)'};">${cls.name}</div>
               
                <p style="color: ${cls.textColor || 'black'}; margin-top: 15px;">Students: <span style="font-weight:normal">${cls.students || 0}</span></p>
                <p style="color: ${cls.textColor || 'black'};">Status: <span style="font-weight:bold; color: #e67e22;">Archived</span></p>
            </div>
        `; // Inject the HTML structure for the archived card, including recover and delete buttons

        wrapper.appendChild(letter); // Append the letter indicator to the wrapper
        wrapper.appendChild(card); // Append the card itself to the wrapper
        grid.appendChild(wrapper); // Finally, append the entire wrapper to the main grid container
    } // End of loop over archived classes
} // End of renderArchives function

function recoverClass(index) { // Function to move a class from the archive back to active duty
    let classData = JSON.parse(localStorage.getItem(storageKey)); // Fetch the current active classes array

    if (!Array.isArray(classData) || classData.length !== 8) { // Safety check to ensure the active array is valid
        classData = new Array(8).fill(null); // Reinitialize to 8 nulls if corrupt
    } // End of safety check

    let recoveredClass = archivedData[index]; // Get the specific class object being recovered from the archive array
    let targetIndex = recoveredClass.originalIndex; // Retrieve its originally assigned slot index

    if (targetIndex !== undefined && classData[targetIndex] === null) { // Check if the original slot is still empty
        classData[targetIndex] = recoveredClass; // If so, place it directly back into its original home
    } else { // If the original slot is occupied or missing
        let foundSlot = false; // Flag to track if we found a new home for it
        for (let j = 0; j < 8; j++) { // Loop through all 8 active slots
            if (classData[j] === null) { // Look for the first empty slot
                classData[j] = recoveredClass; // Place the class into the empty slot
                foundSlot = true; // Mark that we succeeded
                break; // Stop looking
            } // End of empty slot check
        } // End of 8-slot loop
        if (!foundSlot) { // If we finished looping and never found an empty slot
            alert("Your active roster is full (Max 8 slots). Please archive or delete an active class before recovering this one."); // Warn the user
            return; // Abort the recovery process
        } // End of full roster check
    } // End of placement logic

    archivedData.splice(index, 1); // Remove the class from the local archivedData array
    localStorage.setItem(archiveKey, JSON.stringify(archivedData)); // Save the updated archive array back to local storage
    localStorage.setItem(storageKey, JSON.stringify(classData)); // Save the updated active array back to local storage

    renderArchives(); // Re-render the archive grid to reflect the change
    alert("Class recovered successfully! It is now visible on your Select Class screen."); // Notify the user of success
} // End of recoverClass function

async function permanentDelete(index) { // Function to permanently erase a class and all its data
    if (confirm("WARNING: Are you absolutely sure you want to permanently delete this class? ALL student data, marks, and lessons will be erased. This CANNOT be undone.")) { // Final warning to the user
        const uniqueDbClassName = currentUser.email + "_" + archivedData[index].name; // Construct the unique database ID for the class

        try { // Begin try-catch block for API call
            await fetch(`http://localhost:3000/api/delete-class/${encodeURIComponent(uniqueDbClassName)}`, { method: 'DELETE' }); // Tell the backend server to purge the class data

            localStorage.removeItem(`units_${uniqueDbClassName}`); // Remove locally stored unit data
            localStorage.removeItem(`lessons_${uniqueDbClassName}`); // Remove locally stored lesson data
            localStorage.removeItem(`marks_${uniqueDbClassName}`); // Remove locally stored marks data
            localStorage.removeItem(`studentOrder_${uniqueDbClassName}`); // Remove locally stored custom ordering
            localStorage.removeItem(`emailTemplate_${uniqueDbClassName}`); // Remove locally stored email template

            archivedData.splice(index, 1); // Remove the class from the local archivedData array
            localStorage.setItem(archiveKey, JSON.stringify(archivedData)); // Save the updated archive array

            renderArchives(); // Re-render the UI
        } catch (e) { // If the fetch fails
            alert("Failed to permanently delete class information from server."); // Alert the user of the failure
        } // End of try-catch
    } // End of confirmation block
} // End of permanentDelete function