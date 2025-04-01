 // Player Inactivity Timeout Handler
 let inactivityTimer;
 const TIMEOUT_DURATION = 20000; // 20 seconds in milliseconds

 // Function to reset the timer
 function resetInactivityTimer() {
     // Clear the existing timer if there is one
     if (inactivityTimer) {
         clearTimeout(inactivityTimer);
     }
     
     // Set a new timer
     inactivityTimer = setTimeout(logoutDueToInactivity, TIMEOUT_DURATION);
 }

 // Function to handle logout
 function logoutDueToInactivity() {
     console.log("User inactive for 20 seconds, logging out...");
     
     // You can add an alert to notify the user if desired
     alert("You have been logged out due to inactivity.");
     
     // Redirect to login page
     window.location.href = "login.html";
 }

 // Set up event listeners for user activity
 function setupInactivityDetection() {
     // Initialize the timer when the page loads
     resetInactivityTimer();
     
     // Reset timer on mouse movement
     document.addEventListener("mousemove", resetInactivityTimer);
     
     // Reset timer on mouse clicks
     document.addEventListener("mousedown", resetInactivityTimer);
     
     // Reset timer on key presses
     document.addEventListener("keydown", resetInactivityTimer);
     
     // Reset timer on touch events (for mobile devices)
     document.addEventListener("touchstart", resetInactivityTimer);
     document.addEventListener("touchmove", resetInactivityTimer);
     
     // Reset timer on scroll events
     document.addEventListener("scroll", resetInactivityTimer);
 }

 // Game difficulty functions
 function startGame(difficulty) {
     // Store the selected difficulty in localStorage
     localStorage.setItem('gameDifficulty', difficulty);
     // Redirect to the game page
     window.location.href = 'game.html';
 }

 function goBack() {
     // Go back to the main menu
     window.location.href = 'menu.html';
 }

 // Initialize inactivity detection when the page loads
 document.addEventListener("DOMContentLoaded", setupInactivityDetection);