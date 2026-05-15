const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser) window.location.href = 'index.html';

const storageKey = `savedClasses_${currentUser.email}`;
let classData = JSON.parse(localStorage.getItem(storageKey)) || [];
let currentClass = "Unknown Class";

let unitsData = [];
let activeUnitIndex = 0;

let classLessonsData = {};
let classMarksData = {};
let studentsData = [];

function attachEyeToggles() {
    const toggleApp = document.getElementById('toggleProfApp');
    const togglePin = document.getElementById('toggleProfPin');
    if (toggleApp) {
        toggleApp.addEventListener('click', function() {
            const input = document.getElementById('prof-apppass');
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            this.textContent = type === 'password' ? '👁️' : '🔒';
        });
    }
    if (togglePin) {
        togglePin.addEventListener('click', function() {
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
    document.getElementById('current-class-label').innerText = currentClass.replace(currentUser.email + "_", "");

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
    document.getElementById('toggleProfApp').textContent = '👁️';
    document.getElementById('toggleProfPin').textContent = '👁️';

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
        } catch(e) { console.error("DB Migration Error", e); }

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

function renderClassNav() {
    const navBar = document.getElementById('class-nav-bar');
    navBar.innerHTML = '';
    for (let i = 0; i < 4; i++) {
        const btn = document.createElement('button');
        btn.className = 'btn-class-nav';
        if (i < classData.length) {
            btn.innerText = classData[i].name;
            btn.style.backgroundColor = 'var(--primary)';
            if (`${currentUser.email}_${classData[i].name}` === currentClass) btn.style.boxShadow = '0 0 0 3px var(--accent)';
            btn.onclick = () => window.location.href = `studentList.html?class=${encodeURIComponent(currentUser.email + '_' + classData[i].name)}`;
        } else {
            btn.innerText = '+ Untitled';
            btn.style.backgroundColor = '#a9a9a9';
            btn.onclick = () => {
                const newClass = { name: `Untitled`, students: 0 };
                classData.push(newClass);
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
    unitsData = JSON.parse(localStorage.getItem(unitStorageKey)) || ["Unit 1"];
    localStorage.setItem(unitStorageKey, JSON.stringify(unitsData));
    renderUnits();
}

function renderUnits() {
    const container = document.getElementById('units-container');
    container.innerHTML = '';
    unitsData.forEach((unitName, index) => {
        const unitDiv = document.createElement('div');
        unitDiv.className = `unit-box ${index === activeUnitIndex ? 'active' : ''}`;
        unitDiv.innerText = unitName;
        unitDiv.onclick = () => selectUnit(index);

        const delBtn = document.createElement('button');
        delBtn.className = 'unit-delete';
        delBtn.innerText = '×';

        delBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm(`Delete this unit and all its marks?`)) {
                unitsData.splice(index, 1);

                for (let i = 0; i < unitsData.length; i++) {
                    unitsData[i] = `Unit ${i + 1}`;
                }

                delete classLessonsData[index];
                localStorage.setItem(`units_${currentClass}`, JSON.stringify(unitsData));
                localStorage.setItem(`lessons_${currentClass}`, JSON.stringify(classLessonsData));
                activeUnitIndex = 0;
                renderUnits();
                renderRosterTable();
            }
        };
        unitDiv.appendChild(delBtn);
        container.appendChild(unitDiv);
    });

    if (unitsData.length < 10) {
        const addBox = document.createElement('div');
        addBox.className = 'unit-add-box';
        addBox.innerText = '+';
        addBox.onclick = () => {
            unitsData.push(`Unit ${unitsData.length + 1}`);
            localStorage.setItem(`units_${currentClass}`, JSON.stringify(unitsData));
            renderUnits();
        };
        container.appendChild(addBox);
    }
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
        renderRosterTable();
    } catch (err) {
        document.getElementById('roster-container').innerHTML = '<p style="color:var(--danger);">Error connecting to server.</p>';
    }
}

function ensureUnitStructure() {
    if (!classLessonsData[activeUnitIndex]) {
        classLessonsData[activeUnitIndex] = { lessons: [], hasTest: false, testDate: '' };
    }
}

function addLesson() {
    ensureUnitStructure();
    const unit = classLessonsData[activeUnitIndex];
    if (unit.lessons.length < 12) {
        const nextId = unit.lessons.length + 1;
        unit.lessons.push({ id: nextId, date: '' });
        localStorage.setItem(`lessons_${currentClass}`, JSON.stringify(classLessonsData));
        renderRosterTable();
    }
}

function deleteLesson(lessonIndex) {
    if (confirm("Are you sure you want to delete this lesson? The remaining lessons and grades will be shifted down.")) {
        ensureUnitStructure();
        const lessons = classLessonsData[activeUnitIndex].lessons;
        const deletedId = lessons[lessonIndex].id;

        studentsData.forEach(student => {
            const sMarks = classMarksData[student.id] && classMarksData[student.id][activeUnitIndex];
            if (sMarks) {
                delete sMarks[`l${deletedId}`];
                delete sMarks[`l${deletedId}_late`];
                delete sMarks[`l${deletedId}_custom`];

                for (let i = lessonIndex + 1; i < lessons.length; i++) {
                    const oldId = lessons[i].id;
                    const newId = oldId - 1;

                    if (sMarks[`l${oldId}`] !== undefined) {
                        sMarks[`l${newId}`] = sMarks[`l${oldId}`];
                        delete sMarks[`l${oldId}`];
                    }
                    if (sMarks[`l${oldId}_late`] !== undefined) {
                        sMarks[`l${newId}_late`] = sMarks[`l${oldId}_late`];
                        delete sMarks[`l${oldId}_late`];
                    }
                    if (sMarks[`l${oldId}_custom`] !== undefined) {
                        sMarks[`l${newId}_custom`] = sMarks[`l${oldId}_custom`];
                        delete sMarks[`l${oldId}_custom`];
                    }
                }
            }
        });

        lessons.splice(lessonIndex, 1);
        lessons.forEach((l, i) => { l.id = i + 1; });

        localStorage.setItem(`marks_${currentClass}`, JSON.stringify(classMarksData));
        localStorage.setItem(`lessons_${currentClass}`, JSON.stringify(classLessonsData));
        renderRosterTable();
    }
}

function addTest() {
    ensureUnitStructure();
    classLessonsData[activeUnitIndex].hasTest = true;
    localStorage.setItem(`lessons_${currentClass}`, JSON.stringify(classLessonsData));
    renderRosterTable();
}

function deleteTest() {
    if (confirm("Are you sure you want to delete the test?")) {
        ensureUnitStructure();
        classLessonsData[activeUnitIndex].hasTest = false;
        classLessonsData[activeUnitIndex].testDate = '';
        localStorage.setItem(`lessons_${currentClass}`, JSON.stringify(classLessonsData));
        renderRosterTable();
    }
}

function updateLessonDate(lessonIndex, dateStr) {
    classLessonsData[activeUnitIndex].lessons[lessonIndex].date = dateStr;
    localStorage.setItem(`lessons_${currentClass}`, JSON.stringify(classLessonsData));
}

function updateTestDate(dateStr) {
    classLessonsData[activeUnitIndex].testDate = dateStr;
    localStorage.setItem(`lessons_${currentClass}`, JSON.stringify(classLessonsData));
}

// --- NEW GRADE UI LOGIC ---
function toggleCustomView(checkbox, studentId, markKey) {
    const cellDiv = checkbox.closest('.mark-cell-wrapper');
    const radioGroup = cellDiv.querySelector('.radio-group-container');
    const sliderGroup = cellDiv.querySelector('.custom-slider-container');

    if (checkbox.checked) {
        radioGroup.style.display = 'none';
        sliderGroup.style.display = 'flex'; // Use flex to maintain vertical alignment
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
    if (studentsData.length === 0) {
        container.innerHTML = '<p>No students tracked. Please import a CSV above.</p>';
        return;
    }

    ensureUnitStructure();
    const unitData = classLessonsData[activeUnitIndex];
    const unitNum = activeUnitIndex + 1;

    let thHTML = `<th style="text-align:left;">Student Details</th>`;

    unitData.lessons.forEach((l, idx) => {
        thHTML += `
                <th>
                    <div class="lesson-header">
                        <button class="col-delete" onclick="deleteLesson(${idx})">×</button>
                        <span>Lesson ${unitNum}.${l.id}</span>
                        <input type="date" class="lesson-date" value="${l.date}" onchange="updateLessonDate(${idx}, this.value)">
                    </div>
                </th>`;
    });

    if (unitData.hasTest) {
        thHTML += `
                <th>
                    <div class="lesson-header">
                        <button class="col-delete" onclick="deleteTest()">×</button>
                        <span style="color:var(--danger);">Test</span>
                        <input type="date" class="lesson-date" value="${unitData.testDate}" onchange="updateTestDate(this.value)">
                    </div>
                </th>`;
    }

    let btnHTML = '';
    if (unitData.lessons.length < 12) btnHTML += `<button class="btn-add-lesson" onclick="addLesson()">+ Lesson</button>`;
    if (!unitData.hasTest) btnHTML += `<button class="btn-add-lesson" style="background:var(--danger);" onclick="addTest()">+ Test</button>`;

    thHTML += `<th style="width: 80px;"><div class="add-col-controls">${btnHTML}</div></th>`;
    thHTML += `<th style="min-width: 250px;"><div class="lesson-header"><span>Teacher Notes</span></div></th>`;

    let tbodyHTML = '';
    studentsData.forEach(student => {
        const nameParts = student.name ? student.name.split(' ') : ["Unknown"];
        const fName = nameParts[0]; 
        const lName = nameParts.slice(1).join(' ');
        const sMarks = (classMarksData[student.id] && classMarksData[student.id][activeUnitIndex]) || {};

        let parsedContacts = [];
        if (student.contacts_info) {
            try { parsedContacts = JSON.parse(student.contacts_info); } catch(e) {}
        } else if (student.guardian_email) {
            student.guardian_email.split(',').forEach(e => parsedContacts.push({name: '', rel: '', email: e.trim()}));
        }

        // Build the Display HTML for underneath the student name
        let contactsDisplayHtml = '';
        
        // Removed the "Student" heading, leaving just the email in grey
        if (student.student_email && student.student_email.trim() !== '') {
            contactsDisplayHtml += `<div style="font-size: 0.8em; margin-top: 2px; line-height: 1.3;">
                <span style="color: gray;">${student.student_email.trim()}</span>
            </div>`;
        }

        parsedContacts.forEach(c => {
            if(c.email || c.name) {
                contactsDisplayHtml += `<div style="font-size: 0.8em; margin-top: 6px; line-height: 1.3;">
                    <span style="font-weight: bold; color: var(--text-color);">${c.name || 'Guardian'} ${c.rel ? `(${c.rel})` : ''}</span><br>
                    <span style="color: gray;">${c.email || 'No email'}</span>
                </div>`;
            }
        });

        if (parsedContacts.length === 0) parsedContacts.push({name: '', rel: '', email: ''});

        let parentEditHtml = '';
        parsedContacts.forEach(c => {
            parentEditHtml += `
                <div class="parent-email-row" style="display: flex; gap: 5px; margin-bottom: 5px;">
                    <input type="text" class="parent-name-input" placeholder="Name" value="${c.name || ''}" style="width: 30%; flex: 1; padding: 6px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--input-bg); color: var(--text-color);">
                    <input type="text" class="parent-rel-input" placeholder="Relation" value="${c.rel || ''}" style="width: 30%; flex: 1; padding: 6px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--input-bg); color: var(--text-color);">
                    <input type="text" class="parent-email-input" placeholder="Email" value="${c.email || ''}" style="flex: 2; padding: 6px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--input-bg); color: var(--text-color);">
                </div>
            `;
        });

        let trHTML = `
                <tr>
                    <td class="student-cell">
                        <div class="student-card">
                            <div class="student-header" onclick="toggleStudentDetails(${student.id})" style="align-items: flex-start;">
                                <div>
                                    <h4 style="margin: 0; font-size: 1.1em;">${student.name}</h4>
                                    ${contactsDisplayHtml}
                                </div>
                                <div class="student-actions" style="align-items: flex-start;">
                                    <button class="btn btn-success" style="font-size: 0.75em; padding: 4px 8px;" onclick="emailIndividualStudent(event, ${student.id})">Send</button>
                                    <button class="btn btn-danger" style="font-size: 0.75em; padding: 4px 8px;" onclick="deleteStudent(event, ${student.id})">Del</button>
                                </div>
                            </div>
                            <div class="student-details" id="details-${student.id}">
                                <div class="form-row">
                                    <div class="form-group"><label>First</label><input type="text" id="fname-${student.id}" value="${fName}"></div>
                                    <div class="form-group"><label>Last</label><input type="text" id="lname-${student.id}" value="${lName}"></div>
                                </div>
                                <div class="form-group" style="margin-bottom:10px;"><label>Student Email (Optional)</label><input type="text" id="semail-${student.id}" value="${student.student_email || ''}"></div>
                                <div class="form-group" id="parent-container-${student.id}"><label>Contacts (Name, Relationship, Email)</label>
                                    ${parentEditHtml}
                                </div>
                                <div style="display:flex; justify-content:space-between; margin-top: 10px;">
                                    <button class="btn-add-circle" onclick="addParentInput(${student.id})">+</button>
                                    <button class="btn btn-primary" style="font-size: 0.8em;" onclick="saveStudentChanges(${student.id})">Save Edit</button>
                                </div>
                            </div>
                        </div>
                    </td>`;

        unitData.lessons.forEach(l => {
            const markKey = `l${l.id}`;
            const markVal = sMarks[markKey] || '';
            const isLate = sMarks[markKey + '_late'] || false;
            const isCustom = sMarks[markKey + '_custom'] || false;
            trHTML += buildMarkCellHTML(student.id, markKey, markVal, isLate, isCustom);
        });

        if (unitData.hasTest) {
            const markVal = sMarks['test'] || '';
            const isLate = sMarks['test_late'] || false;
            const isCustom = sMarks['test_custom'] || false;
            trHTML += buildMarkCellHTML(student.id, 'test', markVal, isLate, isCustom);
        }

        trHTML += `<td></td>`;

        const studentNote = sMarks['notes'] || '';
        trHTML += `<td style="vertical-align: top;">
                    <textarea class="mark-input" style="width: 100%; height: 100px; resize: vertical; text-align: left; font-weight: normal; font-family: inherit;" 
                        placeholder="Add private notes here..." 
                        onchange="updateNote(${student.id}, this.value)">${studentNote}</textarea>
                </td></tr>`;

        tbodyHTML += trHTML;
    });

    container.innerHTML = `<table class="roster-table"><thead><tr>${thHTML}</tr></thead><tbody>${tbodyHTML}</tbody></table>`;
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
        <input type="text" class="parent-name-input" placeholder="Name" style="width: 30%; flex: 1; padding: 6px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--input-bg); color: var(--text-color);">
        <input type="text" class="parent-rel-input" placeholder="Relation" style="width: 30%; flex: 1; padding: 6px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--input-bg); color: var(--text-color);">
        <input type="text" class="parent-email-input" placeholder="Email" style="flex: 2; padding: 6px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--input-bg); color: var(--text-color);">
    `;
    container.appendChild(newRow);
}

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
            contactsList.push({name, rel, email});
            if (email) emailList.push(email);
        }
    });

    const guardian_email = emailList.join(',');
    const contacts_info = JSON.stringify(contactsList);

    try {
        await fetch(`http://localhost:3000/api/update/${id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                name: `${fname} ${lname}`.trim(), 
                student_email: sEmail, 
                guardian_email: guardian_email,
                contacts_info: contacts_info
            })
        });
        alert("Student saved!"); loadStudentsData();
    } catch (err) { alert("Error saving."); }
}

// --- EMAIL LOGIC ---
function buildGradeMessage(studentName, recipientName, isStudent, studentId) {
    const unitName = unitsData[activeUnitIndex];
    const unitNum = activeUnitIndex + 1;
    const unitData = classLessonsData[activeUnitIndex] || { lessons: [], hasTest: false };
    const sMarks = (classMarksData[studentId] && classMarksData[studentId][activeUnitIndex]) || {};

    let text = "";
    
    if (isStudent) {
        text += `Hey ${studentName}, here is your progress this week:\n\n`;
    } else {
        text += `Hey ${recipientName}, here is your student's progress this week:\n\n`;
    }

    if (unitData.lessons.length === 0 && !unitData.hasTest) {
        text += "No assignments recorded yet.\n";
    } else {
        unitData.lessons.forEach(l => {
            const mark = sMarks[`l${l.id}`] || "Pending";
            const isLate = sMarks[`l${l.id}_late`] ? "(Handed in Late) " : "";
            const dStr = l.date ? ` (${l.date})` : "";
            text += `• Lesson ${unitNum}.${l.id}${dStr}:  ${isLate}${mark}\n`;
        });

        if (unitData.hasTest) {
            const mark = sMarks['test'] || "Pending";
            const isLate = sMarks['test_late'] ? "(Handed in Late) " : "";
            const dStr = unitData.testDate ? ` (${unitData.testDate})` : "";
            text += `• Unit Test${dStr}:  ${isLate}${mark}\n`;
        }
    }

    if (sMarks['notes'] && sMarks['notes'].trim() !== '') {
        text += `\n${sMarks['notes']}\n`;
    }

    text += `\nBest Regards,\n${currentUser.firstName} ${currentUser.lastName}`;

    return text;
}

async function emailIndividualStudent(event, id) {
    event.stopPropagation();
    const btn = event.target;
    const student = studentsData.find(s => s.id === id);

    const oldText = btn.innerText; btn.innerText = "...";
    
    let emailsToSend = [];
    
    if (student.student_email && student.student_email.trim()) {
        emailsToSend.push({
            to: student.student_email.trim(),
            subject: `MathTrack Grades: ${unitsData[activeUnitIndex]}`,
            text: buildGradeMessage(student.name, student.name, true, student.id)
        });
    }

    let parsedContacts = [];
    if (student.contacts_info) {
        try { parsedContacts = JSON.parse(student.contacts_info); } catch(e) {}
    } else if (student.guardian_email) {
        student.guardian_email.split(',').forEach(e => parsedContacts.push({name: '', rel: '', email: e.trim()}));
    }

    parsedContacts.forEach(c => {
        if (c.email && c.email.trim()) {
            let contactName = (c.name && c.name.trim()) ? c.name.trim() : 'Guardian';
            emailsToSend.push({
                to: c.email.trim(),
                subject: `MathTrack Grades: ${unitsData[activeUnitIndex]}`,
                text: buildGradeMessage(student.name, contactName, false, student.id)
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
        if (student.student_email && student.student_email.trim()) {
            emailsToSend.push({
                to: student.student_email.trim(),
                subject: `MathTrack Grades: ${unitsData[activeUnitIndex]}`,
                text: buildGradeMessage(student.name, student.name, true, student.id)
            });
        }

        let parsedContacts = [];
        if (student.contacts_info) {
            try { parsedContacts = JSON.parse(student.contacts_info); } catch(e) {}
        } else if (student.guardian_email) {
            student.guardian_email.split(',').forEach(e => parsedContacts.push({name: '', rel: '', email: e.trim()}));
        }

        parsedContacts.forEach(c => {
            if (c.email && c.email.trim()) {
                let contactName = (c.name && c.name.trim()) ? c.name.trim() : 'Guardian';
                emailsToSend.push({
                    to: c.email.trim(),
                    subject: `MathTrack Grades: ${unitsData[activeUnitIndex]}`,
                    text: buildGradeMessage(student.name, contactName, false, student.id)
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
        
        for(let i = 0; i < rows.length; i++) {
            let rowLower = rows[i].toLowerCase();
            if(rowLower.includes('last name') && rowLower.includes('first name')) {
                headers = rows[i].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase().replace(/\s+/g, ' '));
                startIndex = i + 1;
                break;
            }
        }

        let hIdx = { sLast: -1, sFirst: -1, sEmail: -1, c1Rel: -1, c1Last: -1, c1First: -1, c1Email: -1, c2Rel: -1, c2Last: -1, c2First: -1, c2Email: -1 };

        headers.forEach((h, idx) => {
            if(h === 'last name' && hIdx.sLast === -1) hIdx.sLast = idx;
            else if(h === 'first name' && hIdx.sFirst === -1) hIdx.sFirst = idx;
            else if((h.includes('student') && h.includes('email')) || h === 'email address') hIdx.sEmail = idx;
            else if(h.includes('1st') && h.includes('relationship')) hIdx.c1Rel = idx;
            else if(h.includes('1st') && h.includes('last name')) hIdx.c1Last = idx;
            else if(h.includes('1st') && h.includes('first name')) hIdx.c1First = idx;
            else if(h.includes('1st') && h.includes('email')) hIdx.c1Email = idx;
            else if(h.includes('2nd') && h.includes('relationship')) hIdx.c2Rel = idx;
            else if(h.includes('2nd') && h.includes('last name')) hIdx.c2Last = idx;
            else if(h.includes('2nd') && h.includes('first name')) hIdx.c2First = idx;
            else if(h.includes('2nd') && h.includes('email')) hIdx.c2Email = idx;
        });

        if(hIdx.sLast === -1) hIdx.sLast = 1;
        if(hIdx.sFirst === -1) hIdx.sFirst = 2;
        if(hIdx.c1Rel === -1) hIdx.c1Rel = 3;
        if(hIdx.c1Last === -1) hIdx.c1Last = 4;
        if(hIdx.c1First === -1) hIdx.c1First = 5;
        if(hIdx.c1Email === -1) hIdx.c1Email = 6;
        if(hIdx.c2Rel === -1) hIdx.c2Rel = 7;
        if(hIdx.c2Last === -1) hIdx.c2Last = 8;
        if(hIdx.c2First === -1) hIdx.c2First = 9;
        if(hIdx.c2Email === -1) hIdx.c2Email = 10;

        for (let i = startIndex; i < rows.length; i++) {
            const row = rows[i];
            if(!row.trim()) continue;
            
            const cols = row.split(','); 
            if(cols.length < 3) continue;

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

async function deleteStudent(event, id) {
    event.stopPropagation();
    if (confirm("Remove this student?")) {
        await fetch(`http://localhost:3000/api/delete/${id}`, { method: 'DELETE' });
        loadStudentsData();
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