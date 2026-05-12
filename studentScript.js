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

    renderClassNav();
    initUnits();
    loadStudentsData();
};

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
        sliderGroup.style.display = 'block';
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
                    <input type="radio" style="margin: 0 0 2px 0; cursor: pointer;" name="mark_${studentId}_${markKey}" value="${val}" ${String(markVal) === val && !showSlider ? 'checked' : ''} onchange="updateMark(${studentId}, '${markKey}', this.value)">
                    ${val}
                </label>
            `).join('');

    return `<td class="mark-cell">
                <div class="mark-cell-wrapper" style="display: flex; flex-direction: column; gap: 8px; align-items: center; min-width: 140px;">
                    
                    <div style="display: flex; justify-content: space-between; width: 100%; font-size: 0.75em; padding: 0 5px;">
                        <label style="font-weight: normal; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                            <input type="checkbox" ${isLate ? 'checked' : ''} onchange="updateLateStatus(${studentId}, '${markKey}', this.checked)"> Late
                        </label>
                        <label style="font-weight: normal; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                            <input type="checkbox" ${showSlider ? 'checked' : ''} onchange="toggleCustomView(this, ${studentId}, '${markKey}')"> Custom
                        </label>
                    </div>
                    
                    <div class="radio-group-container" style="display: ${showSlider ? 'none' : 'flex'}; gap: 8px; justify-content: center; width: 100%; font-size: 0.75em;">
                        ${radios}
                    </div>
                    
                    <div class="custom-slider-container" style="display: ${showSlider ? 'block' : 'none'}; width: 100%; text-align: center;">
                        <input type="range" min="0" max="100" value="${markVal || 50}" style="width: 100%; cursor: pointer;" 
                            oninput="this.nextElementSibling.innerText = this.value; updateMark(${studentId}, '${markKey}', this.value)">
                        <span style="font-weight: bold; font-size: 0.85em; color: var(--accent);">${markVal || 50}</span>
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

    // BUILD HEADER
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

    // BUILD BODY
    let tbodyHTML = '';
    studentsData.forEach(student => {
        const nameParts = student.name ? student.name.split(' ') : ["Unknown"];
        const fName = nameParts[0]; const lName = nameParts.slice(1).join(' ');
        const pEmails = student.guardian_email ? student.guardian_email.split(',') : [""];
        const sMarks = (classMarksData[student.id] && classMarksData[student.id][activeUnitIndex]) || {};

        let trHTML = `
                <tr>
                    <td class="student-cell">
                        <div class="student-card">
                            <div class="student-header" onclick="toggleStudentDetails(${student.id})">
                                <h4 style="margin: 0; font-size: 1.1em;">${student.name}</h4>
                                <div class="student-actions">
                                    <button class="btn btn-success" style="font-size: 0.75em; padding: 4px 8px;" onclick="emailIndividualStudent(event, ${student.id})">Send</button>
                                    <button class="btn btn-danger" style="font-size: 0.75em; padding: 4px 8px;" onclick="deleteStudent(event, ${student.id})">Del</button>
                                </div>
                            </div>
                            <div class="student-details" id="details-${student.id}">
                                <div class="form-row">
                                    <div class="form-group"><label>First</label><input type="text" id="fname-${student.id}" value="${fName}"></div>
                                    <div class="form-group"><label>Last</label><input type="text" id="lname-${student.id}" value="${lName}"></div>
                                </div>
                                <div class="form-group" style="margin-bottom:10px;"><label>Student Email</label><input type="text" id="semail-${student.id}" value="${student.student_email || ''}"></div>
                                <div class="form-group" id="parent-container-${student.id}"><label>Parent(s)</label>
                                    ${pEmails.map((e) => `<div class="parent-email-row"><input type="text" class="parent-email-input" value="${e}"></div>`).join('')}
                                </div>
                                <div style="display:flex; justify-content:space-between; margin-top: 10px;">
                                    <button class="btn-add-circle" onclick="addParentInput(${student.id})">+</button>
                                    <button class="btn btn-primary" style="font-size: 0.8em;" onclick="saveStudentChanges(${student.id})">Save Edit</button>
                                </div>
                            </div>
                        </div>
                    </td>`;

        // Render Lesson Grade Cells with New UI
        unitData.lessons.forEach(l => {
            const markKey = `l${l.id}`;
            const markVal = sMarks[markKey] || '';
            const isLate = sMarks[markKey + '_late'] || false;
            const isCustom = sMarks[markKey + '_custom'] || false;
            trHTML += buildMarkCellHTML(student.id, markKey, markVal, isLate, isCustom);
        });

        // Render Test Grade Cell with New UI
        if (unitData.hasTest) {
            const markVal = sMarks['test'] || '';
            const isLate = sMarks['test_late'] || false;
            const isCustom = sMarks['test_custom'] || false;
            trHTML += buildMarkCellHTML(student.id, 'test', markVal, isLate, isCustom);
        }

        trHTML += `<td></td>`;

        // Render Notes Cell
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
    const newRow = document.createElement('div'); newRow.className = 'parent-email-row';
    newRow.innerHTML = `<input type="text" class="parent-email-input" placeholder="Parent Email">`;
    container.appendChild(newRow);
}
async function saveStudentChanges(id) {
    const fname = document.getElementById(`fname-${id}`).value.trim();
    const lname = document.getElementById(`lname-${id}`).value.trim();
    const sEmail = document.getElementById(`semail-${id}`).value.trim();
    const parentInputs = document.getElementById(`parent-container-${id}`).querySelectorAll('.parent-email-input');
    const parents = Array.from(parentInputs).map(inp => inp.value.trim()).filter(Boolean).join(',');

    try {
        await fetch(`http://localhost:3000/api/update/${id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: `${fname} ${lname}`, student_email: sEmail, guardian_email: parents })
        });
        alert("Student saved!"); loadStudentsData();
    } catch (err) { alert("Error saving."); }
}

// --- EMAIL LOGIC ---
function buildGradeMessage(student) {
    const unitName = unitsData[activeUnitIndex];
    const unitNum = activeUnitIndex + 1;
    const unitData = classLessonsData[activeUnitIndex] || { lessons: [], hasTest: false };
    const sMarks = (classMarksData[student.id] && classMarksData[student.id][activeUnitIndex]) || {};

    let text = `Hello ${student.name},\n\nHere is the latest grade report for ${unitName}:\n\n`;

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

    // APPEND TEACHER NOTE WITHOUT PREFIX
    if (sMarks['notes'] && sMarks['notes'].trim() !== '') {
        text += `\n${sMarks['notes']}\n`;
    }

    return text + "\nKeep up the hard work!";
}

async function emailIndividualStudent(event, id) {
    event.stopPropagation();
    const btn = event.target;
    const student = studentsData.find(s => s.id === id);

    const messageBody = buildGradeMessage(student);
    const subj = `MathTrack Grades: ${unitsData[activeUnitIndex]}`;

    const oldText = btn.innerText; btn.innerText = "...";
    try {
        const response = await fetch(`http://localhost:3000/send-individual/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subject: subj, text: messageBody })
        });
        btn.innerText = response.ok ? "Sent!" : "Fail";
    } catch (err) { btn.innerText = "Err"; }
    setTimeout(() => btn.innerText = oldText, 3000);
}

async function emailAllStudents() {
    const status = document.getElementById('emailStatus');
    status.innerText = "Generating reports...";

    const messagesPayload = {};
    const subj = `MathTrack Class Update: ${unitsData[activeUnitIndex]}`;

    studentsData.forEach(student => {
        messagesPayload[student.id] = {
            subject: subj,
            text: buildGradeMessage(student)
        };
    });

    try {
        status.innerText = "Sending to server...";
        const response = await fetch(`http://localhost:3000/send-all/${encodeURIComponent(currentClass)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: messagesPayload })
        });
        status.innerText = response.ok ? "✅ All grades dispatched!" : "❌ Server failed to send.";
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
        const rows = e.target.result.split('\n').slice(1);
        for (let row of rows) {
            const cols = row.split(',');
            if (cols.length < 3) continue;

            const email = cols[2].replace(/"/g, '').trim();
            if (!email.includes('@')) continue;

            await fetch('http://localhost:3000/api/add', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `${cols[1]} ${cols[0]}`.replace(/"/g, '').trim(),
                    student_email: email,
                    guardian_email: (cols[3] || "").replace(/"/g, '').trim(),
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
                alert("Roster cleared!");
                loadStudentsData();
            } else {
                alert("Failed to delete roster. Check server console.");
            }
        } catch (err) {
            alert("Server offline.");
        }
    }
}