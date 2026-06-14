// --- AUTOMATED BACKEND SYNC ---
// This script intercepts all localStorage.setItem calls and silently syncs the data to the server
// This allows the backend cron job to send weekly automated emails with up-to-date grades.

let syncTimeout = null; // Executes code logic

function executeSync() { // Defines executeSync function
    const currentUserStr = localStorage.getItem('currentUser'); // Retrieves data from local storage
    if (!currentUserStr) return; // Conditional check
    
    let currentUser; // Executes code logic
    try {  // Executes code logic
        currentUser = JSON.parse(currentUserStr);  // Parses JSON data
    } catch(e) {  // Executes code logic
        return;  // Executes code logic
    } // End of block
    
    if (!currentUser || !currentUser.email) return; // Conditional check

    let appData = {}; // Executes code logic
    for (let i = 0; i < localStorage.length; i++) { // Starts loop
        const key = localStorage.key(i); // Executes code logic
        const val = localStorage.getItem(key); // Retrieves data from local storage
        try { // Executes code logic
            appData[key] = JSON.parse(val); // Parses JSON data
        } catch(e) { // Executes code logic
            appData[key] = val; // Store as raw string if not JSON
        } // End of block
    } // End of block

    fetch('http://localhost:3000/api/sync-teacher', {
        method: 'POST', // Executes code logic
        headers: { 'Content-Type': 'application/json' }, // Executes code logic
        body: JSON.stringify({ // Converts object to JSON string
            email: currentUser.email, // Executes code logic
            appPassword: currentUser.appPassword || '', // Executes code logic
            appData: appData // Executes code logic
        }), // Executes code logic
        keepalive: true // Ensure it sends even if the page unloads
    }).then(res => { // Executes code logic
        if (res.ok) console.log("Teacher data successfully synced to backend."); // Conditional check
    }).catch(err => console.error("Failed to sync teacher data to backend", err)); // Logs error to console
} // End of block

function syncDataToServer() { // Defines syncDataToServer function
    clearTimeout(syncTimeout); // Executes code logic
    // Debounce the sync so it doesn't spam the server on every keystroke
    syncTimeout = setTimeout(executeSync, 3000); // 3 second debounce
} // End of block

function forceSyncDataToServer() { // Defines forceSyncDataToServer function
    clearTimeout(syncTimeout); // Executes code logic
    executeSync(); // Run immediately
} // End of block

// Override localStorage.setItem to trigger a debounced sync on any data change
const originalSetItem = localStorage.setItem; // Saves data to local storage
localStorage.setItem = function(key, value) { // Saves data to local storage
    originalSetItem.apply(this, arguments); // Executes code logic
    syncDataToServer(); // Executes code logic
}; // Executes code logic

// Also trigger an immediate sync when the app loads
window.addEventListener('DOMContentLoaded', forceSyncDataToServer); // Adds event listener

