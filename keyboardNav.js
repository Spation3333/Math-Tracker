// Generic keyboard navigation for text inputs
document.addEventListener('keydown', function(e) {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;

    const active = document.activeElement;
    if (!active) return;

    const isTextInput = (active.tagName === 'INPUT' && ['text', 'email', 'password', 'number', 'search', 'tel', 'url'].includes(active.type)) || active.tagName === 'TEXTAREA';
    if (!isTextInput) return;

    // For text inputs, check cursor boundaries for left/right
    if (e.key === 'ArrowLeft' && active.selectionStart > 0) return;
    if (e.key === 'ArrowRight' && active.value !== undefined && active.selectionEnd !== null && active.selectionEnd < active.value.length) return;
    
    // For textareas, check line boundaries for up/down
    if (active.tagName === 'TEXTAREA') {
        if (e.key === 'ArrowUp') {
            const beforeCursor = active.value.substring(0, active.selectionStart);
            if (beforeCursor.includes('\n')) return; // Not on first line
        }
        if (e.key === 'ArrowDown') {
            const afterCursor = active.value.substring(active.selectionEnd);
            if (afterCursor.includes('\n')) return; // Not on last line
        }
    }

    // Find all focusable text inputs
    const focusableSelector = 'input[type="text"]:not([disabled]), input[type="email"]:not([disabled]), input[type="password"]:not([disabled]), input[type="number"]:not([disabled]), input[type="search"]:not([disabled]), input[type="tel"]:not([disabled]), input[type="url"]:not([disabled]), textarea:not([disabled])';
    const allFocusable = Array.from(document.querySelectorAll(focusableSelector)).filter(el => {
        // filter out hidden elements
        return el.offsetWidth > 0 && el.offsetHeight > 0 && window.getComputedStyle(el).visibility !== 'hidden';
    });

    const currentIndex = allFocusable.indexOf(active);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        nextIndex = currentIndex + 1;
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        nextIndex = currentIndex - 1;
    }

    if (nextIndex >= 0 && nextIndex < allFocusable.length && nextIndex !== currentIndex) {
        e.preventDefault();
        allFocusable[nextIndex].focus();
    }
});
