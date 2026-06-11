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

    const clearBtn = document.getElementById('btn-clear-all'); // Get the static clear button
    if (clearBtn) clearBtn.style.display = rewriteList.length > 0 ? 'block' : 'none'; // Show clear button if list is not empty

    if (rewriteList.length === 0) { // If the rewrite list is empty
        container.innerHTML = '<p style="text-align: center; color: var(--text-color, #888); font-size: 1.1em; margin-top: 30px;">No students on the rewrite list.</p>'; // Show empty message
        return; // Stop rendering
    } // End of empty list check

    const searchInput = document.getElementById('rewrite-search');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    let html = '';
    html += '<table class="rewrite-table">';
    html += '<thead>';
    html += '<tr>';
    html += '<th style="width: 25%;">Student Name</th>';
    html += '<th style="width: 20%;">Class</th>';
    html += '<th style="width: 20%;">Date</th>';
    html += '<th style="width: 20%;">Test</th>';
    html += '<th style="width: 15%; text-align: center;">Action</th>';
    html += '</tr>';
    html += '</thead>';
    html += '<tbody>';

    let visibleCount = 0;
    rewriteList.forEach(function (student, index) {
        let displayStyle = '';
        if (query && !(student.name || '').toLowerCase().includes(query)) {
            displayStyle = 'display: none;';
        } else {
            visibleCount++;
        }

        html += `<tr style="${displayStyle}" draggable="true" ondragstart="handleRewriteDragStart(event, ${index})" ondragover="event.preventDefault(); this.style.backgroundColor='rgba(139,107,35,0.1)';" ondragleave="this.style.backgroundColor=''" ondrop="handleRewriteDrop(event, ${index}); this.style.backgroundColor=''" ondragend="this.style.backgroundColor=''">`;
        const studentIdArg = student.studentId ? student.studentId : 'null';
        html += `<td style="cursor: pointer; color: #3498db;" onclick="openStudentMarksModal('${student.className || ''}', '${(student.name || '').replace(/'/g, "\\'")}', ${studentIdArg})"><strong>${student.name || ''}</strong></td>`;
        html += `<td><input type="text" value="${student.className || ''}" onchange="updateRewriteEntry(${index}, 'className', this.value)"></td>`;
        html += `<td><input type="text" value="${student.date || ''}" onchange="updateRewriteEntry(${index}, 'date', this.value)"></td>`;
        html += `<td><input type="text" value="${student.test || ''}" onchange="updateRewriteEntry(${index}, 'test', this.value)"></td>`;
        html += '<td style="text-align: center;">';
        html += `<button class="btn-rewrite-delete" onclick="removeFromRewriteList(${index})">Delete</button>`;
        html += '</td>';
        html += '</tr>';
    });

    html += '</tbody>';
    html += '</table>';

    if (visibleCount === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-color, #888); font-size: 1.1em; margin-top: 30px;">No students match your search.</p>';
    } else {
        container.innerHTML = html;
    }
} // End of renderRewriteList function

function updateRewriteEntry(index, field, value) { // Updates a specific field for a student on the rewrite list
    const rewriteList = JSON.parse(localStorage.getItem('rewriteList') || '[]'); // Read current rewrite list
    if (rewriteList[index]) { // Ensure the student exists at that index
        rewriteList[index][field] = value; // Update the specified field
        localStorage.setItem('rewriteList', JSON.stringify(rewriteList)); // Save updated list
    } // End of check
} // End of updateRewriteEntry function

window.handleRewriteDragStart = function(e, originalIndex) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', originalIndex);
};

window.sortRewriteStudents = function() {
    const sortSelect = document.getElementById('rewrite-sort');
    if (!sortSelect) return;
    const sortMode = sortSelect.value;
    if (!sortMode) return;
    
    const rewriteList = JSON.parse(localStorage.getItem('rewriteList') || '[]');
    rewriteList.sort((a, b) => {
        const nameA = a.name || '';
        const nameB = b.name || '';
        const partsA = nameA.split(' ');
        const partsB = nameB.split(' ');
        const firstA = partsA[0] || '';
        const firstB = partsB[0] || '';
        const lastA = partsA.slice(1).join(' ') || firstA;
        const lastB = partsB.slice(1).join(' ') || firstB;

        if (sortMode === 'first-asc') return firstA.localeCompare(firstB);
        if (sortMode === 'first-desc') return firstB.localeCompare(firstA);
        if (sortMode === 'last-asc') {
            let res = lastA.localeCompare(lastB);
            if (res === 0) res = firstA.localeCompare(firstB);
            return res;
        }
        if (sortMode === 'last-desc') {
            let res = lastB.localeCompare(lastA);
            if (res === 0) res = firstB.localeCompare(firstA);
            return res;
        }
        return 0;
    });
    
    localStorage.setItem('rewriteList', JSON.stringify(rewriteList));
    renderRewriteList();
};

window.handleRewriteDrop = function(e, targetOriginalIndex) {
    e.preventDefault();
    const sourceData = e.dataTransfer.getData('text/plain');
    if (!sourceData) return;
    const sourceOriginalIndex = parseInt(sourceData, 10);
    if (isNaN(sourceOriginalIndex) || sourceOriginalIndex === targetOriginalIndex) return;

    const rewriteList = JSON.parse(localStorage.getItem('rewriteList') || '[]');
    const itemToMove = rewriteList.splice(sourceOriginalIndex, 1)[0];
    rewriteList.splice(targetOriginalIndex, 0, itemToMove);
    
    localStorage.setItem('rewriteList', JSON.stringify(rewriteList));
    renderRewriteList();
};

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

function renderClassNavForRewrite() {
    const navBar = document.getElementById('class-nav-bar');
    if (!navBar) return;
    navBar.innerHTML = '';

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    const storageKey = `savedClasses_${currentUser.email}`;
    let classData = JSON.parse(localStorage.getItem(storageKey));
    if (!Array.isArray(classData)) classData = new Array(8).fill(null);

    for (let i = 0; i < 8; i++) {
        const btn = document.createElement('button');
        btn.className = 'btn-class-nav';

        if (classData[i] !== null) {
            btn.innerText = classData[i].name;
            btn.style.backgroundColor = 'var(--primary)';
            btn.onclick = () => openRewriteStudentModal(classData[i].name, currentUser.email);
        } else {
            btn.innerText = '+ Untitled';
            btn.style.backgroundColor = '#a9a9a9';
        }
        navBar.appendChild(btn);
    }
}

async function openRewriteStudentModal(className, email) {
    const uniqueDbClassName = email + "_" + className;
    document.getElementById('rewrite-modal-title').textContent = className;
    const listContainer = document.getElementById('rewrite-modal-student-list');
    listContainer.innerHTML = '<p>Loading students...</p>';
    document.getElementById('rewrite-student-modal').style.display = 'flex';

    try {
        const response = await fetch(`http://localhost:3000/api/data/${encodeURIComponent(uniqueDbClassName)}`);
        const json = await response.json();
        let students = json.data || [];
        
        listContainer.innerHTML = '';
        if (students.length === 0) {
            listContainer.innerHTML = '<p>No students found in this class.</p>';
            return;
        }

        students.forEach(student => {
            let row = document.createElement('div');
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.alignItems = 'center';
            row.style.borderBottom = '1px solid var(--border-color, #ccc)';
            row.style.paddingBottom = '5px';

            let nameSpan = document.createElement('span');
            nameSpan.textContent = student.name;
            nameSpan.style.fontWeight = 'bold';
            nameSpan.style.color = 'var(--text-color, #000)';

            let addBtn = document.createElement('button');
            addBtn.textContent = 'add';
            addBtn.style.backgroundColor = 'rgb(212, 175, 55)';
            addBtn.style.color = 'white';
            addBtn.style.border = 'none';
            addBtn.style.borderRadius = '5px';
            addBtn.style.padding = '5px 10px';
            addBtn.style.cursor = 'pointer';
            addBtn.style.fontWeight = 'bold';
            addBtn.onclick = () => {
                addToRewriteList(student.name, className, student.id);
                alert(`${student.name} added to rewrite list.`);
            };

            row.appendChild(nameSpan);
            row.appendChild(addBtn);
            listContainer.appendChild(row);
        });

    } catch (e) {
        listContainer.innerHTML = '<p style="color: red;">Error loading students.</p>';
    }
}

function closeRewriteStudentModal() {
    document.getElementById('rewrite-student-modal').style.display = 'none';
}

function addToRewriteList(studentName, className, studentId) {
    const rewriteList = JSON.parse(localStorage.getItem('rewriteList') || '[]');
    rewriteList.push({
        name: studentName,
        className: className,
        date: '',
        test: '',
        studentId: studentId
    });
    localStorage.setItem('rewriteList', JSON.stringify(rewriteList));
    renderRewriteList();
}

async function openStudentMarksModal(className, studentName, studentId) {
    if (!className) {
        alert("This student doesn't have a valid class assigned.");
        return;
    }

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    const uniqueDbClassName = currentUser.email + "_" + className;
    
    let modal = document.getElementById('student-marks-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'student-marks-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modalcontent" style="max-width: 600px; width: 100%;">
                <h2 id="student-marks-title" style="margin-top:0; color: rgb(139, 107, 35);">Marks</h2>
                <div id="student-marks-list" style="display: flex; flex-direction: column; gap: 10px; max-height: 400px; overflow-y: auto; padding-right: 10px;">
                </div>
                <div class="modalaction" style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
                    <button class="buttons cancelprofile" style="border:none; border-radius:5px; padding: 10px 20px;" onclick="document.getElementById('student-marks-modal').style.display='none'">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    document.getElementById('student-marks-title').textContent = `${studentName}'s Marks`;
    const listContainer = document.getElementById('student-marks-list');
    listContainer.innerHTML = '<p style="text-align: center;">Loading marks...</p>';
    modal.style.display = 'flex';
    
    try {
        if (!studentId) {
            const response = await fetch(`http://localhost:3000/api/data/${encodeURIComponent(uniqueDbClassName)}`);
            const json = await response.json();
            const students = json.data || [];
            const found = students.find(s => s.name === studentName);
            if (found) studentId = found.id;
        }
        
        if (!studentId) {
            listContainer.innerHTML = '<p style="text-align: center; color: var(--danger, red);">Student not found in the database.</p>';
            return;
        }
        
        const marksData = JSON.parse(localStorage.getItem(`marks_${uniqueDbClassName}`)) || {};
        const unitsData = JSON.parse(localStorage.getItem(`units_${uniqueDbClassName}`)) || [];
        const classLessonsData = JSON.parse(localStorage.getItem(`lessons_${uniqueDbClassName}`)) || {};
        
        const studentMarks = marksData[studentId] || {};
        
        if (unitsData.length === 0) {
            listContainer.innerHTML = '<p style="text-align: center; color: var(--text-color);">No weeks found for this class.</p>';
            return;
        }
        
        listContainer.innerHTML = '';
        for (let i = 0; i < unitsData.length; i++) {
            const weekStr = unitsData[i];
            const weekMarks = studentMarks[i] || {};
            
            let safeDate;
            if (weekStr.startsWith("Unit")) {
                safeDate = weekStr; 
            } else {
                const parts = weekStr.split('-');
                if (parts.length === 3) {
                    safeDate = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                } else {
                    safeDate = weekStr;
                }
            }
            
            let div = document.createElement('div');
            div.style.border = '2px solid var(--border-color, #ccc)';
            div.style.padding = '15px';
            div.style.borderRadius = '8px';
            div.style.backgroundColor = 'var(--input-bg, #f9f9f9)';
            
            let header = document.createElement('h3');
            header.style.marginTop = '0';
            header.style.marginBottom = '10px';
            header.style.color = 'rgb(139, 107, 35)';
            header.textContent = `Week of ${safeDate}`;
            div.appendChild(header);
            
            const days = ['d0', 'd1', 'd2', 'd3', 'd4'];
            let lessonTitles = ['Untitled', 'Untitled', 'Untitled', 'Untitled', 'Untitled'];
            if (classLessonsData[i] && classLessonsData[i].titles) {
                lessonTitles = classLessonsData[i].titles.map(t => t.trim() === '' ? 'Untitled' : t);
            }
            
            let marksHtml = '<ul style="margin:0; padding-left:20px; color: var(--text-color, #333);">';
            
            for (let j = 0; j < days.length; j++) {
                const markKey = days[j];
                const mark = weekMarks[markKey];
                const lessonName = lessonTitles[j];
                
                if (mark !== undefined && mark !== '') {
                    marksHtml += `<li style="margin-bottom: 5px;"><strong>${lessonName}:</strong> ${mark}% ${weekMarks[markKey + '_late'] ? '<span style="color:var(--danger, red); font-weight: bold;">(Late)</span>' : ''}</li>`;
                } else {
                    marksHtml += `<li style="margin-bottom: 5px;"><strong>${lessonName}:</strong> <span style="color: gray; font-style: italic;">No mark</span></li>`;
                }
            }
            marksHtml += '</ul>';
            
            div.innerHTML += marksHtml;
            listContainer.appendChild(div);
        }
    } catch (e) {
        listContainer.innerHTML = '<p style="text-align: center; color: var(--danger, red);">Error loading marks.</p>';
    }
}


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

function initTextbookThemeToggle() { // Initializes the theme toggle specifically for the textbooks page
    const themeToggle = document.getElementById('theme-toggle'); // Get the theme toggle input element
    if (!themeToggle) return; // Exit if the toggle is not found on the page
    
    // Note: Dark mode is already handled by script.js globally, but textbooks.html has its own inline listener.
    // To prevent conflicts with script.js, we only add this if we are on a page that needs it specifically.
    // The main script.js already does this on DOMContentLoaded. We will just leave the logic intact just in case.
    if (localStorage.getItem('theme') === 'dark') { // Check if dark mode is saved in localStorage
        document.body.classList.add('darkmode'); // Apply dark mode class to body
        themeToggle.checked = true; // Set the toggle switch to checked
    } // End of dark mode check
    
    themeToggle.addEventListener('change', () => { // Add listener for toggle changes
        document.body.classList.toggle('darkmode'); // Toggle the dark mode class on body
        localStorage.setItem('theme', document.body.classList.contains('darkmode') ? 'dark' : 'light'); // Save the preference to localStorage
    }); // End of event listener
} // End of initTextbookThemeToggle function

function switchTab(tabId) { // Switches the active tab on the textbooks page
    let btn = document.getElementById('tabbtn-' + tabId); // Get the tab button by ID
    let content = document.getElementById('tab-' + tabId); // Get the tab content by ID
    if (!btn && !content && tabId !== 'setup') { // If the tab doesn't exist and it's not setup
        tabId = 'setup'; // Fallback to setup tab
        btn = document.getElementById('tabbtn-setup'); // Get setup tab button
        content = document.getElementById('tab-setup'); // Get setup tab content
    } // End of fallback check

    activeTab = tabId; // Update the global active tab variable
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active')); // Remove active class from all buttons
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active')); // Remove active class from all contents

    if (btn) btn.classList.add('active'); // Add active class to the clicked button
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
    let liabilitiesBtn = document.getElementById('tabbtn-liabilities'); // Get the liabilities button
    if (!tabContainer || !liabilitiesBtn) return; // Exit if elements are missing

    coursesData.forEach(c => { // Loop through all courses
        let btn = document.createElement('button'); // Create a new button element
        btn.className = 'tab-btn dynamic-course-tab'; // Add styling classes
        btn.id = 'tabbtn-' + c.course_code; // Set unique ID based on course code
        btn.innerText = c.course_code; // Set button text to course code
        btn.onclick = () => switchTab(c.course_code); // Add click event to switch tab
        tabContainer.insertBefore(btn, liabilitiesBtn); // Insert before the liabilities tab
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
        let actionBtn = `
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
                <td>${actionBtn}</td>
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
        course_code,
        title: document.getElementById('new-title').value,
        publisher: document.getElementById('new-publisher').value,
        replacement_cost: parseFloat(document.getElementById('new-cost').value) || 0,
        total_quantity: parseInt(document.getElementById('new-qty').value) || 0
    }; // End of payload construction

    let res = await fetch(API_BASE + '/api/inventory/courses', { // Send POST request
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }); // End of fetch

    if (!res.ok) { // Check for errors
        let errorText = 'Failed to add course.'; // Default error message
        try { // Try to parse response error
            const errorData = await res.json();
            if (errorData && errorData.error) errorText = errorData.error; // Extract server error
        } catch (_) { } // Ignore parse errors
        setCourseStatus(errorText, 'error'); // Display error
        alert(errorText); // Alert error
        return; // Halt execution
    } // End of error handling

    // Clear inputs
    document.getElementById('new-course').value = '';
    document.getElementById('new-title').value = '';
    document.getElementById('new-publisher').value = '';
    document.getElementById('new-cost').value = '';
    document.getElementById('new-qty').value = '';
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ copy_number, course_code, student_name: '', teacher_name: '', location_status: '' })
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
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            student_name: copy.student_name,
            teacher_name: copy.teacher_name,
            location_status: copy.location_status
        })
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            date_logged: today,
            student_name: copy.student_name || 'Unknown',
            teacher_name: copy.teacher_name || 'Unknown',
            course_code: copy.course_code,
            copy_number: copy.copy_number,
            fine_amount: cost
        })
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
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome: value })
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
