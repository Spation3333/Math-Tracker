// --- Theme Logic ---
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;


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


// --- Initialization ---
window.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('newclass')) {
        updateClass();
    }
    if (document.getElementById('currentdate')) {
        displayDate();
    }
});


function displayDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentdate').textContent = new Date().toLocaleDateString('en-US', options);
}


// --- Class Selection & Data ---
let classData = JSON.parse(localStorage.getItem('savedClasses')) || [];
let dragStart;


// Helper to handle Custom Color Dropdowns
function toggleCustomColor(type) {
    const select = document.getElementById(`${type}-color-select`);
    const custom = document.getElementById(`${type}-color-custom`);
    if (select.value === 'custom') {
        custom.style.display = 'inline-block';
        custom.click(); // Auto-opens the RGB color picker
    } else {
        custom.style.display = 'none';
    }
}


// Helper to get the final color (either dropdown or custom)
function getFinalColor(type) {
    const select = document.getElementById(`${type}-color-select`);
    const custom = document.getElementById(`${type}-color-custom`);
    return select.value === 'custom' ? custom.value : select.value;
}


// Helper to set the dropdowns when editing an existing class
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


function openClass(editIndex = -1) {
    const modal = document.getElementById('modal');
    const title = document.getElementById('modalheader');
    const indexTracker = document.getElementById('edit-index');


    modal.style.display = 'flex';


    if (editIndex >= 0) {
        title.textContent = "Edit Class";
        indexTracker.value = editIndex;
        document.getElementById('classname').value = classData[editIndex].name;
        document.getElementById('weeklylesson').value = classData[editIndex].lesson;
        document.getElementById('evaluation').value = classData[editIndex].eval;


        // Load Saved Font and Colors
        document.getElementById('font-family').value = classData[editIndex].font || "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        setDropdownColor('bg', classData[editIndex].bgColor);
        setDropdownColor('text', classData[editIndex].textColor);
    } else {
        title.textContent = "Create New Class";
        indexTracker.value = -1;
        document.getElementById('classname').value = "";
        document.getElementById('weeklylesson').value = "";
        document.getElementById('evaluation').value = "";


        // Reset defaults
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
    const lesson = document.getElementById('weeklylesson').value;
    const eval = document.getElementById('evaluation').value;
    const font = document.getElementById('font-family').value;
    const bgColor = getFinalColor('bg');
    const textColor = getFinalColor('text');
    const editIndex = parseInt(document.getElementById('edit-index').value);


    // If editing, keep the previous student count. If new, set it to 0.
    const currentStudents = editIndex >= 0 ? classData[editIndex].students : 0;


    const newClass = {
        name: name,
        students: currentStudents, // Set default or existing
        lesson: lesson,
        eval: eval,
        font: font,
        bgColor: bgColor,
        textColor: textColor
    };


    if (editIndex >= 0) {
        classData[editIndex] = newClass;
    } else if (classData.length < 4) {
        classData.push(newClass);
    }


    localStorage.setItem('savedClasses', JSON.stringify(classData));
    closeClass();
    updateClass();
}


function deleteClass(index) {
    if (confirm("Delete this class?")) {
        classData.splice(index, 1);
        localStorage.setItem('savedClasses', JSON.stringify(classData));
        updateClass();
    }
}


function updateClass() {
    const grid = document.getElementById('newclass');
    if (!grid) return;


    grid.innerHTML = '';


    for (let i = 0; i < classData.length; i++) {
        const wrapper = document.createElement('div');
        wrapper.className = 'cardwrapper';
        wrapper.draggable = true;


        // Drag and Drop Logic
        wrapper.addEventListener('dragstart', function () { dragStartIndex = i; this.classList.add('dragging'); });
        wrapper.addEventListener('dragend', function () { this.classList.remove('dragging'); });
        wrapper.addEventListener('dragover', function (e) { e.preventDefault(); });
        wrapper.addEventListener('dragenter', function (e) { e.preventDefault(); this.classList.add('drag-over'); });
        wrapper.addEventListener('dragleave', function () { this.classList.remove('drag-over'); });
        wrapper.addEventListener('drop', function () {
            this.classList.remove('drag-over');
            const itemToMove = classData.splice(dragStartIndex, 1)[0];
            classData.splice(i, 0, itemToMove);
            localStorage.setItem('savedClasses', JSON.stringify(classData));
            updateClass();
        });


        const letter = document.createElement('div');
        letter.className = 'cardletter';
        letter.textContent = String.fromCharCode(65 + i);


        const card = document.createElement('div');
        card.className = 'classcard';


        card.style.backgroundColor = classData[i].bgColor || '#f9f9f9';


        // Unique ID so we can inject the live student count from the server
        const countId = `student-count-${i}`;


        // Added Font Family styling to the text container
        card.innerHTML = `
            <button class="buttons cardedit" onclick="event.stopPropagation(); openClass(${i})">✎</button>
            <button class="buttons carddelete" onclick="event.stopPropagation(); deleteClass(${i})">🗑️</button>
           
            <div onclick="window.location.href='studentList.html?class=${encodeURIComponent(classData[i].name)}'"
                 style="cursor: pointer; padding-top: 10px; font-family: ${classData[i].font};">
                <div class="class-title" style="color: ${classData[i].textColor || 'rgb(139, 107, 35)'};">${classData[i].name}</div>
               
                <p style="color: ${classData[i].textColor || 'black'};">Students: <span id="${countId}" style="font-weight:normal">Loading...</span></p>
                <p style="color: ${classData[i].textColor || 'black'};">Lesson: <span style="font-weight:normal">${classData[i].lesson}</span></p>
                <p style="color: ${classData[i].textColor || 'black'};">Next Eval: <span style="font-weight:normal">${classData[i].eval}</span></p>
            </div>
        `;


        wrapper.appendChild(letter);
        wrapper.appendChild(card);
        grid.appendChild(wrapper);


        // --- DYNAMIC DATABASE COUNTING ---
        // Ask the server how many students actually exist for this class
        fetch(`http://localhost:3000/api/data/${encodeURIComponent(classData[i].name)}`)
            .then(res => res.json())
            .then(data => {
                // If data exists, get the length of the array, otherwise 0
                const actualCount = (data.data) ? data.data.length : 0;
                document.getElementById(countId).textContent = actualCount;


                // Keep local storage silently updated with the true count
                classData[i].students = actualCount;
                localStorage.setItem('savedClasses', JSON.stringify(classData));
            })
            .catch(err => {
                // If the server isn't running, it will gracefully show "Offline" instead of breaking
                document.getElementById(countId).textContent = "Server Offline";
            });
    }


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
}
