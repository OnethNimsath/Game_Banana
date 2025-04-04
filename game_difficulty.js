let inactivityTimer;
 const TIMEOUT_DURATION = 20000;

 // Function to reset the timer
 function resetInactivityTimer() {
     if (inactivityTimer) {
         clearTimeout(inactivityTimer);
     }
     inactivityTimer = setTimeout(logoutDueToInactivity, TIMEOUT_DURATION);
 }

 // Function to handle logout
 function logoutDueToInactivity() {
     console.log("User inactive for 20 seconds, logging out...");
     alert("You have been logged out due to inactivity.");
     window.location.href = "login.html";
 }
 function setupInactivityDetection() {
     // Initialize the timer when the page loads
     resetInactivityTimer();
     document.addEventListener("mousemove", resetInactivityTimer);
     document.addEventListener("mousedown", resetInactivityTimer);
     document.addEventListener("keydown", resetInactivityTimer);
     document.addEventListener("touchstart", resetInactivityTimer);
     document.addEventListener("touchmove", resetInactivityTimer);
     document.addEventListener("scroll", resetInactivityTimer);
 }
 function startGame(difficulty) {
     localStorage.setItem('gameDifficulty', difficulty);
     window.location.href = 'game.html';
 }
 function goBack() {
     window.location.href = 'menu.html';
 }
 document.addEventListener("DOMContentLoaded", setupInactivityDetection);