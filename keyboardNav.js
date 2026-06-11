// Generic keyboard navigation for text inputs
document.addEventListener('keydown', function(e) { // Listen for any keydown event on the entire document
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return; // If the key pressed is not an arrow key, exit early

    const active = document.activeElement; // Get the currently focused element on the page
    if (!active) return; // If no element is actively focused, exit the function

    const isTextInput = (active.tagName === 'INPUT' && ['text', 'email', 'password', 'number', 'search', 'tel', 'url'].includes(active.type)) || active.tagName === 'TEXTAREA'; // Check if the active element is a text-based input or textarea
    if (!isTextInput) return; // If the active element is not a text input type, exit early

    // For text inputs, check cursor boundaries for left/right
    if (e.key === 'ArrowLeft' && active.selectionStart > 0) return; // If Left Arrow is pressed and the cursor isn't at the very beginning, allow normal typing movement and exit
    if (e.key === 'ArrowRight' && active.value !== undefined && active.selectionEnd !== null && active.selectionEnd < active.value.length) return; // If Right Arrow is pressed and the cursor isn't at the very end, allow normal typing movement and exit
    
    // For textareas, check line boundaries for up/down
    if (active.tagName === 'TEXTAREA') { // If the active element is a textarea specifically
        if (e.key === 'ArrowUp') { // If the Up Arrow was pressed
            const beforeCursor = active.value.substring(0, active.selectionStart); // Extract the text before the cursor
            if (beforeCursor.includes('\n')) return; // Not on first line // If there's a newline character before the cursor, it's not the top line, so allow normal movement
        } // End of ArrowUp block
        if (e.key === 'ArrowDown') { // If the Down Arrow was pressed
            const afterCursor = active.value.substring(active.selectionEnd); // Extract the text after the cursor
            if (afterCursor.includes('\n')) return; // Not on last line // If there's a newline character after the cursor, it's not the bottom line, so allow normal movement
        } // End of ArrowDown block
    } // End of textarea check

    // Find all focusable text inputs
    const focusableSelector = 'input[type="text"]:not([disabled]), input[type="email"]:not([disabled]), input[type="password"]:not([disabled]), input[type="number"]:not([disabled]), input[type="search"]:not([disabled]), input[type="tel"]:not([disabled]), input[type="url"]:not([disabled]), textarea:not([disabled])'; // CSS selector to grab all enabled text-like inputs
    const allFocusable = Array.from(document.querySelectorAll(focusableSelector)).filter(el => { // Convert the NodeList to an array and filter it
        // filter out hidden elements
        return el.offsetWidth > 0 && el.offsetHeight > 0 && window.getComputedStyle(el).visibility !== 'hidden'; // Only keep elements that take up space and are visibly rendered
    }); // End of filtering function

    const currentIndex = allFocusable.indexOf(active); // Find the index of the currently active element in our focusable array
    if (currentIndex === -1) return; // If the active element wasn't found in the list, exit early

    let nextIndex = currentIndex; // Initialize the next index pointer to the current index
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { // If the user pressed Down or Right
        nextIndex = currentIndex + 1; // Increment the target index to move forward
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { // If the user pressed Up or Left
        nextIndex = currentIndex - 1; // Decrement the target index to move backwards
    } // End of key direction check

    if (nextIndex >= 0 && nextIndex < allFocusable.length && nextIndex !== currentIndex) { // Ensure the next index is valid and different from the current one
        e.preventDefault(); // Stop the browser's default behavior for the arrow key (scrolling)
        allFocusable[nextIndex].focus(); // Explicitly focus the calculated next element
    } // End of focus shift block
}); // End of event listener
