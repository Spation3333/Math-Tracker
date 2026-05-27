const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

function togglePassword(inputId) {
    const password = document.getElementById(inputId);
    const toggleButton = password.nextElementSibling;
    if (password.type === "password") {
        password.type = "text";
        toggleButton.textContent = "🔒";
    } else {
        password.type = "password";
        toggleButton.textContent = "👁️";
    }
}

function attachEyeToggles() {
    const toggleApp = document.getElementById('toggleProfApp');
    const togglePin = document.getElementById('toggleProfPin');
    if (toggleApp) {
        toggleApp.addEventListener('click', function () {
            const input = document.getElementById('prof-apppass');
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            this.textContent = type === 'password' ? '👁️' : '🔒';
        });
    }
    if (togglePin) {
        togglePin.addEventListener('click', function () {
            const input = document.getElementById('prof-pin');
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            this.textContent = type === 'password' ? '👁️' : '🔒';
        });
    }
}

if (localStorage.getItem('theme') === 'dark') {
    body.classList.add('darkmode');
    if (themeToggle) themeToggle.checked = true;
}

if (themeToggle) {
    themeToggle.addEventListener('change', function () {
        if (this.checked) {
            body.classList.add('darkmode');
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.remove('darkmode');
            localStorage.setItem('theme', 'light');
        }
    });
}

window.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('newclass')) {
        initializeFixedGrid();
        updateClass();
    }
    if (document.getElementById('currentdate')) displayDate();
    attachEyeToggles();
});

function displayDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentdate').textContent = new Date().toLocaleDateString('en-US', options);
}

const currentUser = JSON.parse(localStorage.getItem('currentUser'));

if (!currentUser && window.location.pathname.includes('select.html')) {
    window.location.href = 'index.html';
}

// PROFILE SETUP
window.addEventListener('DOMContentLoaded', function () {
    if (currentUser) {
        if (document.getElementById('welcome-header')) {
            document.getElementById('welcome-header').textContent = `Welcome ${currentUser.firstName} ${currentUser.lastName}!`;
        }
        if (document.getElementById('profile-name')) {
            document.getElementById('profile-name').textContent = `${currentUser.firstName} ${currentUser.lastName}`;
            document.getElementById('profile-email').textContent = currentUser.email;
        }
        if (document.body.classList.contains('darkmode') && document.getElementById('profile-name')) {
            document.getElementById('profile-name').style.color = "rgb(212, 175, 55)";
        }
    }
});

function openProfileModal() {
    document.getElementById('prof-fname').value = currentUser.firstName;
    document.getElementById('prof-lname').value = currentUser.lastName;
    document.getElementById('prof-email').value = currentUser.email;
    document.getElementById('prof-apppass').value = currentUser.appPassword || '';
    document.getElementById('prof-pin').value = '';

    document.getElementById('prof-apppass').setAttribute('type', 'password');
    document.getElementById('prof-pin').setAttribute('type', 'password');
    if (document.getElementById('toggleProfApp')) document.getElementById('toggleProfApp').textContent = '👁️';
    if (document.getElementById('toggleProfPin')) document.getElementById('toggleProfPin').textContent = '👁️';

    document.getElementById('profile-modal').style.display = 'flex';
}

function closeProfileModal() {
    document.getElementById('profile-modal').style.display = 'none';
}

async function saveProfile() {
    const pin = document.getElementById('prof-pin').value;
    if (pin !== currentUser.pin) return alert("Incorrect PIN! Cannot save changes.");

    const newFname = document.getElementById('prof-fname').value.trim();
    const newLname = document.getElementById('prof-lname').value.trim();
    const newEmail = document.getElementById('prof-email').value.trim().toLowerCase();
    const newAppPass = document.getElementById('prof-apppass').value.trim();

    if (!newFname || !newLname || !newEmail || !newAppPass) return alert("All fields are required.");

    const users = JSON.parse(localStorage.getItem('mathTrackUsers')) || {};

    if (newEmail !== currentUser.email && users[newEmail]) return alert("Email already in use!");

    const oldEmail = currentUser.email;

    if (newEmail !== oldEmail) {
        try {
            await fetch('http://localhost:3000/api/migrate-email', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldEmail, newEmail })
            });
        } catch (e) { console.error("DB Migration Error", e); }

        const keysToMigrate = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes(oldEmail)) keysToMigrate.push(key);
        }
        keysToMigrate.forEach(key => {
            const newKey = key.replace(oldEmail, newEmail);
            localStorage.setItem(newKey, localStorage.getItem(key));
            localStorage.removeItem(key);
        });
    }

    delete users[oldEmail];
    const updatedUser = { firstName: newFname, lastName: newLname, email: newEmail, appPassword: newAppPass, pin: currentUser.pin };
    users[newEmail] = updatedUser;

    localStorage.setItem('mathTrackUsers', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));

    alert("Profile updated successfully!");
    window.location.reload();
}

async function deleteAccount() {
    const pin = document.getElementById('prof-pin').value;
    if (!pin) return alert("Please enter your PIN to authorize account deletion.");
    if (pin !== currentUser.pin) return alert("Incorrect PIN! Cannot delete account.");

    if (confirm("WARNING: Are you absolutely sure you want to delete your account? This will permanently erase all your classes, students, and grades. This action CANNOT be undone.")) {

        const email = currentUser.email;
        const users = JSON.parse(localStorage.getItem('mathTrackUsers')) || {};

        const storageKey = `savedClasses_${email}`;
        const archiveKey = `archivedClasses_${email}`;

        const userClasses = JSON.parse(localStorage.getItem(storageKey)) || [];
        const archivedClasses = JSON.parse(localStorage.getItem(archiveKey)) || [];

        const allClasses = [...userClasses, ...archivedClasses].filter(c => c !== null);

        for (let i = 0; i < allClasses.length; i++) {
            const uniqueDbClassName = email + "_" + allClasses[i].name;
            try {
                await fetch(`http://localhost:3000/api/delete-class/${encodeURIComponent(uniqueDbClassName)}`, { method: 'DELETE' });
            } catch (e) {
                console.error("Error deleting class from database:", e);
            }
        }

        const keysToDelete = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes(email)) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(k => localStorage.removeItem(k));

        delete users[email];
        localStorage.setItem('mathTrackUsers', JSON.stringify(users));
        localStorage.removeItem('currentUser');

        alert("Account permanently deleted.");
        window.location.href = 'index.html';
    }
}

const storageKey = currentUser ? `savedClasses_${currentUser.email}` : 'savedClasses';

// Convert existing array structure to a rigid 8-slot array representing absolute grid positions
function initializeFixedGrid() {
    let loadedData = JSON.parse(localStorage.getItem(storageKey));
    if (!Array.isArray(loadedData) || loadedData.length !== 8) {
        let fixedArray = new Array(8).fill(null);
        if (Array.isArray(loadedData)) {
            // Map old data into the new structure
            for (let i = 0; i < loadedData.length && i < 8; i++) {
                fixedArray[i] = loadedData[i];
            }
        }
        localStorage.setItem(storageKey, JSON.stringify(fixedArray));
    }
}

function getClassData() {
    return JSON.parse(localStorage.getItem(storageKey)) || new Array(8).fill(null);
}

let dragStart;

function toggleCustomColor(type) {
    const select = document.getElementById(`${type}-color-select`);
    const custom = document.getElementById(`${type}-color-custom`);
    if (select.value === 'custom') {
        custom.style.display = 'inline-block';
        custom.click();
    } else {
        custom.style.display = 'none';
    }
}

function getFinalColor(type) {
    const select = document.getElementById(`${type}-color-select`);
    const custom = document.getElementById(`${type}-color-custom`);
    return select.value === 'custom' ? custom.value : select.value;
}

function setDropdownColor(type, savedColor) {
    const select = document.getElementById(`${type}-color-select`);
    const custom = document.getElementById(`${type}-color-custom`);
    let matchedOption = false;
    for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value === savedColor) {
            select.selectedIndex = i;
            matchedOption = true;
            break;
        }
    }
    if (matchedOption) {
        custom.style.display = 'none';
    } else {
        select.value = 'custom';
        custom.value = savedColor || (type === 'bg' ? '#ffffff' : '#000000');
        custom.style.display = 'inline-block';
    }
}

// Open class explicitly tracks which grid index was clicked
function openClass(editIndex) {
    const modal = document.getElementById('modal');
    const title = document.getElementById('modalheader');
    const indexTracker = document.getElementById('edit-index');
    modal.style.display = 'flex';

    let classData = getClassData();
    indexTracker.value = editIndex; // Always strictly sets target grid slot

    if (classData[editIndex] !== null) {
        title.textContent = "Edit Class";
        document.getElementById('classname').value = classData[editIndex].name;
        document.getElementById('font-family').value = classData[editIndex].font || "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        setDropdownColor('bg', classData[editIndex].bgColor);
        setDropdownColor('text', classData[editIndex].textColor);
    } else {
        title.textContent = "Create New Class";
        document.getElementById('classname').value = "";
        document.getElementById('font-family').selectedIndex = 0;
        setDropdownColor('bg', '#f9f9f9');
        setDropdownColor('text', '#000000');
    }
}

function closeClass() {
    document.getElementById('modal').style.display = 'none';
}

function saveClass() {
    const name = document.getElementById('classname').value;
    const font = document.getElementById('font-family').value;
    const bgColor = getFinalColor('bg');
    const textColor = getFinalColor('text');
    const editIndex = parseInt(document.getElementById('edit-index').value);

    let classData = getClassData();

    const currentStudents = classData[editIndex] !== null ? classData[editIndex].students : 0;
    const currentEval = classData[editIndex] !== null ? classData[editIndex].eval : "";

    const newClass = {
        name: name,
        students: currentStudents,
        eval: currentEval,
        font: font,
        bgColor: bgColor,
        textColor: textColor
    };

    // Insert new class explicitly into the clicked grid index
    classData[editIndex] = newClass;
    localStorage.setItem(storageKey, JSON.stringify(classData));

    closeClass();
    updateClass();
}

function deleteClass(index) {
    if (confirm("Archive this class? (You can recover it later from the Archived Classes page)")) {
        let classData = getClassData();
        const archiveKey = currentUser ? `archivedClasses_${currentUser.email}` : 'archivedClasses';
        let archivedData = JSON.parse(localStorage.getItem(archiveKey)) || [];

        // Save into Archive mapping with its original index
        let archivedObj = classData[index];
        archivedObj.originalIndex = index;
        archivedData.push(archivedObj);
        localStorage.setItem(archiveKey, JSON.stringify(archivedData));

        // Delete from Active grid by replacing with null
        classData[index] = null;
        localStorage.setItem(storageKey, JSON.stringify(classData));

        updateClass();
    }
}

function getCurrentWeekLessonTitle(uniqueDbClassName) {
    const unitsKey = `units_${uniqueDbClassName}`;
    const lessonsKey = `lessons_${uniqueDbClassName}`;

    const unitsStr = localStorage.getItem(unitsKey);
    const lessonsStr = localStorage.getItem(lessonsKey);

    if (!unitsStr || !lessonsStr) return "N/A";

    const units = JSON.parse(unitsStr);
    const lessons = JSON.parse(lessonsStr);

    const today = new Date();
    today.setHours(12, 0, 0, 0);

    for (let i = units.length - 1; i >= 0; i--) {
        let mondayParts = units[i].split('-');
        if (mondayParts.length === 3) {
            let mondayDate = new Date(mondayParts[0], mondayParts[1] - 1, mondayParts[2], 12, 0, 0);

            if (today >= mondayDate) {
                const diffTime = Math.abs(today - mondayDate);
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays >= 0 && diffDays <= 4) {
                    if (lessons[i] && lessons[i].titles && lessons[i].titles[diffDays]) {
                        return lessons[i].titles[diffDays];
                    }
                }
                break;
            }
        }
    }
    return "N/A";
}

function updateClass() {
    const grid = document.getElementById('newclass');
    if (!grid) return;
    grid.innerHTML = '';

    let classData = getClassData();

    // Iterate exactly 8 times over the grid array
    for (let i = 0; i < 8; i++) {
        const wrapper = document.createElement('div');
        wrapper.className = 'cardwrapper';

        // Set up drop target logic universally (so you can drag onto empty spaces)
        wrapper.addEventListener('dragover', function (e) { e.preventDefault(); });
        wrapper.addEventListener('dragenter', function (e) { e.preventDefault(); this.classList.add('drag-over'); });
        wrapper.addEventListener('dragleave', function () { this.classList.remove('drag-over'); });
        wrapper.addEventListener('drop', function () {
            this.classList.remove('drag-over');
            let data = getClassData();
            // Swap the dragged item with the target spot (even if null)
            const draggedItem = data[dragStartIndex];
            data[dragStartIndex] = data[i];
            data[i] = draggedItem;
            localStorage.setItem(storageKey, JSON.stringify(data));
            updateClass();
        });

        // Determine letter regardless of if it's empty
        const letter = document.createElement('div');
        letter.className = 'cardletter';
        letter.textContent = String.fromCharCode(65 + (i % 4));
        wrapper.appendChild(letter);

        // If a class exists at this grid slot
        if (classData[i] !== null) {
            wrapper.draggable = true;
            wrapper.addEventListener('dragstart', function () { dragStartIndex = i; this.classList.add('dragging'); });
            wrapper.addEventListener('dragend', function () { this.classList.remove('dragging'); });

            const card = document.createElement('div');
            card.className = 'classcard';
            card.style.backgroundColor = classData[i].bgColor || '#f9f9f9';

            const countId = `student-count-${i}`;
            const uniqueDbClassName = currentUser.email + "_" + classData[i].name;
            const todaysLessonTitle = getCurrentWeekLessonTitle(uniqueDbClassName);

            let evalText = "N/A";
            if (classData[i].eval) {
                let eDate = new Date(classData[i].eval);
                if (!isNaN(eDate)) {
                    let today = new Date();
                    today.setHours(0, 0, 0, 0);

                    if (eDate.getFullYear() < today.getFullYear() - 5) {
                        eDate.setFullYear(today.getFullYear());
                    }

                    eDate.setHours(0, 0, 0, 0);

                    if (eDate < today && (today - eDate) > (1000 * 60 * 60 * 24 * 30)) {
                        eDate.setFullYear(today.getFullYear() + 1);
                    }

                    let diffTime = eDate.getTime() - today.getTime();
                    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays === 0) evalText = "Today";
                    else if (diffDays === 1) evalText = "1 day";
                    else if (diffDays > 1) evalText = diffDays + " days";
                    else evalText = "Past";
                } else {
                    evalText = classData[i].eval;
                }
            }

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
            `;

            wrapper.appendChild(card);
            grid.appendChild(wrapper);

            fetch(`http://localhost:3000/api/data/${encodeURIComponent(uniqueDbClassName)}`)
                .then(res => res.json())
                .then(data => {
                    const actualCount = (data.data) ? data.data.length : 0;
                    document.getElementById(countId).textContent = actualCount;

                    let memoryData = getClassData();
                    if (memoryData[i] !== null) {
                        memoryData[i].students = actualCount;
                        localStorage.setItem(storageKey, JSON.stringify(memoryData));
                    }
                })
                .catch(err => {
                    document.getElementById(countId).textContent = "Server Offline";
                });
        }
        // If spot is empty, create an Add Box natively tied to its index position
        else {
            const addBox = document.createElement('div');
            addBox.className = 'addbox';
            addBox.textContent = '+';
            addBox.onclick = function () { openClass(i); };
            wrapper.appendChild(addBox);
            grid.appendChild(wrapper);
        }
    }
}