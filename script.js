<<<<<<< HEAD
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;


=======
// --- Theme Logic ---
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

>>>>>>> 5ef86dac68c6895e96081190d71777c0c0f2eb67
function togglePassword(inputId) { //function to Show and Hide Password
    const password = document.getElementById(inputId); //Password That is in Textbox
    const toggleButton = password.nextElementSibling; //Toggle Switch

<<<<<<< HEAD

=======
>>>>>>> 5ef86dac68c6895e96081190d71777c0c0f2eb67
    if (password.type === "password") { //Checks Whether Password is Hidden or Showing
        password.type = "text"; //Password Shows Dots
        toggleButton.textContent = "🔒"; //Button Displays Hide
    } else { //Otherwise
        password.type = "password"; //Shows Full Password
        toggleButton.textContent = "👁️"; //Button Displays Show
    }
}

<<<<<<< HEAD

=======
>>>>>>> 5ef86dac68c6895e96081190d71777c0c0f2eb67
if (localStorage.getItem('theme') === 'dark') {
    body.classList.add('darkmode');
    if (themeToggle) themeToggle.checked = true;
}

<<<<<<< HEAD

=======
>>>>>>> 5ef86dac68c6895e96081190d71777c0c0f2eb67
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

<<<<<<< HEAD

=======
// --- Initialization ---
>>>>>>> 5ef86dac68c6895e96081190d71777c0c0f2eb67
window.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('newclass')) {
        updateClass();
    }
    if (document.getElementById('currentdate')) {
        displayDate();
    }
});

<<<<<<< HEAD

=======
>>>>>>> 5ef86dac68c6895e96081190d71777c0c0f2eb67
function displayDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentdate').textContent = new Date().toLocaleDateString('en-US', options);
}

<<<<<<< HEAD

const currentUser = JSON.parse(localStorage.getItem('currentUser'));


=======
// --- User Session Management ---
const currentUser = JSON.parse(localStorage.getItem('currentUser'));

// If someone tries to access select.html without logging in, kick them out!
>>>>>>> 5ef86dac68c6895e96081190d71777c0c0f2eb67
if (!currentUser && window.location.pathname.includes('select.html')) {
    window.location.href = 'index.html';
}

<<<<<<< HEAD

=======
// Update the Welcome Header with their actual name
>>>>>>> 5ef86dac68c6895e96081190d71777c0c0f2eb67
window.addEventListener('DOMContentLoaded', function () {
    if (currentUser && document.getElementById('welcome-header')) {
        document.getElementById('welcome-header').textContent = `Welcome ${currentUser.firstName} ${currentUser.lastName}!`;
    }
});

<<<<<<< HEAD

=======
// --- Class Selection & Data (ISOLATED PER USER) ---
// We now save classes under a unique key for EACH teacher
>>>>>>> 5ef86dac68c6895e96081190d71777c0c0f2eb67
const storageKey = currentUser ? `savedClasses_${currentUser.email}` : 'savedClasses';
let classData = JSON.parse(localStorage.getItem(storageKey)) || [];
let dragStart;

<<<<<<< HEAD

=======
// Helper to handle Custom Color Dropdowns
>>>>>>> 5ef86dac68c6895e96081190d71777c0c0f2eb67
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

<<<<<<< HEAD

=======
>>>>>>> 5ef86dac68c6895e96081190d71777c0c0f2eb67
function getFinalColor(type) {
    const select = document.getElementById(`${type}-color-select`);
    const custom = document.getElementById(`${type}-color-custom`);
    return select.value === 'custom' ? custom.value : select.value;
}

<<<<<<< HEAD

=======
>>>>>>> 5ef86dac68c6895e96081190d71777c0c0f2eb67
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

<<<<<<< HEAD

=======
>>>>>>> 5ef86dac68c6895e96081190d71777c0c0f2eb67
function openClass(editIndex = -1) {
    const modal = document.getElementById('modal');
    const title = document.getElementById('modalheader');
    const indexTracker = document.getElementById('edit-index');
    modal.style.display = 'flex';

<<<<<<< HEAD

=======
>>>>>>> 5ef86dac68c6895e96081190d71777c0c0f2eb67
    if (editIndex >= 0) {
        title.textContent = "Edit Class";
        indexTracker.value = editIndex;
        document.getElementById('classname').value = classData[editIndex].name;
        document.getElementById('weeklylesson').value = classData[editIndex].lesson;
        document.getElementById('evaluation').value = classData[editIndex].eval;
        document.getElementById('font-family').value = classData[editIndex].font || "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        setDropdownColor('bg', classData[editIndex].bgColor);
        setDropdownColor('text', classData[editIndex].textColor);
    } else {
        title.textContent = "Create New Class";
        indexTracker.value = -1;
        document.getElementById('classname').value = "";
        document.getElementById('weeklylesson').value = "";
        document.getElementById('evaluation').value = "";
        document.getElementById('font-family').selectedIndex = 0;
        setDropdownColor('bg', '#f9f9f9');
        setDropdownColor('text', '#000000');
    }
}

<<<<<<< HEAD

=======
>>>>>>> 5ef86dac68c6895e96081190d71777c0c0f2eb67
function closeClass() {
    document.getElementById('modal').style.display = 'none';
}

<<<<<<< HEAD

=======
>>>>>>> 5ef86dac68c6895e96081190d71777c0c0f2eb67
function saveClass() {
    const name = document.getElementById('classname').value;
    const lesson = document.getElementById('weeklylesson').value;
    const eval = document.getElementById('evaluation').value;
    const font = document.getElementById('font-family').value;
    const bgColor = getFinalColor('bg');
    const textColor = getFinalColor('text');
    const editIndex = parseInt(document.getElementById('edit-index').value);

<<<<<<< HEAD

    const currentStudents = editIndex >= 0 ? classData[editIndex].students : 0;


=======
    const currentStudents = editIndex >= 0 ? classData[editIndex].students : 0;

>>>>>>> 5ef86dac68c6895e96081190d71777c0c0f2eb67
    const newClass = {
        name: name,
        students: currentStudents,
        lesson: lesson,
        eval: eval,
        font: font,
        bgColor: bgColor,
        textColor: textColor
    };

<<<<<<< HEAD

=======
>>>>>>> 5ef86dac68c6895e96081190d71777c0c0f2eb67
    if (editIndex >= 0) {
        classData[editIndex] = newClass;
    } else if (classData.length < 4) {
        classData.push(newClass);
    }

<<<<<<< HEAD

=======
    // Save to the isolated user key!
>>>>>>> 5ef86dac68c6895e96081190d71777c0c0f2eb67
    localStorage.setItem(storageKey, JSON.stringify(classData));
    closeClass();
    updateClass();
}

<<<<<<< HEAD

=======
>>>>>>> 5ef86dac68c6895e96081190d71777c0c0f2eb67
function deleteClass(index) {
    if (confirm("Delete this class?")) {
        classData.splice(index, 1);
        localStorage.setItem(storageKey, JSON.stringify(classData));
        updateClass();
    }
}

<<<<<<< HEAD

=======
>>>>>>> 5ef86dac68c6895e96081190d71777c0c0f2eb67
function updateClass() {
    const grid = document.getElementById('newclass');
    if (!grid) return;
    grid.innerHTML = '';

<<<<<<< HEAD

=======
>>>>>>> 5ef86dac68c6895e96081190d71777c0c0f2eb67
    for (let i = 0; i < classData.length; i++) {
        const wrapper = document.createElement('div');
        wrapper.className = 'cardwrapper';
        wrapper.draggable = true;

<<<<<<< HEAD

=======
>>>>>>> 5ef86dac68c6895e96081190d71777c0c0f2eb67
        wrapper.addEventListener('dragstart', function () { dragStartIndex = i; this.classList.add('dragging'); });
        wrapper.addEventListener('dragend', function () { this.classList.remove('dragging'); });
        wrapper.addEventListener('dragover', function (e) { e.preventDefault(); });
        wrapper.addEventListener('dragenter', function (e) { e.preventDefault(); this.classList.add('drag-over'); });
        wrapper.addEventListener('dragleave', function () { this.classList.remove('drag-over'); });
        wrapper.addEventListener('drop', function () {
            this.classList.remove('drag-over');
            const itemToMove = classData.splice(dragStartIndex, 1)[0];
            classData.splice(i, 0, itemToMove);
            localStorage.setItem(storageKey, JSON.stringify(classData));
            updateClass();
        });

<<<<<<< HEAD

=======
>>>>>>> 5ef86dac68c6895e96081190d71777c0c0f2eb67
        const letter = document.createElement('div');
        letter.className = 'cardletter';
        letter.textContent = String.fromCharCode(65 + i);

<<<<<<< HEAD

=======
>>>>>>> 5ef86dac68c6895e96081190d71777c0c0f2eb67
        const card = document.createElement('div');
        card.className = 'classcard';
        card.style.backgroundColor = classData[i].bgColor || '#f9f9f9';

<<<<<<< HEAD

        const countId = `student-count-${i}`;


        const uniqueDbClassName = currentUser.email + "_" + classData[i].name;


=======
        const countId = `student-count-${i}`;

        // IMPORTANT: We append the teacher's email to the class name when routing to the roster!
        // This ensures the Node database keeps their students completely separate from other teachers.
        const uniqueDbClassName = currentUser.email + "_" + classData[i].name;

>>>>>>> 5ef86dac68c6895e96081190d71777c0c0f2eb67
        card.innerHTML = `
            <button class="buttons cardedit" onclick="event.stopPropagation(); openClass(${i})">✎</button>
            <button class="buttons carddelete" onclick="event.stopPropagation(); deleteClass(${i})">🗑️</button>
           
            <div onclick="window.location.href='studentList.html?class=${encodeURIComponent(uniqueDbClassName)}'"
                 style="cursor: pointer; padding-top: 10px; font-family: ${classData[i].font};">
                <div class="class-title" style="color: ${classData[i].textColor || 'rgb(139, 107, 35)'};">${classData[i].name}</div>
               
                <p style="color: ${classData[i].textColor || 'black'};">Students: <span id="${countId}" style="font-weight:normal">Loading...</span></p>
                <p style="color: ${classData[i].textColor || 'black'};">Lesson: <span style="font-weight:normal">${classData[i].lesson}</span></p>
                <p style="color: ${classData[i].textColor || 'black'};">Next Eval: <span style="font-weight:normal">${classData[i].eval}</span></p>
            </div>
        `;

<<<<<<< HEAD

=======
>>>>>>> 5ef86dac68c6895e96081190d71777c0c0f2eb67
        wrapper.appendChild(letter);
        wrapper.appendChild(card);
        grid.appendChild(wrapper);

<<<<<<< HEAD

=======
        // Fetch using the uniquely combined Teacher + Class Name
>>>>>>> 5ef86dac68c6895e96081190d71777c0c0f2eb67
        fetch(`http://localhost:3000/api/data/${encodeURIComponent(uniqueDbClassName)}`)
            .then(res => res.json())
            .then(data => {
                const actualCount = (data.data) ? data.data.length : 0;
                document.getElementById(countId).textContent = actualCount;
                classData[i].students = actualCount;
                localStorage.setItem(storageKey, JSON.stringify(classData));
            })
            .catch(err => {
                document.getElementById(countId).textContent = "Server Offline";
            });
    }

<<<<<<< HEAD

=======
>>>>>>> 5ef86dac68c6895e96081190d71777c0c0f2eb67
    if (classData.length < 4) {
        const addBoxWrapper = document.createElement('div');
        addBoxWrapper.className = 'cardwrapper';
        const spacerLetter = document.createElement('div');
        spacerLetter.className = 'cardletter';
        spacerLetter.innerHTML = '&nbsp;';
        const addBox = document.createElement('div');
        addBox.className = 'addbox';
        addBox.textContent = '+';
        addBox.onclick = function () { openClass(); };
        addBoxWrapper.appendChild(spacerLetter);
        addBoxWrapper.appendChild(addBox);
        grid.appendChild(addBoxWrapper);
    }
<<<<<<< HEAD
}
=======
}
>>>>>>> 5ef86dac68c6895e96081190d71777c0c0f2eb67
