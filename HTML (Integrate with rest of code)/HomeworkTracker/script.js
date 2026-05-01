function togglePassword(inputId) {
    // Find the input field by its ID
    const passwordInput = document.getElementById(inputId);

    // Find the button next to it to change its text
    const toggleButton = passwordInput.nextElementSibling;

    // Check the current type and swap it
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        toggleButton.textContent = "Hide";
    } else {
        passwordInput.type = "password";
        toggleButton.textContent = "Show";
    }
}

const theme = document.getElementById('theme-toggle');
const body = document.body;

// 1. Check if the user previously chose dark mode
const currentTheme = localStorage.getItem('theme');

// If they did, apply the dark mode class immediately and check the switch
if (currentTheme === 'dark') {
    body.classList.add('dark-mode');
    if (theme) {
        theme.checked = true;
    }
}

// 2. Listen for clicks on the toggle switch
if (theme) {
    theme.addEventListener('change', function () {
        if (this.checked) {
            body.classList.add('dark-mode'); // Turn ON dark mode
            localStorage.setItem('theme', 'dark'); // Save preference to localStorage
        } else {
            body.classList.remove('dark-mode'); // Turn OFF dark mode
            localStorage.setItem('theme', 'light'); // Save preference to localStorage
        }
    });
}