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
    } // End of block
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
                <button class="btn cardedit" onclick="event.stopPropagation(); openClass(${i})">✎</button> 
                <button class="btn carddelete" onclick="event.stopPropagation(); deleteClass(${i})">🗑️</button> 
               
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
            <button class="btn cardedit cardrecover" title="Recover Class" onclick="event.stopPropagation(); recoverClass(${i})">↩</button>
            <button class="btn carddelete cardpermadelete" title="Permanently Delete" onclick="event.stopPropagation(); permanentDelete(${i})">🗑️</button>
           
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

// --- REWRITE.HTML SCRIPTING ---

function formatClassName(className) { // Formats the class name by stripping the email prefix before the underscore
    if (!className) return ''; // Return empty string if no class name is provided
    const underscoreIndex = className.indexOf('_'); // Find the position of the first underscore
    if (underscoreIndex !== -1) { // If an underscore exists in the string
        return className.substring(underscoreIndex + 1); // Return everything after the underscore
    } // End of if statement
    return className; // Return the original name if no underscore was found
} // End of formatClassName function

function formatDate(dateString) { // Formats the date string into a human-readable format
    if (!dateString) return ''; // Return empty string if no date is provided
    const date = new Date(dateString); // Create a new Date object from the string
    if (isNaN(date.getTime())) return dateString; // Return original string if the date is invalid
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); // Format as Month Day, Year
} // End of formatDate function

function renderRewriteList() { // Renders the rewrite list from localStorage onto the page
    const container = document.getElementById('rewrite-list-container'); // Get the container element for the list
    if (!container) return; // Exit if the container does not exist on the current page
    const rewriteList = JSON.parse(localStorage.getItem('rewriteList') || '[]'); // Read and parse the rewrite list from localStorage

    const clearButtons = document.getElementById('btn-clear-all'); // Get the static clear button
    if (clearButtons) clearButtons.style.display = rewriteList.length > 0 ? 'block' : 'none'; // Show clear button if list is not empty

    if (rewriteList.length === 0) { // If the rewrite list is empty
        container.innerHTML = '<p style="text-align: center; color: var(--text-color, #888); font-size: 1.1em; margin-top: 30px;">No students on the rewrite list.</p>'; // Show empty message
        return; // Stop rendering
    } // End of empty list check

    const searchInput = document.getElementById('rewrite-search'); // Retrieves element from DOM
    const query = searchInput ? searchInput.value.toLowerCase().trim() : ''; // Executes code logic

    let html = ''; // Executes code logic
    html += '<table class="rewrite-table">'; // Executes code logic
    html += '<thead>'; // Executes code logic
    html += '<tr>'; // Executes code logic
    html += '<th style="width: 25%;">Student Name</th>'; // Executes code logic
    html += '<th style="width: 20%;">Class</th>'; // Executes code logic
    html += '<th style="width: 20%;">Date</th>'; // Executes code logic
    html += '<th style="width: 20%;">Test</th>'; // Executes code logic
    html += '<th style="width: 15%; text-align: center;">Action</th>'; // Executes code logic
    html += '</tr>'; // Executes code logic
    html += '</thead>'; // Executes code logic
    html += '<tbody>'; // Executes code logic

    let visibleCount = 0; // Executes code logic
    rewriteList.forEach(function (student, index) { // Defines function
        let displayStyle = ''; // Executes code logic
        if (query && !(student.name || '').toLowerCase().includes(query)) { // Conditional check
            displayStyle = 'display: none;'; // Executes code logic
        } else { // Alternative condition
            visibleCount++; // Executes code logic
        } // End of block

        html += `<tr style="${displayStyle}" draggable="true" ondragstart="handleRewriteDragStart(event, ${index})" ondragover="event.preventDefault(); this.style.backgroundColor='rgba(139,107,35,0.1)';" ondragleave="this.style.backgroundColor=''" ondrop="handleRewriteDrop(event, ${index}); this.style.backgroundColor=''" ondragend="this.style.backgroundColor=''">`; // Executes code logic
        const studentIdArg = student.studentId ? student.studentId : 'null'; // Executes code logic
        html += `<td style="cursor: pointer; color: #3498db;" onclick="openStudentMarksModal('${student.className || ''}', '${(student.name || '').replace(/'/g, "\\'")}', ${studentIdArg})"><strong>${student.name || ''}</strong></td>`; // Executes code logic
        html += `<td><input type="text" value="${student.className || ''}" onchange="updateRewriteEntry(${index}, 'className', this.value)"></td>`; // Executes code logic
        html += `<td><input type="text" value="${student.date || ''}" onchange="updateRewriteEntry(${index}, 'date', this.value)"></td>`; // Executes code logic
        html += `<td><input type="text" value="${student.test || ''}" onchange="updateRewriteEntry(${index}, 'test', this.value)"></td>`; // Executes code logic
        html += '<td style="text-align: center;">'; // Executes code logic
        html += `<button class="btn-rewrite-delete" onclick="removeFromRewriteList(${index})">Delete</button>`; // Executes code logic
        html += '</td>'; // Executes code logic
        html += '</tr>'; // Executes code logic
    }); // Executes code logic

    html += '</tbody>'; // Executes code logic
    html += '</table>'; // Executes code logic

    if (visibleCount === 0) { // Conditional check
        container.innerHTML = '<p style="text-align: center; color: var(--text-color, #888); font-size: 1.1em; margin-top: 30px;">No students match your search.</p>'; // Executes code logic
    } else { // Alternative condition
        container.innerHTML = html; // Executes code logic
    } // End of block
} // End of renderRewriteList function

function updateRewriteEntry(index, field, value) { // Updates a specific field for a student on the rewrite list
    const rewriteList = JSON.parse(localStorage.getItem('rewriteList') || '[]'); // Read current rewrite list
    if (rewriteList[index]) { // Ensure the student exists at that index
        rewriteList[index][field] = value; // Update the specified field
        localStorage.setItem('rewriteList', JSON.stringify(rewriteList)); // Save updated list
    } // End of check
} // End of updateRewriteEntry function

window.handleRewriteDragStart = function(e, originalIndex) { // Executes code logic
    e.dataTransfer.effectAllowed = 'move'; // Executes code logic
    e.dataTransfer.setData('text/plain', originalIndex); // Executes code logic
}; // Executes code logic

window.sortRewriteStudents = function() { // Executes code logic
    const sortSelect = document.getElementById('rewrite-sort'); // Retrieves element from DOM
    if (!sortSelect) return; // Conditional check
    const sortMode = sortSelect.value; // Executes code logic
    if (!sortMode) return; // Conditional check
    
    const rewriteList = JSON.parse(localStorage.getItem('rewriteList') || '[]'); // Retrieves data from local storage
    rewriteList.sort((a, b) => { // Executes code logic
        const nameA = a.name || ''; // Executes code logic
        const nameB = b.name || ''; // Executes code logic
        const partsA = nameA.split(' '); // Executes code logic
        const partsB = nameB.split(' '); // Executes code logic
        const firstA = partsA[0] || ''; // Executes code logic
        const firstB = partsB[0] || ''; // Executes code logic
        const lastA = partsA.slice(1).join(' ') || firstA; // Executes code logic
        const lastB = partsB.slice(1).join(' ') || firstB; // Executes code logic

        if (sortMode === 'first-asc') return firstA.localeCompare(firstB); // Conditional check
        if (sortMode === 'first-desc') return firstB.localeCompare(firstA); // Conditional check
        if (sortMode === 'last-asc') { // Conditional check
            let res = lastA.localeCompare(lastB); // Executes code logic
            if (res === 0) res = firstA.localeCompare(firstB); // Conditional check
            return res; // Returns value
        } // End of block
        if (sortMode === 'last-desc') { // Conditional check
            let res = lastB.localeCompare(lastA); // Executes code logic
            if (res === 0) res = firstB.localeCompare(firstA); // Conditional check
            return res; // Returns value
        } // End of block
        return 0; // Returns value
    }); // Executes code logic
    
    localStorage.setItem('rewriteList', JSON.stringify(rewriteList)); // Saves data to local storage
    renderRewriteList(); // Executes code logic
}; // Executes code logic

window.handleRewriteDrop = function(e, targetOriginalIndex) { // Executes code logic
    e.preventDefault(); // Executes code logic
    const sourceData = e.dataTransfer.getData('text/plain'); // Executes code logic
    if (!sourceData) return; // Conditional check
    const sourceOriginalIndex = parseInt(sourceData, 10); // Executes code logic
    if (isNaN(sourceOriginalIndex) || sourceOriginalIndex === targetOriginalIndex) return; // Conditional check

    const rewriteList = JSON.parse(localStorage.getItem('rewriteList') || '[]'); // Retrieves data from local storage
    const itemToMove = rewriteList.splice(sourceOriginalIndex, 1)[0]; // Executes code logic
    rewriteList.splice(targetOriginalIndex, 0, itemToMove); // Executes code logic
    
    localStorage.setItem('rewriteList', JSON.stringify(rewriteList)); // Saves data to local storage
    renderRewriteList(); // Executes code logic
}; // Executes code logic

function removeFromRewriteList(index) { // Removes a specific student from the rewrite list by index
    const rewriteList = JSON.parse(localStorage.getItem('rewriteList') || '[]'); // Read the current rewrite list from localStorage
    rewriteList.splice(index, 1); // Remove one element at the specified index
    localStorage.setItem('rewriteList', JSON.stringify(rewriteList)); // Save the updated list back to localStorage
    renderRewriteList(); // Re-render the list to reflect changes
} // End of removeFromRewriteList function

function clearRewriteList() { // Clears all students from the rewrite list
    if (confirm('Are you sure you want to clear the entire rewrite list?')) { // Prompt for confirmation before clearing
        localStorage.setItem('rewriteList', JSON.stringify([])); // Overwrite the list with an empty array in localStorage
        renderRewriteList(); // Re-render the empty list
    } // End of confirmation check
} // End of clearRewriteList function

function renderClassNavForRewrite() { // Defines renderClassNavForRewrite function
    const navBar = document.getElementById('class-nav-bar'); // Retrieves element from DOM
    if (!navBar) return; // Conditional check
    navBar.innerHTML = ''; // Executes code logic

    const currentUser = JSON.parse(localStorage.getItem('currentUser')); // Retrieves data from local storage
    if (!currentUser) return; // Conditional check
    const storageKey = `savedClasses_${currentUser.email}`; // Executes code logic
    let classData = JSON.parse(localStorage.getItem(storageKey)); // Retrieves data from local storage
    if (!Array.isArray(classData)) classData = new Array(8).fill(null); // Conditional check

    for (let i = 0; i < 8; i++) { // Starts loop
        const buttons = document.createElement('button'); // Creates new DOM element
        buttons.className = 'btn-class-nav'; // Executes code logic

        if (classData[i] !== null) { // Conditional check
            buttons.innerText = classData[i].name; // Executes code logic
            buttons.style.backgroundColor = 'var(--primary)'; // Executes code logic
            buttons.onclick = () => openRewriteStudentModal(classData[i].name, currentUser.email); // Executes code logic
        } else { // Alternative condition
            buttons.innerText = '+ Untitled'; // Executes code logic
            buttons.style.backgroundColor = '#a9a9a9'; // Executes code logic
        } // End of block
        navBar.appendChild(buttons); // Appends element to DOM
    } // End of block
} // End of block

async function openRewriteStudentModal(className, email) { // Defines openRewriteStudentModal function
    const uniqueDbClassName = email + "_" + className; // Executes code logic
    document.getElementById('rewrite-modal-title').textContent = className; // Retrieves element from DOM
    const listContainer = document.getElementById('rewrite-modal-student-list'); // Retrieves element from DOM
    listContainer.innerHTML = '<p>Loading students...</p>'; // Executes code logic
    document.getElementById('rewrite-student-modal').style.display = 'flex'; // Retrieves element from DOM

    try { // Executes code logic
        const response = await fetch(`http://localhost:3000/api/data/${encodeURIComponent(uniqueDbClassName)}`);
        const json = await response.json(); // Executes code logic
        let students = json.data || []; // Executes code logic
        
        listContainer.innerHTML = ''; // Executes code logic
        if (students.length === 0) { // Conditional check
            listContainer.innerHTML = '<p>No students found in this class.</p>'; // Executes code logic
            return; // Executes code logic
        } // End of block

        students.forEach(student => { // Executes code logic
            let row = document.createElement('div'); // Creates new DOM element
            row.style.display = 'flex'; // Executes code logic
            row.style.justifyContent = 'space-between'; // Executes code logic
            row.style.alignItems = 'center'; // Executes code logic
            row.style.borderBottom = '1px solid var(--border-color, #ccc)'; // Executes code logic
            row.style.paddingBottom = '5px'; // Executes code logic

            let nameSpan = document.createElement('span'); // Creates new DOM element
            nameSpan.textContent = student.name; // Executes code logic
            nameSpan.style.fontWeight = 'bold'; // Executes code logic
            nameSpan.style.color = 'var(--text-color, #000)'; // Executes code logic

            let addButtons = document.createElement('button'); // Creates new DOM element
            addButtons.textContent = 'add'; // Executes code logic
            addButtons.style.backgroundColor = 'rgb(212, 175, 55)'; // Executes code logic
            addButtons.style.color = 'white'; // Executes code logic
            addButtons.style.border = 'none'; // Executes code logic
            addButtons.style.borderRadius = '5px'; // Executes code logic
            addButtons.style.padding = '5px 10px'; // Executes code logic
            addButtons.style.cursor = 'pointer'; // Executes code logic
            addButtons.style.fontWeight = 'bold'; // Executes code logic
            addButtons.onclick = () => { // Executes code logic
                addToRewriteList(student.name, className, student.id); // Executes code logic
                alert(`${student.name} added to rewrite list.`); // Executes code logic
            }; // Executes code logic

            row.appendChild(nameSpan); // Appends element to DOM
            row.appendChild(addButtons); // Appends element to DOM
            listContainer.appendChild(row); // Appends element to DOM
        }); // Executes code logic

    } catch (e) { // Executes code logic
        listContainer.innerHTML = '<p style="color: red;">Error loading students.</p>'; // Executes code logic
    } // End of block
} // End of block

function closeRewriteStudentModal() { // Defines closeRewriteStudentModal function
    document.getElementById('rewrite-student-modal').style.display = 'none'; // Retrieves element from DOM
} // End of block

function addToRewriteList(studentName, className, studentId) { // Defines addToRewriteList function
    const rewriteList = JSON.parse(localStorage.getItem('rewriteList') || '[]'); // Retrieves data from local storage
    rewriteList.push({ // Executes code logic
        name: studentName, // Executes code logic
        className: className, // Executes code logic
        date: '', // Executes code logic
        test: '', // Executes code logic
        studentId: studentId // Executes code logic
    }); // Executes code logic
    localStorage.setItem('rewriteList', JSON.stringify(rewriteList)); // Saves data to local storage
    renderRewriteList(); // Executes code logic
} // End of block

async function openStudentMarksModal(className, studentName, studentId) { // Defines openStudentMarksModal function
    if (!className) { // Conditional check
        alert("This student doesn't have a valid class assigned."); // Executes code logic
        return; // Executes code logic
    } // End of block

    const currentUser = JSON.parse(localStorage.getItem('currentUser')); // Retrieves data from local storage
    if (!currentUser) return; // Conditional check
    const uniqueDbClassName = currentUser.email + "_" + className; // Executes code logic
    
    let modal = document.getElementById('student-marks-modal'); // Retrieves element from DOM
    if (!modal) { // Conditional check
        modal = document.createElement('div'); // Creates new DOM element
        modal.id = 'student-marks-modal'; // Executes code logic
        modal.className = 'modal'; // Executes code logic
        modal.innerHTML = `
            <div class="modalcontent" style="max-width: 600px; width: 100%;">
                <h2 id="student-marks-title" style="margin-top:0; color: rgb(139, 107, 35);">Marks</h2>
                <div id="student-marks-list" style="display: flex; flex-direction: column; gap: 10px; max-height: 400px; overflow-y: auto; padding-right: 10px;">
                </div>
                <div class="modalaction" style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
                    <button class="btn cancelprofile" style="border:none; border-radius:5px; padding: 10px 20px;" onclick="document.getElementById('student-marks-modal').style.display='none'">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal); // Appends element to DOM
    } // End of block
    
    document.getElementById('student-marks-title').textContent = `${studentName}'s Marks`; // Retrieves element from DOM
    const listContainer = document.getElementById('student-marks-list'); // Retrieves element from DOM
    listContainer.innerHTML = '<p style="text-align: center;">Loading marks...</p>'; // Executes code logic
    modal.style.display = 'flex'; // Executes code logic
    
    try { // Executes code logic
        if (!studentId) { // Conditional check
            const response = await fetch(`http://localhost:3000/api/data/${encodeURIComponent(uniqueDbClassName)}`);
            const json = await response.json(); // Executes code logic
            const students = json.data || []; // Executes code logic
            const found = students.find(s => s.name === studentName); // Executes code logic
            if (found) studentId = found.id; // Conditional check
        } // End of block
        
        if (!studentId) { // Conditional check
            listContainer.innerHTML = '<p style="text-align: center; color: var(--danger, red);">Student not found in the database.</p>'; // Executes code logic
            return; // Executes code logic
        } // End of block
        
        const marksData = JSON.parse(localStorage.getItem(`marks_${uniqueDbClassName}`)) || {}; // Retrieves data from local storage
        const unitsData = JSON.parse(localStorage.getItem(`units_${uniqueDbClassName}`)) || []; // Retrieves data from local storage
        const classLessonsData = JSON.parse(localStorage.getItem(`lessons_${uniqueDbClassName}`)) || {}; // Retrieves data from local storage
        
        const studentMarks = marksData[studentId] || {}; // Executes code logic
        
        if (unitsData.length === 0) { // Conditional check
            listContainer.innerHTML = '<p style="text-align: center; color: var(--text-color);">No weeks found for this class.</p>'; // Executes code logic
            return; // Executes code logic
        } // End of block
        
        listContainer.innerHTML = ''; // Executes code logic
        for (let i = 0; i < unitsData.length; i++) { // Starts loop
            const weekStr = unitsData[i]; // Executes code logic
            const weekMarks = studentMarks[i] || {}; // Executes code logic
            
            let safeDate; // Executes code logic
            if (weekStr.startsWith("Unit")) { // Conditional check
                safeDate = weekStr;  // Executes code logic
            } else { // Alternative condition
                const parts = weekStr.split('-'); // Executes code logic
                if (parts.length === 3) { // Conditional check
                    safeDate = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); // Executes code logic
                } else { // Alternative condition
                    safeDate = weekStr; // Executes code logic
                } // End of block
            } // End of block
            
            let div = document.createElement('div'); // Creates new DOM element
            div.style.border = '2px solid var(--border-color, #ccc)'; // Executes code logic
            div.style.padding = '15px'; // Executes code logic
            div.style.borderRadius = '8px'; // Executes code logic
            div.style.backgroundColor = 'var(--input-bg, #f9f9f9)'; // Executes code logic
            
            let header = document.createElement('h3'); // Creates new DOM element
            header.style.marginTop = '0'; // Executes code logic
            header.style.marginBottom = '10px'; // Executes code logic
            header.style.color = 'rgb(139, 107, 35)'; // Executes code logic
            header.textContent = `Week of ${safeDate}`; // Executes code logic
            div.appendChild(header); // Appends element to DOM
            
            const days = ['d0', 'd1', 'd2', 'd3', 'd4']; // Executes code logic
            let lessonTitles = ['Untitled', 'Untitled', 'Untitled', 'Untitled', 'Untitled']; // Executes code logic
            if (classLessonsData[i] && classLessonsData[i].titles) { // Conditional check
                lessonTitles = classLessonsData[i].titles.map(t => t.trim() === '' ? 'Untitled' : t); // Executes code logic
            } // End of block
            
            let marksHtml = '<ul style="margin:0; padding-left:20px; color: var(--text-color, #333);">'; // Executes code logic
            
            for (let j = 0; j < days.length; j++) { // Starts loop
                const markKey = days[j]; // Executes code logic
                const mark = weekMarks[markKey]; // Executes code logic
                const lessonName = lessonTitles[j]; // Executes code logic
                
                if (mark !== undefined && mark !== '') { // Conditional check
                    marksHtml += `<li style="margin-bottom: 5px;"><strong>${lessonName}:</strong> ${mark}% ${weekMarks[markKey + '_late'] ? '<span style="color:var(--danger, red); font-weight: bold;">(Late)</span>' : ''}</li>`; // Executes code logic
                } else { // Alternative condition
                    marksHtml += `<li style="margin-bottom: 5px;"><strong>${lessonName}:</strong> <span style="color: gray; font-style: italic;">No mark</span></li>`; // Executes code logic
                } // End of block
            } // End of block
            marksHtml += '</ul>'; // Executes code logic
            
            div.innerHTML += marksHtml; // Executes code logic
            listContainer.appendChild(div); // Appends element to DOM
        } // End of block
    } catch (e) { // Executes code logic
        listContainer.innerHTML = '<p style="text-align: center; color: var(--danger, red);">Error loading marks.</p>'; // Executes code logic
    } // End of block
} // End of block


// --- TEXTBOOKS.HTML SCRIPTING ---

const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:3000' : ''; // Determine the API base URL based on protocol
let coursesData = []; // Initialize array to hold courses data
let copiesData = []; // Initialize array to hold copies data
let activeTab = 'setup'; // Set the default active tab

function setCourseStatus(message, type = '') { // Sets a status message on the course setup page
    const status = document.getElementById('course-status'); // Get the status element
    if (!status) return; // Exit if the status element is not found
    status.textContent = message || ''; // Set the text content of the message
    status.className = 'status-message' + (type ? ` ${type}` : ''); // Apply the appropriate class for styling
} // End of setCourseStatus function

function showLedgerError(message) { // Displays an error message for ledger operations
    alert(message); // Show a browser alert with the message
    setCourseStatus(message, 'error'); // Also update the on-page status message
} // End of showLedgerError function

function switchTab(tabId) { // Switches the active tab on the textbooks page
    let buttons = document.getElementById('tabbuttons-' + tabId); // Get the tab button by ID
    let content = document.getElementById('tab-' + tabId); // Get the tab content by ID
    if (!buttons && !content && tabId !== 'setup') { // If the tab doesn't exist and it's not setup
        tabId = 'setup'; // Fallback to setup tab
        buttons = document.getElementById('tabbuttons-setup'); // Get setup tab button
        content = document.getElementById('tab-setup'); // Get setup tab content
    } // End of fallback check

    activeTab = tabId; // Update the global active tab variable
    document.querySelectorAll('.tab-buttons').forEach(buttons => buttons.classList.remove('active')); // Remove active class from all buttons
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active')); // Remove active class from all contents

    if (buttons) buttons.classList.add('active'); // Add active class to the clicked button
    if (content) content.classList.add('active'); // Add active class to the selected content
} // End of switchTab function

async function loadData() { // Loads all necessary data from the API
    try { // Start try block to handle potential errors
        // 1. Fetch Courses
        let res = await fetch(API_BASE + '/api/inventory/courses'); // Fetch courses from API
        let data = await res.json(); // Parse the JSON response
        coursesData = data.courses || []; // Store courses data, defaulting to empty array
        renderCourses(); // Render the courses table
        renderCourseTabs(); // Render the dynamic course tabs

        // 2. Fetch Copies
        copiesData = []; // Reset copies data array
        for (let c of coursesData) { // Loop through each course
            let cRes = await fetch(API_BASE + '/api/inventory/copies/' + c.course_code); // Fetch copies for the specific course
            let cData = await cRes.json(); // Parse the JSON response
            copiesData = copiesData.concat(cData.copies || []); // Append to the global copies array
        } // End of loop
        renderAllCourseSheets(); // Render all individual course sheets

        // 3. Fetch Liabilities
        await loadLiabilities(); // Await the loading of liabilities data

        // Restore active tab
        switchTab(activeTab); // Switch back to the previously active tab

    } catch (e) { // Catch any errors
        console.error("Failed to load data", e); // Log the error to console
    } // End of try-catch block
} // End of loadData function

async function loadLiabilities() { // Fetches liabilities from the API
    try { // Start try block
        let lRes = await fetch(API_BASE + '/api/inventory/liabilities'); // Fetch liabilities data
        let lData = await lRes.json(); // Parse the JSON response
        renderLiabilities(lData.liabilities || []); // Render the liabilities table with data
    } catch (e) { // Catch any errors
        console.error("Failed to load liabilities", e); // Log error to console
    } // End of try-catch block
} // End of loadLiabilities function

function renderCourses() { // Renders the list of courses in the setup tab
    let html = ''; // Initialize HTML string
    coursesData.forEach(c => { // Loop through all courses
        html += `
            <tr>
                <td><strong>${c.course_code}</strong></td>
                <td>${c.title || ''}</td>
                <td>${c.publisher || ''}</td>
                <td>$${(c.replacement_cost || 0).toFixed(2)}</td>
                <td>${c.total_quantity || 0}</td>
                <td><button class="btn btn-danger" onclick="deleteCourse('${c.course_code}')">Del</button></td>
            </tr>
        `; // Append row HTML for each course
    }); // End of loop
    
    const tbody = document.getElementById('courses-tbody'); // Get the table body element
    if (tbody) tbody.innerHTML = html; // Inject HTML if element exists
} // End of renderCourses function

function renderCourseTabs() { // Renders the dynamic tabs for each course
    document.querySelectorAll('.dynamic-course-tab').forEach(e => e.remove()); // Remove any existing dynamic tabs

    let tabContainer = document.getElementById('dynamic-tabs'); // Get the tab container
    let liabilitiesButtons = document.getElementById('tabbuttons-liabilities'); // Get the liabilities button
    if (!tabContainer || !liabilitiesButtons) return; // Exit if elements are missing

    coursesData.forEach(c => { // Loop through all courses
        let buttons = document.createElement('button'); // Create a new button element
        buttons.className = 'tab-buttons dynamic-course-tab'; // Add styling classes
        buttons.id = 'tabbuttons-' + c.course_code; // Set unique ID based on course code
        buttons.innerText = c.course_code; // Set button text to course code
        buttons.onclick = () => switchTab(c.course_code); // Add click event to switch tab
        tabContainer.insertBefore(buttons, liabilitiesButtons); // Insert before the liabilities tab
    }); // End of loop
} // End of renderCourseTabs function

function renderAllCourseSheets() { // Renders the spreadsheet content for all courses
    let container = document.getElementById('course-tabs-container'); // Get the main container for course sheets
    if (!container) return; // Exit if not found
    container.innerHTML = ''; // Clear existing content

    coursesData.forEach(course => { // Loop through each course
        let copies = copiesData.filter(copy => copy.course_code === course.course_code); // Filter copies for the current course

        let html = `
            <div id="tab-${course.course_code}" class="tab-content">
                <div class="header-controls">
                    <h3>${course.course_code} - ${course.title || 'Unknown Title'}</h3>
                    <button class="btn btn-success" onclick="addCopyRow('${course.course_code}')">+ Add Textbook Row</button>
                </div>
                <table class="spreadsheet" id="table-${course.course_code}">
                    <thead>
                        <tr>
                            <th style="width:15%;">Textbook Number</th>
                            <th style="width:25%;">Student Name</th>
                            <th style="width:20%;">Teacher</th>
                            <th style="width:30%;">Current Location</th>
                            <th style="width:15%;">Last Updated</th>
                            <th style="width:10%;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `; // Initialize HTML with table headers

        copies.forEach(copy => { // Loop through each copy of the course
            let rowClass = ''; // Initialize row styling class
            let loc = (copy.location_status || '').toLowerCase().trim(); // Get normalized location status
            if (loc === 'missing') rowClass = 'row-missing'; // Apply missing class
            if (loc === 'binding') rowClass = 'row-binding'; // Apply binding class
            if (loc === 'teacher') rowClass = 'row-teacher'; // Apply teacher class

            html += `
                <tr class="${rowClass}" id="row-${copy.copy_number}">
                    <td><strong>${copy.copy_number}</strong></td>
                    <td><input type="text" value="${copy.student_name || ''}" onchange="updateCopy('${copy.copy_number}', 'student_name', this.value)"></td>
                    <td><input type="text" value="${copy.teacher_name || ''}" onchange="updateCopy('${copy.copy_number}', 'teacher_name', this.value)"></td>
                    <td><input type="text" value="${copy.location_status || ''}" onchange="updateCopy('${copy.copy_number}', 'location_status', this.value)"></td>
                    <td class="last-updated-cell">${formatTimestamp(copy.last_updated)}</td>
                    <td><button class="btn btn-danger" onclick="deleteCopy('${copy.copy_number}')">Del</button></td>
                </tr>
            `; // Append row HTML for each copy
        }); // End of copies loop

        html += `
                    </tbody>
                </table>
            </div>
        `; // Close HTML structure
        container.innerHTML += html; // Inject into container
    }); // End of courses loop
} // End of renderAllCourseSheets function

function renderLiabilities(data) { // Renders the liabilities ledger
    let html = ''; // Initialize HTML string
    data.forEach(l => { // Loop through liabilities data
        let resolvedText = l.resolved ? '<span style="color:green;font-weight:bold;">PAID</span>' : '<span style="color:red;font-weight:bold;">UNPAID</span>'; // Format status text
        let actionButtons = `
            <div class="ledger-actions">
                ${l.resolved ? '' : `<button class="btn btn-success" onclick="resolveLiability(${l.id})">Mark Paid</button>`}
                <button class="btn btn-danger" onclick="deleteLiability(${l.id})">Delete</button>
            </div>
        `; // Generate action buttons

        html += `
            <tr>
                <td>${l.date_logged || ''}</td>
                <td><strong>${l.student_name || ''}</strong></td>
                <td>${l.teacher_name || ''}</td>
                <td>${l.course_code || ''}</td>
                <td>${l.copy_number || ''}</td>
                <td>$${(l.fine_amount || 0).toFixed(2)}</td>
                <td><input type="text" value="${l.outcome || ''}" onchange="updateLiabilityOutcome(${l.id}, this.value)" style="width:100%; box-sizing:border-box;"></td>
                <td>${resolvedText}</td>
                <td>${actionButtons}</td>
            </tr>
        `; // Append row HTML
    }); // End of loop
    
    const tbody = document.getElementById('liabilities-tbody'); // Get the liabilities table body
    if (tbody) tbody.innerHTML = html; // Inject HTML
} // End of renderLiabilities function

function formatTimestamp(value) { // Formats an ISO timestamp for display
    if (!value) return ''; // Return empty if no value provided
    const date = new Date(value); // Parse date
    if (Number.isNaN(date.getTime())) return value; // Return original if invalid
    return date.toLocaleString(); // Return localized string
} // End of formatTimestamp function

function getCopyRow(copy_number) { // Helper to find a specific DOM row
    return document.getElementById(`row-${copy_number}`); // Return element by ID
} // End of getCopyRow function

function getCopyTimestampCell(copy_number) { // Helper to find the timestamp cell within a row
    const row = getCopyRow(copy_number); // Get the parent row
    return row ? row.querySelector('.last-updated-cell') : null; // Query and return the child cell
} // End of getCopyTimestampCell function

// --- API Calls ---

async function addCourse() { // Sends request to add a new course
    let course_code = document.getElementById('new-course').value.trim().toUpperCase(); // Get and sanitize course code
    if (!course_code) return alert("Course Code required."); // Ensure a code is provided

    let payload = { // Construct data payload
        course_code, // Executes code logic
        title: document.getElementById('new-title').value, // Retrieves element from DOM
        publisher: document.getElementById('new-publisher').value, // Retrieves element from DOM
        replacement_cost: parseFloat(document.getElementById('new-cost').value) || 0, // Retrieves element from DOM
        total_quantity: parseInt(document.getElementById('new-qty').value) || 0 // Retrieves element from DOM
    }; // End of payload construction

    let res = await fetch(API_BASE + '/api/inventory/courses', { // Send POST request
        method: 'POST', headers: { 'Content-Type': 'application/json' }, // Executes code logic
        body: JSON.stringify(payload) // Converts object to JSON string
    }); // End of fetch

    if (!res.ok) { // Check for errors
        let errorText = 'Failed to add course.'; // Default error message
        try { // Try to parse response error
            const errorData = await res.json(); // Executes code logic
            if (errorData && errorData.error) errorText = errorData.error; // Extract server error
        } catch (_) { } // Ignore parse errors
        setCourseStatus(errorText, 'error'); // Display error
        alert(errorText); // Alert error
        return; // Halt execution
    } // End of error handling

    // Clear inputs
    document.getElementById('new-course').value = ''; // Retrieves element from DOM
    document.getElementById('new-title').value = ''; // Retrieves element from DOM
    document.getElementById('new-publisher').value = ''; // Retrieves element from DOM
    document.getElementById('new-cost').value = ''; // Retrieves element from DOM
    document.getElementById('new-qty').value = ''; // Retrieves element from DOM
    setCourseStatus(`Added ${course_code}.`, 'success'); // Show success message

    await loadData(); // Reload table data
} // End of addCourse function

async function deleteCourse(course_code) { // Sends request to delete a course
    if (!confirm(`Delete course ${course_code} AND all its textbooks?`)) return; // Require confirmation
    await fetch(API_BASE + '/api/inventory/courses/' + course_code, { method: 'DELETE' }); // Send DELETE request
    await loadData(); // Reload table data
} // End of deleteCourse function

async function addCopyRow(course_code) { // Adds a new textbook copy row
    let copy_number = prompt("Enter the new Textbook Stamped Number:"); // Prompt user for ID
    if (!copy_number) return; // Exit if none provided

    const res = await fetch(API_BASE + '/api/inventory/copies', { // Send POST request
        method: 'POST', headers: { 'Content-Type': 'application/json' }, // Executes code logic
        body: JSON.stringify({ copy_number, course_code, student_name: '', teacher_name: '', location_status: '' }) // Converts object to JSON string
    }); // End of fetch
    
    if (!res.ok) { // Check for failure
        showLedgerError('Could not add the textbook row. Please check the server.'); // Show error
        return; // Halt
    } // End of error check
    await loadData(); // Reload table
} // End of addCopyRow function

async function updateCopy(copy_number, field, value) { // Updates a field on a textbook copy
    // Find current data
    let copy = copiesData.find(c => c.copy_number === copy_number); // Find copy by ID
    if (!copy) return; // Exit if not found

    // Update local object
    copy[field] = value; // Assign new value

    // Save to DB
    await fetch(API_BASE + '/api/inventory/copies/' + copy_number, { // Send PUT request
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, // Executes code logic
        body: JSON.stringify({ // Converts object to JSON string
            student_name: copy.student_name, // Executes code logic
            teacher_name: copy.teacher_name, // Executes code logic
            location_status: copy.location_status // Executes code logic
        }) // Executes code logic
    }); // End of fetch
    
    copy.last_updated = new Date().toISOString(); // Update timestamp locally
    const timestampCell = getCopyTimestampCell(copy_number); // Get UI cell
    if (timestampCell) timestampCell.textContent = formatTimestamp(copy.last_updated); // Update UI timestamp

    // Workflow rules
    if (field === 'location_status') { // Check if location was modified
        let loc = value.toLowerCase().trim(); // Normalize value
        let row = getCopyRow(copy_number); // Get row element
        row.className = ''; // Clear styling

        if (loc === 'missing') { // Check for missing status
            row.className = 'row-missing'; // Apply missing style
            if (confirm(`Add ${copy.student_name || 'Unknown Student'} to Liabilities Ledger?`)) { // Ask to add to ledger
                await promptLiability(copy); // Trigger liability addition
            } // End of confirmation
        } else if (loc === 'binding') { // Check for binding status
            row.className = 'row-binding'; // Apply binding style
        } else if (loc === 'teacher') { // Check for teacher status
            row.className = 'row-teacher'; // Apply teacher style
        } // End of conditionals
    } // End of location check
} // End of updateCopy function

async function promptLiability(copy) { // Adds a new liability automatically
    let course = coursesData.find(c => c.course_code === copy.course_code); // Look up course data
    let cost = course ? course.replacement_cost : 0; // Find associated cost

    let today = new Date().toISOString().split('T')[0]; // Get current date string

    const res = await fetch(API_BASE + '/api/inventory/liabilities', { // Send POST request
        method: 'POST', headers: { 'Content-Type': 'application/json' }, // Executes code logic
        body: JSON.stringify({ // Converts object to JSON string
            date_logged: today, // Executes code logic
            student_name: copy.student_name || 'Unknown', // Executes code logic
            teacher_name: copy.teacher_name || 'Unknown', // Executes code logic
            course_code: copy.course_code, // Executes code logic
            copy_number: copy.copy_number, // Executes code logic
            fine_amount: cost // Executes code logic
        }) // Executes code logic
    }); // End of fetch
    
    if (!res.ok) { // Error handling
        showLedgerError('Could not add the liability entry. Please check the server.'); // Show error
        return; // Halt
    } // End of check
    alert("Added to Liabilities Ledger."); // Notify user
    await loadLiabilities(); // Reload ledger
} // End of promptLiability function

async function deleteCopy(copy_number) { // Deletes a textbook copy
    if (!confirm(`Delete textbook ${copy_number}?`)) return; // Ask confirmation
    await fetch(API_BASE + '/api/inventory/copies/' + copy_number, { method: 'DELETE' }); // Send DELETE request
    await loadData(); // Reload table
} // End of deleteCopy function

async function resolveLiability(id) { // Marks a liability as resolved
    if (!confirm("Mark this fine as Paid/Resolved?")) return; // Ask confirmation
    await fetch(API_BASE + '/api/inventory/liabilities/' + id + '/resolve', { method: 'PUT' }); // Send PUT request
    await loadLiabilities(); // Reload ledger
} // End of resolveLiability function

async function deleteLiability(id) { // Deletes a liability entry
    if (!confirm("Delete this liability entry?")) return; // Ask confirmation
    const res = await fetch(API_BASE + '/api/inventory/liabilities/' + id, { method: 'DELETE' }); // Send DELETE request
    if (!res.ok) { // Error handling
        showLedgerError('Delete failed. The server may be offline.'); // Notify user
        return; // Halt
    } // End of check
    await loadLiabilities(); // Reload ledger
} // End of deleteLiability function

async function updateLiabilityOutcome(id, value) { // Updates the text outcome of a liability
    const res = await fetch(API_BASE + '/api/inventory/liabilities/' + id, { // Send PUT request
        method: 'PUT', // Executes code logic
        headers: { 'Content-Type': 'application/json' }, // Executes code logic
        body: JSON.stringify({ outcome: value }) // Converts object to JSON string
    }); // End of fetch
    if (!res.ok) { // Error handling
        showLedgerError('Could not save the outcome note.'); // Notify user
        return; // Halt
    } // End of check
} // End of updateLiabilityOutcome function

// Initialization calls - these should only run when their respective elements are on the page
window.addEventListener('DOMContentLoaded', () => { // Wait for DOM to load
    if (document.getElementById('rewrite-list-container')) { // If we are on the rewrite page
        renderRewriteList(); // Initialize the rewrite list
        renderClassNavForRewrite(); // Render class navigation
    } // End of rewrite page check
    
    if (document.getElementById('courses-tbody')) { // If we are on the textbooks page
        loadData(); // Load the textbook API data
        setInterval(loadLiabilities, 30000); // Poll liabilities every 30 seconds
        initTextbookThemeToggle(); // Initialize custom theme toggle logic for textbooks
    } // End of textbooks page check
}); // End of DOMContentLoaded listener
