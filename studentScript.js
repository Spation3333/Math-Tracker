const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser) window.location.href = 'index.html';

const storageKey = `savedClasses_${currentUser.email}`;

// Enforce the rigid 8-slot array structure immediately on load
let rawClassData = JSON.parse(localStorage.getItem(storageKey));
if (!Array.isArray(rawClassData) || rawClassData.length !== 8) {
    let fixedArray = new Array(8).fill(null);
    if (Array.isArray(rawClassData)) {
        for (let i = 0; i < rawClassData.length && i < 8; i++) {
            fixedArray[i] = rawClassData[i];
        }
    }
    localStorage.setItem(storageKey, JSON.stringify(fixedArray));
    rawClassData = fixedArray;
}
let classData = rawClassData;

let currentClass = "Unknown Class";

let unitsData = [];
let activeUnitIndex = 0;

let classLessonsData = {};
let classMarksData = {};
let studentsData = [];

// Refined default formatting matching your exact requested layout
const DEFAULT_EMAIL_TEMPLATE = `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.4; color: #333;">
Hello [RecipientName],<br><br>
Here is [StudentName]'s progress for the week of [Week]:<br><br>
[Grades]<br><br>
[TeacherNotes]<br><br>
Best Regards,<br>
[TeacherName]
</div>`;

// --- DATE UTILITY ---
function getSafeMonday(dateString) {
    if (!dateString || dateString.startsWith("Unit")) {
        dateString = new Date().toISOString().split('T')[0];
    }
    let parts = dateString.split('-');
    if (parts.length === 3) {
        let d = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
        let day = d.getDay();
        let diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        return d;
    }
    return new Date();
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

window.onload = () => {
    document.getElementById('currentdate').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const themeToggle = document.getElementById('theme-toggle');
    if (localStorage.getItem('theme') === 'dark') { document.body.classList.add('darkmode'); themeToggle.checked = true; }
    themeToggle.addEventListener('change', function () {
        document.body.classList.toggle('darkmode', this.checked);
        localStorage.setItem('theme', this.checked ? 'dark' : 'light');
    });

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('class')) currentClass = urlParams.get('class');

    const classInput = document.getElementById('current-class-input');
    classInput.value = currentClass.replace(currentUser.email + "_", "");

    classInput.addEventListener('change', async function () {
        const newRawName = this.value.trim();
        const oldRawName = currentClass.replace(currentUser.email + "_", "");

        if (!newRawName || newRawName === oldRawName) {
            this.value = oldRawName;
            return;
        }

        const newDbName = currentUser.email + "_" + newRawName;

        const classIndex = classData.findIndex(c => c !== null && c.name === oldRawName);
        if (classIndex !== -1) {
            classData[classIndex].name = newRawName;
            localStorage.setItem(storageKey, JSON.stringify(classData));
        }

        const keysToMigrate = ['lessons', 'marks', 'units'];
        keysToMigrate.forEach(prefix => {
            const oldStr = localStorage.getItem(`${prefix}_${currentClass}`);
            if (oldStr) {
                localStorage.setItem(`${prefix}_${newDbName}`, oldStr);
                localStorage.removeItem(`${prefix}_${currentClass}`);
            }
        });

        try {
            await fetch('http://localhost:3000/api/rename-class', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldClassName: currentClass, newClassName: newDbName })
            });
        } catch (e) {
            console.error("DB Rename error", e);
        }

        currentClass = newDbName;
        const url = new URL(window.location);
        url.searchParams.set('class', newDbName);
        window.history.pushState({}, '', url);

        renderClassNav();
    });

    const evalInput = document.getElementById('next-eval-input');
    if (evalInput) {
        const currentClassObj = classData.find(c => c !== null && `${currentUser.email}_${c.name}` === currentClass);
        if (currentClassObj && currentClassObj.eval) {
            evalInput.value = currentClassObj.eval;
        }
        evalInput.addEventListener('change', function () {
            const classIndex = classData.findIndex(c => c !== null && `${currentUser.email}_${c.name}` === currentClass);
            if (classIndex !== -1) {
                classData[classIndex].eval = this.value.trim();
                localStorage.setItem(storageKey, JSON.stringify(classData));
                renderRosterTable();
            }
        });
    }

    classLessonsData = JSON.parse(localStorage.getItem(`lessons_${currentClass}`)) || {};
    classMarksData = JSON.parse(localStorage.getItem(`marks_${currentClass}`)) || {};

    renderProfileBox();
    attachEyeToggles();
    renderClassNav();
    initUnits();
    loadStudentsData();
};

// --- PROFILE LOGIC ---
function renderProfileBox() {
    if (document.getElementById('profile-name')) {
        document.getElementById('profile-name').textContent = `${currentUser.firstName} ${currentUser.lastName}`;
        document.getElementById('profile-email').textContent = currentUser.email;
    }
}

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

    const currentClassName = currentClass.replace(oldEmail + "_", "");
    window.location.href = `studentList.html?class=${encodeURIComponent(newEmail + "_" + currentClassName)}`;
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

function renderClassNav() {
    const navBar = document.getElementById('class-nav-bar');
    navBar.innerHTML = '';

    for (let i = 0; i < 8; i++) {
        const btn = document.createElement('button');
        btn.className = 'btn-class-nav';

        if (classData[i] !== null) {
            btn.innerText = classData[i].name;
            btn.style.backgroundColor = 'var(--primary)';
            if (`${currentUser.email}_${classData[i].name}` === currentClass) {
                btn.style.boxShadow = '0 0 0 3px var(--accent)';
            }
            btn.onclick = () => window.location.href = `studentList.html?class=${encodeURIComponent(currentUser.email + '_' + classData[i].name)}`;
        } else {
            btn.innerText = '+ Untitled';
            btn.style.backgroundColor = '#a9a9a9';
            btn.onclick = () => {
                let baseName = "Untitled";
                let count = 1;
                let uniqueName = baseName;
                while (classData.some(c => c !== null && c.name === uniqueName)) {
                    count++;
                    uniqueName = `${baseName} ${count}`;
                }

                const newClass = {
                    name: uniqueName,
                    students: 0,
                    eval: "",
                    font: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                    bgColor: "#f9f9f9",
                    textColor: "#000000"
                };

                classData[i] = newClass;
                localStorage.setItem(storageKey, JSON.stringify(classData));
                window.location.href = `studentList.html?class=${encodeURIComponent(currentUser.email + '_' + newClass.name)}`;
            };
        }
        navBar.appendChild(btn);
    }
}

// --- UNIT LOGIC ---
function initUnits() {
    const unitStorageKey = `units_${currentClass}`;
    let storedUnits = JSON.parse(localStorage.getItem(unitStorageKey));

    if (!storedUnits || storedUnits.length === 0 || storedUnits[0].startsWith("Unit")) {
        let mondayDate = getSafeMonday(new Date().toISOString().split('T')[0]);
        let y = mondayDate.getFullYear();
        let m = String(mondayDate.getMonth() + 1).padStart(2, '0');
        let d = String(mondayDate.getDate()).padStart(2, '0');
        unitsData = [`${y}-${m}-${d}`];
        localStorage.setItem(unitStorageKey, JSON.stringify(unitsData));
    } else {
        unitsData = storedUnits;
    }
    renderUnits();
}

function renderUnits() {
    const unitsContainer = document.getElementById('units-container');
    if (!unitsContainer) return;
    unitsContainer.innerHTML = '';

    unitsData.forEach((unitStr, index) => {
        let unitDiv = document.createElement('div');
        unitDiv.className = 'unit-box' + (index === activeUnitIndex ? ' active' : '');

        let safeDate = getSafeMonday(unitStr);
        unitDiv.innerText = safeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        unitDiv.onclick = () => {
            activeUnitIndex = index;
            renderUnits();
            renderRosterTable();
        };

        const delBtn = document.createElement('button');
        delBtn.className = 'unit-delete';
        delBtn.innerText = '×';
        delBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm(`Delete this week and all its marks?`)) {
                unitsData.splice(index, 1);
                delete classLessonsData[index];

                for (let studentId in classMarksData) {
                    if (classMarksData[studentId]) {
                        delete classMarksData[studentId][index];
                        for (let j = index + 1; j <= unitsData.length; j++) {
                            if (classMarksData[studentId][j]) {
                                classMarksData[studentId][j - 1] = classMarksData[studentId][j];
                                delete classMarksData[studentId][j];
                            }
                        }
                    }
                }

                for (let j = index + 1; j <= unitsData.length; j++) {
                    if (classLessonsData[j]) {
                        classLessonsData[j - 1] = classLessonsData[j];
                        delete classLessonsData[j];
                    }
                }

                localStorage.setItem(`units_${currentClass}`, JSON.stringify(unitsData));
                localStorage.setItem(`lessons_${currentClass}`, JSON.stringify(classLessonsData));
                localStorage.setItem(`marks_${currentClass}`, JSON.stringify(classMarksData));

                activeUnitIndex = 0;
                renderUnits();
                renderRosterTable();
            }
        };
        unitDiv.appendChild(delBtn);

        unitsContainer.appendChild(unitDiv);
    });

    let addBox = document.createElement('div');
    addBox.className = 'unit-add-box';
    addBox.innerText = '+';
    addBox.onclick = () => {
        let nextMondayStr;
        if (unitsData.length > 0) {
            let lastSafeDate = getSafeMonday(unitsData[unitsData.length - 1]);
            lastSafeDate.setDate(lastSafeDate.getDate() + 7);

            let y = lastSafeDate.getFullYear();
            let m = String(lastSafeDate.getMonth() + 1).padStart(2, '0');
            let d = String(lastSafeDate.getDate()).padStart(2, '0');
            nextMondayStr = `${y}-${m}-${d}`;
        } else {
            let safeDate = getSafeMonday(new Date().toISOString().split('T')[0]);
            let y = safeDate.getFullYear();
            let m = String(safeDate.getMonth() + 1).padStart(2, '0');
            let d = String(safeDate.getDate()).padStart(2, '0');
            nextMondayStr = `${y}-${m}-${d}`;
        }

        unitsData.push(nextMondayStr);
        localStorage.setItem(`units_${currentClass}`, JSON.stringify(unitsData));
        renderUnits();
    };
    unitsContainer.appendChild(addBox);
}

function selectUnit(index) {
    activeUnitIndex = index;
    renderUnits();
    renderRosterTable();
}

// --- DATA & TABLE LOGIC ---
async function loadStudentsData() {
    try {
        const response = await fetch(`http://localhost:3000/api/data/${encodeURIComponent(currentClass)}`);
        const json = await response.json();
        studentsData = json.data || [];

        const savedOrder = JSON.parse(localStorage.getItem(`studentOrder_${currentClass}`)) || [];
        if (savedOrder.length > 0) {
            studentsData.sort((a, b) => {
                let indexA = savedOrder.indexOf(a.id);
                let indexB = savedOrder.indexOf(b.id);
                if (indexA === -1) indexA = 999999;
                if (indexB === -1) indexB = 999999;
                return indexA - indexB;
            });
        }

        renderRosterTable();
    } catch (err) {
        document.getElementById('roster-container').innerHTML = '<p style="color:var(--danger);">Error connecting to server.</p>';
    }
}

function ensureUnitStructure() {
    if (!classLessonsData[activeUnitIndex]) classLessonsData[activeUnitIndex] = { titles: ["", "", "", "", ""] };
    if (!classLessonsData[activeUnitIndex].titles) classLessonsData[activeUnitIndex].titles = ["", "", "", "", ""];
}

function toggleCustomView(checkbox, studentId, markKey) {
    const cellDiv = checkbox.closest('.mark-cell-wrapper');
    const radioGroup = cellDiv.querySelector('.radio-group-container');
    const sliderGroup = cellDiv.querySelector('.custom-slider-container');

    if (checkbox.checked) {
        radioGroup.style.display = 'none';
        sliderGroup.style.display = 'flex';
        const slider = sliderGroup.querySelector('input[type="range"]');
        updateMark(studentId, markKey, slider.value);
    } else {
        sliderGroup.style.display = 'none';
        radioGroup.style.display = 'flex';
        const checkedRadio = radioGroup.querySelector('input[type="radio"]:checked');
        updateMark(studentId, markKey, checkedRadio ? checkedRadio.value : '');
    }

    if (!classMarksData[studentId]) classMarksData[studentId] = {};
    if (!classMarksData[studentId][activeUnitIndex]) classMarksData[studentId][activeUnitIndex] = {};
    classMarksData[studentId][activeUnitIndex][markKey + '_custom'] = checkbox.checked;
    localStorage.setItem(`marks_${currentClass}`, JSON.stringify(classMarksData));
}

function updateLateStatus(studentId, markKey, isLate) {
    if (!classMarksData[studentId]) classMarksData[studentId] = {};
    if (!classMarksData[studentId][activeUnitIndex]) classMarksData[studentId][activeUnitIndex] = {};
    classMarksData[studentId][activeUnitIndex][markKey + '_late'] = isLate;
    localStorage.setItem(`marks_${currentClass}`, JSON.stringify(classMarksData));
}

function updateMark(studentId, markKey, value) {
    if (!classMarksData[studentId]) classMarksData[studentId] = {};
    if (!classMarksData[studentId][activeUnitIndex]) classMarksData[studentId][activeUnitIndex] = {};
    classMarksData[studentId][activeUnitIndex][markKey] = value;
    localStorage.setItem(`marks_${currentClass}`, JSON.stringify(classMarksData));
}

function updateNote(studentId, text) {
    if (!classMarksData[studentId]) classMarksData[studentId] = {};
    if (!classMarksData[studentId][activeUnitIndex]) classMarksData[studentId][activeUnitIndex] = {};
    classMarksData[studentId][activeUnitIndex]['notes'] = text;
    localStorage.setItem(`marks_${currentClass}`, JSON.stringify(classMarksData));
}

function updateLessonTitle(dayIndex, title) {
    ensureUnitStructure();
    classLessonsData[activeUnitIndex].titles[dayIndex] = title;
    localStorage.setItem(`lessons_${currentClass}`, JSON.stringify(classLessonsData));
}

// --- IMAGE ATTACHMENT LOGIC ---
function uploadNoteImage(studentId, inputElement) {
    const file = inputElement.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
            } else {
                if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

            if (!classMarksData[studentId]) classMarksData[studentId] = {};
            if (!classMarksData[studentId][activeUnitIndex]) classMarksData[studentId][activeUnitIndex] = {};

            classMarksData[studentId][activeUnitIndex]['note_image'] = dataUrl;
            localStorage.setItem(`marks_${currentClass}`, JSON.stringify(classMarksData));
            renderRosterTable();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function removeNoteImage(studentId) {
    if (classMarksData[studentId] && classMarksData[studentId][activeUnitIndex]) {
        classMarksData[studentId][activeUnitIndex]['note_image'] = '';
        localStorage.setItem(`marks_${currentClass}`, JSON.stringify(classMarksData));
        renderRosterTable();
    }
}

function buildMarkCellHTML(studentId, markKey, markVal, isLate, isCustom) {
    let showSlider = isCustom;

    const standardMarks = ['0', '25', '50', '75', '100', ''];
    if (markVal !== '' && !standardMarks.includes(String(markVal))) {
        showSlider = true;
        isCustom = true;
    }

    const radios = ['0', '25', '50', '75', '100'].map(val => `
        <label style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <input type="radio" style="margin: 0; cursor: pointer;" name="mark_${studentId}_${markKey}" value="${val}" ${String(markVal) === val && !showSlider ? 'checked' : ''} onchange="updateMark(${studentId}, '${markKey}', this.value)">
            <span>${val}</span>
        </label>
    `).join('');

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
            </td>`;
}

function renderRosterTable() {
    const container = document.getElementById('roster-container');
    if (!container) return;

    if (studentsData.length === 0) {
        container.innerHTML = '<p>No students tracked. Please import a CSV or manually add a student above.</p>';
        return;
    }

    if (unitsData.length === 0) {
        container.innerHTML = '<p>No weeks available. Please click the + button above to add a week.</p>';
        return;
    }

    ensureUnitStructure();

    const currentClassObj = classData.find(c => c !== null && `${currentUser.email}_${c.name}` === currentClass);
    let evalDateObj = null;
    if (currentClassObj && currentClassObj.eval) {
        let parsed = new Date(currentClassObj.eval);
        if (!isNaN(parsed)) {
            if (parsed.getFullYear() < new Date().getFullYear() - 5) {
                parsed.setFullYear(new Date().getFullYear());
            }
            let today = new Date();
            if (parsed < today && (today - parsed) > (1000 * 60 * 60 * 24 * 30)) {
                parsed.setFullYear(today.getFullYear() + 1);
            }
            evalDateObj = parsed;
        }
    }

    let thHTML = `<th style="text-align:left;">Student Details<br><button class="print-class-btn" onclick="printClassRoster()">Print Class</button></th>`;
    const mondayStr = unitsData[activeUnitIndex];

    [0, 1, 2, 3, 4].forEach(i => {
        let d = getSafeMonday(mondayStr);
        d.setDate(d.getDate() + i);
        let dateLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        let titleVal = classLessonsData[activeUnitIndex].titles[i] || "";

        let isEvalDay = false;
        if (evalDateObj && d.getMonth() === evalDateObj.getMonth() && d.getDate() === evalDateObj.getDate() && d.getFullYear() === evalDateObj.getFullYear()) {
            isEvalDay = true;
        }

        let headerColorStyle = isEvalDay ? 'color: var(--danger, #e74c3c); font-weight: bold;' : '';
        let inputColorStyle = isEvalDay ? 'color: var(--danger, #e74c3c); font-weight: bold;' : '';

        thHTML += `
            <th>
                <div class="lesson-header" style="${headerColorStyle}">
                    <span>${dateLabel}</span>
                    <input type="text" class="lesson-date" placeholder="Lesson Title" value="${titleVal}" onchange="updateLessonTitle(${i}, this.value)" style="width: 100%; box-sizing: border-box; text-align: center; border: 1px solid var(--border-color); border-radius: 4px; padding: 4px; margin-top: 5px; ${inputColorStyle}">
                </div>
            </th>`;
    });

    thHTML += `<th style="min-width: 250px;"><div class="lesson-header"><span>Teacher Notes</span></div></th>`;

    let tbodyHTML = '';
    studentsData.forEach((student, index) => {
        const sMarks = (classMarksData[student.id] && classMarksData[student.id][activeUnitIndex]) || {};

        let parsedContacts = [];
        if (student.contacts_info) {
            try { parsedContacts = JSON.parse(student.contacts_info); } catch (e) { }
        } else if (student.guardian_email) {
            student.guardian_email.split(',').forEach(e => parsedContacts.push({ name: '', rel: '', email: e.trim() }));
        }

        let contactsDisplayHtml = '';

        if (student.student_email && student.student_email.trim() !== '') {
            contactsDisplayHtml += `<div style="font-size: 0.8em; margin-top: 2px; line-height: 1.3;">
                <span style="color: gray;">${student.student_email.trim()}</span>
            </div>`;
        }

        parsedContacts.forEach(c => {
            if (c.email || c.name) {
                contactsDisplayHtml += `<div style="font-size: 0.8em; margin-top: 6px; line-height: 1.3;">
                    <span style="font-weight: bold; color: var(--text-color);">${c.name || 'Guardian'} ${c.rel ? `(${c.rel})` : ''}</span><br>
                    <span style="color: gray;">${c.email || 'No email'}</span>
                </div>`;
            }
        });

        if (parsedContacts.length === 0) parsedContacts.push({ name: '', rel: '', email: '' });

        let parentEditHtml = '';
        parsedContacts.forEach(c => {
            parentEditHtml += `
                <div class="parent-email-row" style="display: flex; gap: 5px; margin-bottom: 5px;">
                    <input type="text" class="parent-name-input" placeholder="Name" value="${c.name || ''}" style="width: 30%; flex: 1; padding: 6px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--input-bg); color: var(--text-color);" onchange="saveStudentChanges(${student.id})">
                    <input type="text" class="parent-rel-input" placeholder="Relation" value="${c.rel || ''}" style="width: 30%; flex: 1; padding: 6px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--input-bg); color: var(--text-color);" onchange="saveStudentChanges(${student.id})">
                    <input type="text" class="parent-email-input" placeholder="Email" value="${c.email || ''}" style="flex: 2; padding: 6px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--input-bg); color: var(--text-color);" onchange="saveStudentChanges(${student.id})">
                </div>
            `;
        });

        const nameParts = student.name ? student.name.split(' ') : ["Unknown"];
        const fName = nameParts[0];
        const lName = nameParts.slice(1).join(' ');

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
                </td>`;

        [0, 1, 2, 3, 4].forEach(i => {
            const markKey = `d${i}`;
            const markVal = sMarks[markKey] || '';
            const isLate = sMarks[markKey + '_late'] || false;
            const isCustom = sMarks[markKey + '_custom'] || false;
            tbodyHTML += buildMarkCellHTML(student.id, markKey, markVal, isLate, isCustom);
        });

        const studentNote = sMarks['notes'] || '';
        const studentNoteImg = sMarks['note_image'] || '';

        let imgHtml = '';
        if (studentNoteImg) {
            imgHtml = `
                <div style="position:relative; display:inline-block; margin-top:5px; width: 100%; text-align:center;">
                    <img src="${studentNoteImg}" style="max-width: 100%; max-height: 100px; border-radius: 4px; border: 1px solid var(--border-color);">
                    <button onclick="removeNoteImage(${student.id})" title="Remove Image" style="position:absolute; top:-5px; right:-5px; background:var(--danger); color:white; border:none; border-radius:50%; cursor:pointer; width:22px; height:22px; font-size:12px; font-weight:bold;">×</button>
                </div>
            `;
        }

        tbodyHTML += `<td class="notes-cell" style="vertical-align: top;">
                        <textarea class="mark-input" style="width: 100%; height: 60px; resize: vertical; text-align: left; font-weight: normal; font-family: inherit; margin-bottom: 5px;" 
                            placeholder="Add private notes here..." 
                            onchange="updateNote(${student.id}, this.value)">${studentNote}</textarea>
                        
                        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                            <label style="cursor:pointer; font-size:0.8em; color:var(--accent); font-weight:bold; display:flex; align-items:center; gap:5px;">
                                📎 Attach Image
                                <input type="file" accept="image/*" style="display:none;" onchange="uploadNoteImage(${student.id}, this)">
                            </label>
                        </div>
                        ${imgHtml}
                    </td></tr>`;
    });

    container.innerHTML = `<table class="roster-table"><thead><tr>${thHTML}</tr></thead><tbody>${tbodyHTML}</tbody></table>`;

    // --- DRAG AND DROP LISTENERS ---
    const rows = container.querySelectorAll('tbody tr.student-row');
    let dragStartIndex = -1;

    rows.forEach((row, index) => {
        row.draggable = true;

        row.addEventListener('dragstart', function (e) {
            const targetTag = e.target.tagName.toLowerCase();
            if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'button' || targetTag === 'select') {
                e.preventDefault();
                return;
            }
            dragStartIndex = index;
            this.style.opacity = '0.4';
            this.style.backgroundColor = 'rgba(0,0,0,0.05)';
        });

        row.addEventListener('dragend', function () {
            this.style.opacity = '1';
            this.style.backgroundColor = '';
            rows.forEach(r => r.style.borderTop = '');
        });

        row.addEventListener('dragover', function (e) {
            e.preventDefault();
        });

        row.addEventListener('dragenter', function (e) {
            e.preventDefault();
            this.style.borderTop = '3px solid var(--accent)';
        });

        row.addEventListener('dragleave', function () {
            this.style.borderTop = '';
        });

        row.addEventListener('drop', function () {
            this.style.borderTop = '';
            const dragEndIndex = index;

            if (dragStartIndex !== -1 && dragStartIndex !== dragEndIndex) {
                const itemToMove = studentsData.splice(dragStartIndex, 1)[0];
                studentsData.splice(dragEndIndex, 0, itemToMove);

                const newOrder = studentsData.map(s => s.id);
                localStorage.setItem(`studentOrder_${currentClass}`, JSON.stringify(newOrder));

                renderRosterTable();
            }
        });
    });
}

// --- STUDENT MANAGER ---
function toggleStudentDetails(id) {
    const div = document.getElementById(`details-${id}`);
    div.style.display = div.style.display === "block" ? "none" : "block";
}

function addParentInput(id) {
    const container = document.getElementById(`parent-container-${id}`);
    const newRow = document.createElement('div');
    newRow.className = 'parent-email-row';
    newRow.style.cssText = 'display: flex; gap: 5px; margin-bottom: 5px;';
    newRow.innerHTML = `
        <input type="text" class="parent-name-input" placeholder="Name" style="width: 30%; flex: 1; padding: 6px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--input-bg); color: var(--text-color);" onchange="saveStudentChanges(${id})">
        <input type="text" class="parent-rel-input" placeholder="Relation" style="width: 30%; flex: 1; padding: 6px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--input-bg); color: var(--text-color);" onchange="saveStudentChanges(${id})">
        <input type="text" class="parent-email-input" placeholder="Email" style="flex: 2; padding: 6px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--input-bg); color: var(--text-color);" onchange="saveStudentChanges(${id})">
    `;
    container.appendChild(newRow);
}

// Seamless Auto-Save Function
async function saveStudentChanges(id) {
    const fname = document.getElementById(`fname-${id}`).value.trim();
    const lname = document.getElementById(`lname-${id}`).value.trim();
    const sEmail = document.getElementById(`semail-${id}`).value.trim();

    const parentRows = document.getElementById(`parent-container-${id}`).querySelectorAll('.parent-email-row');
    let contactsList = [];
    let emailList = [];

    parentRows.forEach(row => {
        let name = row.querySelector('.parent-name-input').value.trim();
        let rel = row.querySelector('.parent-rel-input').value.trim();
        let email = row.querySelector('.parent-email-input').value.trim();
        if (email || name) {
            contactsList.push({ name, rel, email });
            if (email) emailList.push(email);
        }
    });

    const guardian_email = emailList.join(',');
    const contacts_info = JSON.stringify(contactsList);
    const fullName = `${fname} ${lname}`.trim();

    // Silently update the local memory array without full table redraw
    const sIndex = studentsData.findIndex(s => s.id === id);
    if (sIndex > -1) {
        studentsData[sIndex].name = fullName;
        studentsData[sIndex].student_email = sEmail;
        studentsData[sIndex].guardian_email = guardian_email;
        studentsData[sIndex].contacts_info = contacts_info;

        // Visually update the header text specifically to avoid stealing focus
        const headerInfoDiv = document.getElementById(`student-header-info-${id}`);
        if (headerInfoDiv) {
            let contactsDisplayHtml = '';
            if (sEmail && sEmail !== '') {
                contactsDisplayHtml += `<div style="font-size: 0.8em; margin-top: 2px; line-height: 1.3;"><span style="color: gray;">${sEmail}</span></div>`;
            }
            contactsList.forEach(c => {
                if (c.email || c.name) {
                    contactsDisplayHtml += `<div style="font-size: 0.8em; margin-top: 6px; line-height: 1.3;"><span style="font-weight: bold; color: var(--text-color);">${c.name || 'Guardian'} ${c.rel ? `(${c.rel})` : ''}</span><br><span style="color: gray;">${c.email || 'No email'}</span></div>`;
                }
            });
            headerInfoDiv.innerHTML = `<h4 style="margin: 0; font-size: 1.1em;">${sIndex + 1}. ${fullName}</h4>${contactsDisplayHtml}`;
        }
    }

    try {
        await fetch(`http://localhost:3000/api/update/${id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: fullName,
                student_email: sEmail,
                guardian_email: guardian_email,
                contacts_info: contacts_info
            })
        });
    } catch (err) { console.error("Error auto-saving.", err); }
}

async function deleteStudent(event, id) {
    event.stopPropagation();
    if (confirm("Remove this student?")) {
        try {
            await fetch(`http://localhost:3000/api/delete/${id}`, { method: 'DELETE' });
            loadStudentsData();
        } catch (e) {
            console.error("DB Error", e);
            alert("Error trying to communicate with server");
        }
    }
}

async function deleteClassRoster() {
    if (confirm("Are you sure you want to delete EVERY student in this roster? This cannot be undone.")) {
        try {
            const response = await fetch(`http://localhost:3000/api/delete-class/${encodeURIComponent(currentClass)}`, { method: 'DELETE' });
            if (response.ok) {
                loadStudentsData();
            } else {
                alert("Failed to delete roster. Check server console.");
            }
        } catch (err) {
            alert("Server offline.");
        }
    }
}

// --- MANUAL ADD STUDENT LOGIC ---
function toggleAddStudentForm() {
    const form = document.getElementById('add-student-form');
    form.style.display = form.style.display === 'none' || form.style.display === '' ? 'block' : 'none';
}

async function saveNewStudent() {
    const fName = document.getElementById('new-fname').value.trim();
    const lName = document.getElementById('new-lname').value.trim();
    const sEmail = document.getElementById('new-semail').value.trim();
    const cName = document.getElementById('new-cname').value.trim();
    const cRel = document.getElementById('new-crel').value.trim();
    const cEmail = document.getElementById('new-cemail').value.trim();

    if (!fName || !lName) {
        return alert("First and Last name are required to add a student.");
    }

    const studentName = `${fName} ${lName}`;

    let contacts = [];
    let emails = [];

    if (cName || cEmail) {
        contacts.push({ name: cName, rel: cRel, email: cEmail });
        if (cEmail) emails.push(cEmail);
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
        document.getElementById('new-cname').value = '';
        document.getElementById('new-crel').value = '';
        document.getElementById('new-cemail').value = '';

        toggleAddStudentForm();
        loadStudentsData();

    } catch (err) {
        alert("Error adding student. Make sure your server is running.");
    }
}

// --- EMAIL LOGIC ---

function openTemplateModal() {
    const modal = document.getElementById('template-modal');
    const editor = document.getElementById('template-textarea');
    let template = localStorage.getItem(`emailTemplate_${currentClass}`);

    if (!template) {
        template = DEFAULT_EMAIL_TEMPLATE;
    }
    editor.innerHTML = template;
    modal.style.display = 'flex';
}

function saveTemplate() {
    const editor = document.getElementById('template-textarea');
    localStorage.setItem(`emailTemplate_${currentClass}`, editor.innerHTML);
    closeTemplateModal();
    alert("Class email template saved successfully!");
}

function closeTemplateModal() {
    document.getElementById('template-modal').style.display = 'none';
}

function restoreDefaultGlobalTemplate() {
    if (confirm("Are you sure you want to revert to the default template? This will overwrite your current edits.")) {
        document.getElementById('template-textarea').innerHTML = DEFAULT_EMAIL_TEMPLATE;
    }
}


let currentIndividualEmailId = null;

function openIndividualEmailModal(event, id) {
    event.stopPropagation();
    currentIndividualEmailId = id;

    // Load the raw tag template saved specific to this student, or default back to global template
    const overrideKey = `emailOverride_${currentClass}_${activeUnitIndex}_${id}`;
    let draftMsg = localStorage.getItem(overrideKey);

    if (!draftMsg) {
        draftMsg = localStorage.getItem(`emailTemplate_${currentClass}`) || DEFAULT_EMAIL_TEMPLATE;
    }

    document.getElementById('individual-email-textarea').innerHTML = draftMsg;
    document.getElementById('individual-email-modal').style.display = 'flex';
}

function closeIndividualEmailModal() {
    document.getElementById('individual-email-modal').style.display = 'none';
    currentIndividualEmailId = null;
}

// Silently caches the custom text directly into localStorage as you type
function autoSaveIndividualEmail() {
    if (currentIndividualEmailId === null) return;
    const customText = document.getElementById('individual-email-textarea').innerHTML;
    const overrideKey = `emailOverride_${currentClass}_${activeUnitIndex}_${currentIndividualEmailId}`;
    localStorage.setItem(overrideKey, customText);
}

function restoreDefaultIndividualEmail() {
    if (confirm("Are you sure you want to revert to the default email format? This will overwrite your current edits.")) {
        const id = currentIndividualEmailId;
        const overrideKey = `emailOverride_${currentClass}_${activeUnitIndex}_${id}`;
        localStorage.removeItem(overrideKey);

        let draftMsg = localStorage.getItem(`emailTemplate_${currentClass}`) || DEFAULT_EMAIL_TEMPLATE;
        document.getElementById('individual-email-textarea').innerHTML = draftMsg;
    }
}

// Dynamically assembles the final HTML string with active values from database right before send
function buildGradeMessage(studentName, recipientName, sMarks, isStudent, customTemplate = null) {
    const mondayStr = unitsData[activeUnitIndex];
    let weekDate = getSafeMonday(mondayStr);

    let tableHeaders = `<th style="border: 1px solid black; padding: 5px; text-align: left; font-weight: bold;">Date</th>`;
    let tableTitles = `<td style="border: 1px solid black; padding: 5px; text-align: left; font-weight: bold;">Lesson</td>`;
    let tableMarks = `<td style="border: 1px solid black; padding: 5px; text-align: left; font-weight: bold;">Marks</td>`;

    [0, 1, 2, 3, 4].forEach(i => {
        let d = getSafeMonday(mondayStr);
        d.setDate(d.getDate() + i);
        let fullDateName = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

        let title = (classLessonsData[activeUnitIndex] && classLessonsData[activeUnitIndex].titles) ? classLessonsData[activeUnitIndex].titles[i] : "";

        const mark = sMarks[`d${i}`] || "";
        const markText = mark === "" ? "" : `${mark}%`;
        const isLate = sMarks[`d${i}_late`] ? " (late)" : "";

        tableHeaders += `<th style="border: 1px solid black; padding: 5px; text-align: left; font-weight: normal;">${fullDateName}</th>`;
        tableTitles += `<td style="border: 1px solid black; padding: 5px; text-align: left;">${title}</td>`;
        tableMarks += `<td style="border: 1px solid black; padding: 5px; text-align: left;">${markText}${isLate}</td>`;
    });

    let gradesHTMLTable = `
    <table style="border-collapse: collapse; width: 100%; max-width: 800px; font-family: Arial, sans-serif; color: #333; margin-top: 5px; margin-bottom: 5px;">
        <tr>${tableHeaders}</tr>
        <tr>${tableTitles}</tr>
        <tr>${tableMarks}</tr>
    </table>`;

    let notesText = "";
    if (sMarks['notes'] && sMarks['notes'].trim() !== "") {
        notesText = sMarks['notes'].replace(/\n/g, '<br>');
    }

    let template = customTemplate || localStorage.getItem(`emailTemplate_${currentClass}`) || DEFAULT_EMAIL_TEMPLATE;

    // Purges old subheading text just in case it was saved natively globally before this update
    template = template.replace(/<strong>Teacher Notes:<\/strong><br>/g, '');

    // Clean up empty notes spacing elegantly so we don't get double spaces if notes are empty
    if (notesText === "") {
        template = template.replace(/\s*\[TeacherNotes\]\s*(?:<br>\s*){0,2}/g, '');
    }

    let text = template
        .replace(/\[RecipientName\]/g, recipientName)
        .replace(/\[StudentName\]/g, studentName)
        .replace(/\[Week\]/g, weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
        .replace(/\[Grades\]/g, gradesHTMLTable)
        .replace(/\[TeacherNotes\]/g, notesText)
        .replace(/\[TeacherName\]/g, `${currentUser.firstName} ${currentUser.lastName}`);

    return text.trim();
}

function getEmailAttachments(studentId) {
    const sMarks = (classMarksData[studentId] && classMarksData[studentId][activeUnitIndex]) || {};
    let attachments = [];
    if (sMarks['note_image']) {
        attachments.push({
            filename: 'teacher_note.jpg',
            path: sMarks['note_image']
        });
    }
    return attachments;
}

// Primary send function loops actively through dynamically generated templates
async function emailIndividualStudent(event, id) {
    event.stopPropagation();
    const btn = event.target;
    const student = studentsData.find(s => s.id === id);

    const oldText = btn.innerText; btn.innerText = "...";

    let emailsToSend = [];
    const attachments = getEmailAttachments(student.id);
    const sMarks = (classMarksData[student.id] && classMarksData[student.id][activeUnitIndex]) || {};

    // Retrieve the silent cached layout if one exists for this week
    const overrideKey = `emailOverride_${currentClass}_${activeUnitIndex}_${student.id}`;
    const customOverrideTemplate = localStorage.getItem(overrideKey);

    if (student.student_email && student.student_email.trim()) {
        emailsToSend.push({
            to: student.student_email.trim(),
            subject: `MathTrack Grades - ${student.name}`,
            text: buildGradeMessage(student.name, student.name, sMarks, true, customOverrideTemplate),
            attachments: attachments
        });
    }

    let parsedContacts = [];
    if (student.contacts_info) {
        try { parsedContacts = JSON.parse(student.contacts_info); } catch (e) { }
    } else if (student.guardian_email) {
        student.guardian_email.split(',').forEach(e => parsedContacts.push({ name: '', rel: '', email: e.trim() }));
    }

    parsedContacts.forEach(c => {
        if (c.email && c.email.trim()) {
            let contactName = (c.name && c.name.trim()) ? c.name.trim() : 'Guardian';
            emailsToSend.push({
                to: c.email.trim(),
                subject: `MathTrack Grades - ${student.name}`,
                text: buildGradeMessage(student.name, contactName, sMarks, false, customOverrideTemplate),
                attachments: attachments
            });
        }
    });

    if (emailsToSend.length === 0) {
        alert("No email addresses found for this student.");
        btn.innerText = oldText;
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/send-emails`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                emailsToSend: emailsToSend,
                senderEmail: currentUser.email,
                senderPassword: currentUser.appPassword
            })
        });
        btn.innerText = response.ok ? "Sent!" : "Fail";
    } catch (err) { btn.innerText = "Err"; }
    setTimeout(() => btn.innerText = oldText, 3000);
}

async function emailAllStudents() {
    const status = document.getElementById('emailStatus');
    status.innerText = "Generating reports...";

    let emailsToSend = [];

    studentsData.forEach(student => {
        const attachments = getEmailAttachments(student.id);
        const sMarks = (classMarksData[student.id] && classMarksData[student.id][activeUnitIndex]) || {};

        const overrideKey = `emailOverride_${currentClass}_${activeUnitIndex}_${student.id}`;
        const customOverrideTemplate = localStorage.getItem(overrideKey);

        if (student.student_email && student.student_email.trim()) {
            emailsToSend.push({
                to: student.student_email.trim(),
                subject: `MathTrack Grades - ${student.name}`,
                text: buildGradeMessage(student.name, student.name, sMarks, true, customOverrideTemplate),
                attachments: attachments
            });
        }

        let parsedContacts = [];
        if (student.contacts_info) {
            try { parsedContacts = JSON.parse(student.contacts_info); } catch (e) { }
        } else if (student.guardian_email) {
            student.guardian_email.split(',').forEach(e => parsedContacts.push({ name: '', rel: '', email: e.trim() }));
        }

        parsedContacts.forEach(c => {
            if (c.email && c.email.trim()) {
                let contactName = (c.name && c.name.trim()) ? c.name.trim() : 'Guardian';
                emailsToSend.push({
                    to: c.email.trim(),
                    subject: `MathTrack Grades - ${student.name}`,
                    text: buildGradeMessage(student.name, contactName, sMarks, false, customOverrideTemplate),
                    attachments: attachments
                });
            }
        });
    });

    if (emailsToSend.length === 0) {
        status.innerText = "❌ No emails found in class.";
        setTimeout(() => status.innerText = "", 4000);
        return;
    }

    try {
        status.innerText = "Sending to server...";
        const response = await fetch(`http://localhost:3000/api/send-emails`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                emailsToSend: emailsToSend,
                senderEmail: currentUser.email,
                senderPassword: currentUser.appPassword
            })
        });
        status.innerText = response.ok ? "✅ All grades dispatched!" : "❌ Failed. Check App Password.";
    } catch (err) { status.innerText = "❌ Server offline."; }
    setTimeout(() => status.innerText = "", 4000);
}

// --- CSV IMPORT & ROSTER DELETION ---
async function handleCSV() {
    const fileInput = document.getElementById('csv-file');
    const file = fileInput.files[0];
    if (!file) return alert("Select a file first.");

    const reader = new FileReader();
    reader.onload = async (e) => {
        const rows = e.target.result.split('\n');

        let startIndex = 1;
        let headers = [];

        for (let i = 0; i < rows.length; i++) {
            let rowLower = rows[i].toLowerCase();
            if (rowLower.includes('last name') && rowLower.includes('first name')) {
                headers = rows[i].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase().replace(/\s+/g, ' '));
                startIndex = i + 1;
                break;
            }
        }

        let hIdx = { sLast: -1, sFirst: -1, sEmail: -1, c1Rel: -1, c1Last: -1, c1First: -1, c1Email: -1, c2Rel: -1, c2Last: -1, c2First: -1, c2Email: -1 };

        headers.forEach((h, idx) => {
            if (h === 'last name' && hIdx.sLast === -1) hIdx.sLast = idx;
            else if (h === 'first name' && hIdx.sFirst === -1) hIdx.sFirst = idx;
            else if ((h.includes('student') && h.includes('email')) || h === 'email address') hIdx.sEmail = idx;
            else if (h.includes('1st') && h.includes('relationship')) hIdx.c1Rel = idx;
            else if (h.includes('1st') && h.includes('last name')) hIdx.c1Last = idx;
            else if (h.includes('1st') && h.includes('first name')) hIdx.c1First = idx;
            else if (h.includes('1st') && h.includes('email')) hIdx.c1Email = idx;
            else if (h.includes('2nd') && h.includes('relationship')) hIdx.c2Rel = idx;
            else if (h.includes('2nd') && h.includes('last name')) hIdx.c2Last = idx;
            else if (h.includes('2nd') && h.includes('first name')) hIdx.c2First = idx;
            else if (h.includes('2nd') && h.includes('email')) hIdx.c2Email = idx;
        });

        if (hIdx.sLast === -1) hIdx.sLast = 1;
        if (hIdx.sFirst === -1) hIdx.sFirst = 2;
        if (hIdx.c1Rel === -1) hIdx.c1Rel = 3;
        if (hIdx.c1Last === -1) hIdx.c1Last = 4;
        if (hIdx.c1First === -1) hIdx.c1First = 5;
        if (hIdx.c1Email === -1) hIdx.c1Email = 6;
        if (hIdx.c2Rel === -1) hIdx.c2Rel = 7;
        if (hIdx.c2Last === -1) hIdx.c2Last = 8;
        if (hIdx.c2First === -1) hIdx.c2First = 9;
        if (hIdx.c2Email === -1) hIdx.c2Email = 10;

        for (let i = startIndex; i < rows.length; i++) {
            const row = rows[i];
            if (!row.trim()) continue;

            const cols = row.split(',');
            if (cols.length < 3) continue;

            let safeGet = (idx) => (cols[idx] ? cols[idx].replace(/"/g, '').trim() : '');

            let lastName = safeGet(hIdx.sLast);
            let firstName = safeGet(hIdx.sFirst);
            let studentEmail = hIdx.sEmail !== -1 ? safeGet(hIdx.sEmail) : '';

            if (!lastName && !firstName) continue;
            let studentName = `${firstName} ${lastName}`.trim();

            let contacts = [];
            let emails = [];

            let c1EmailVal = safeGet(hIdx.c1Email);
            let c1FirstVal = safeGet(hIdx.c1First);
            let c1LastVal = safeGet(hIdx.c1Last);
            if (c1EmailVal.includes('@') || c1FirstVal || c1LastVal) {
                contacts.push({
                    rel: safeGet(hIdx.c1Rel),
                    name: `${c1FirstVal} ${c1LastVal}`.trim(),
                    email: c1EmailVal
                });
                if (c1EmailVal.includes('@')) emails.push(c1EmailVal);
            }

            let c2EmailVal = safeGet(hIdx.c2Email);
            let c2FirstVal = safeGet(hIdx.c2First);
            let c2LastVal = safeGet(hIdx.c2Last);
            if (c2EmailVal.includes('@') || c2FirstVal || c2LastVal) {
                contacts.push({
                    rel: safeGet(hIdx.c2Rel),
                    name: `${c2FirstVal} ${c2LastVal}`.trim(),
                    email: c2EmailVal
                });
                if (c2EmailVal.includes('@')) emails.push(c2EmailVal);
            }

            await fetch('http://localhost:3000/api/add', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: studentName,
                    student_email: studentEmail,
                    guardian_email: emails.join(','),
                    contacts_info: JSON.stringify(contacts),
                    class_name: currentClass
                })
            });
        }
        alert("Import complete.");
        loadStudentsData();
    };
    reader.readAsText(file);
}

// --- KEYBOARD NAVIGATION ---
document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const target = e.target;

        // Check if we are inside a mark cell
        const currentTd = target.closest('td.mark-cell');
        if (!currentTd) return;

        if (target.tagName.toLowerCase() === 'input' && (target.type === 'radio' || target.type === 'checkbox' || target.type === 'range')) {
            e.preventDefault(); // Stop default up/down behavior

            const currentRow = target.closest('tr.student-row');
            if (!currentRow) return;

            const tbody = currentRow.parentElement;
            const rows = Array.from(tbody.querySelectorAll('tr.student-row'));
            const rowIndex = rows.indexOf(currentRow);
            const cellIndex = Array.from(currentRow.children).indexOf(currentTd);

            let nextRowIndex = rowIndex + (e.key === 'ArrowDown' ? 1 : -1);
            if (nextRowIndex >= 0 && nextRowIndex < rows.length) {
                const nextRow = rows[nextRowIndex];
                const nextCell = nextRow.children[cellIndex];

                if (nextCell) {
                    // If target was a radio, find corresponding radio or slider
                    if (target.type === 'radio') {
                        const nextSliderContainer = nextCell.querySelector('.custom-slider-container');
                        if (nextSliderContainer && nextSliderContainer.style.display !== 'none') {
                            const nextSlider = nextCell.querySelector('input[type="range"]');
                            if (nextSlider) nextSlider.focus();
                        } else {
                            const nextRadios = Array.from(nextCell.querySelectorAll('input[type="radio"]'));
                            if (nextRadios.length > 0) {
                                const toFocus = nextRadios.find(r => r.value === target.value) || nextRadios.find(r => r.checked) || nextRadios[0];
                                toFocus.focus();
                            }
                        }
                    }
                    // If target was a slider, find the slider or radio
                    else if (target.type === 'range') {
                        const nextSliderContainer = nextCell.querySelector('.custom-slider-container');
                        if (nextSliderContainer && nextSliderContainer.style.display !== 'none') {
                            const nextSlider = nextCell.querySelector('input[type="range"]');
                            if (nextSlider) nextSlider.focus();
                        } else {
                            const nextRadios = Array.from(nextCell.querySelectorAll('input[type="radio"]'));
                            if (nextRadios.length > 0) {
                                const toFocus = nextRadios.find(r => r.checked) || nextRadios[0];
                                if (toFocus) toFocus.focus();
                            }
                        }
                    }
                    // If target was a checkbox, find the checkbox with the same label
                    else if (target.type === 'checkbox') {
                        const isLate = target.nextElementSibling && target.nextElementSibling.innerText.includes('Late');
                        const nextCheckboxes = Array.from(nextCell.querySelectorAll('input[type="checkbox"]'));
                        for (let cb of nextCheckboxes) {
                            if (cb.nextElementSibling && cb.nextElementSibling.innerText.includes(isLate ? 'Late' : 'Custom')) {
                                cb.focus();
                                break;
                            }
                        }
                    }
                }
            }
        }
    }
});

// --- PRINTING LOGIC ---
function printClassRoster() {
    let printDiv = document.getElementById('print-area');
    if (!printDiv) {
        printDiv = document.createElement('div');
        printDiv.id = 'print-area';
        document.body.appendChild(printDiv);
    }
    
    const mondayStr = unitsData[activeUnitIndex];
    let dateHeaders = `<th style="border: 1px solid black; padding: 8px; text-align: left; font-weight: bold; background-color: #f2f2f2;">Date</th>`;
    let lessonHeaders = `<th style="border: 1px solid black; padding: 8px; text-align: left; font-weight: bold; background-color: #f2f2f2;">Lesson</th>`;
    
    [0, 1, 2, 3, 4].forEach(i => {
        let d = getSafeMonday(mondayStr);
        d.setDate(d.getDate() + i);
        let fullDateName = d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' });
        let title = (classLessonsData[activeUnitIndex] && classLessonsData[activeUnitIndex].titles) ? classLessonsData[activeUnitIndex].titles[i] : "";
        
        dateHeaders += `<th style="border: 1px solid black; padding: 8px; text-align: left; font-weight: normal;">${fullDateName}</th>`;
        lessonHeaders += `<td style="border: 1px solid black; padding: 8px; text-align: left;">${title}</td>`;
    });
    
    let rowsHtml = '';
    studentsData.forEach(student => {
        const sMarks = (classMarksData[student.id] && classMarksData[student.id][activeUnitIndex]) || {};
        let studentRow = `<td style="border: 1px solid black; padding: 8px; font-weight: normal; width: 250px;">${student.name}</td>`;
        
        [0, 1, 2, 3, 4].forEach(i => {
            const mark = sMarks[`d${i}`] || "";
            const markText = mark === "" ? "" : `${mark}%`;
            const isLate = sMarks[`d${i}_late`] ? " (late)" : "";
            studentRow += `<td style="border: 1px solid black; padding: 8px; text-align: left;">${markText}${isLate}</td>`;
        });
        
        rowsHtml += `<tr>${studentRow}</tr>`;
    });
    
    let currentClassName = "Unknown Class";
    if (currentClass) {
        let parts = currentClass.split('_');
        if (parts.length > 1) {
            currentClassName = parts.slice(1).join('_');
        }
    }

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
    `;
    
    window.print();
}