// Cookie management functions
function setCookie(name, value, days) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    
    const cookieValue = encodeURIComponent(value) + 
                       ((days) ? '; expires=' + expiryDate.toUTCString() : '') + 
                       '; path=/';
    
    document.cookie = name + '=' + cookieValue;
}
  
function getCookie(name) {
    const nameEQ = name + '=';
    const cookies = document.cookie.split(';');
    
    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        while (cookie.charAt(0) === ' ') {
            cookie = cookie.substring(1, cookie.length);
        }
        
        if (cookie.indexOf(nameEQ) === 0) {
            return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
        }
    }
    
    return null;
}

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

// If you need to disable the timeout temporarily (e.g., during game play)
function pauseInactivityDetection() {
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
    }
}

// To resume inactivity detection after pausing
function resumeInactivityDetection() {
    resetInactivityTimer();
}
  
// Page navigation
document.getElementById("exitGame").addEventListener("click", function() {
    window.location.href = "login.html";
});

document.getElementById("board").addEventListener("click", function() {
    window.location.href = "leaderboard.html";
});

document.getElementById("playerAccount").addEventListener("click", function() {
    window.location.href = "profile.html";
}); 

document.getElementById("playGame").addEventListener("click", function() {
    window.location.href = "game_difficulty.html";
});
  
// Create floating monkey animations
function createMonkeys() {
    for (let i = 0; i < 10; i++) {
        const monkey = document.createElement('div');
        monkey.className = 'monkey';
        monkey.style.left = Math.random() * 100 + 'vw';
        monkey.style.top = Math.random() * 100 + 'vh';
        monkey.style.animationDelay = Math.random() * 5 + 's';
        document.body.appendChild(monkey);
    }
    
    // Initialize audio after creating elements
    initializeAudio();
}
  
// Initialize audio functionality
function initializeAudio() {
    const audioControl = document.getElementById('audioControl');
    const audioIcon = document.getElementById('audioIcon');
    const soundWave1 = document.getElementById('soundWave1');
    const soundWave2 = document.getElementById('soundWave2');
    const muteSlash = document.getElementById('muteSlash');
    const backgroundMusic = document.getElementById('backgroundMusic');
    
    // Set initial state to muted by default
    backgroundMusic.muted = true;
    backgroundMusic.load(); // Make sure the audio is loaded and ready
    
    // Check if we have a saved audio preference in cookies
    const audioMuted = getCookie('bananaquestAudioMuted');
    
    // If there's a saved preference and it's 'false', we should unmute
    if (audioMuted === 'false') {
        // Visual update for unmuted state
        soundWave1.style.display = 'block';
        soundWave2.style.display = 'block';
        muteSlash.style.display = 'none';
        backgroundMusic.muted = false;
        
        // Try to play audio (might need user interaction first)
        const playPromise = backgroundMusic.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                // Browser prevented autoplay, will need user interaction
                console.log("Audio autoplay prevented by browser, needs user interaction");
                
                // Set up a one-time click listener for the whole document
                document.addEventListener('click', function initialPlayHandler() {
                    if (!backgroundMusic.muted) {
                        backgroundMusic.play().then(() => {
                            // Successfully started playing
                            document.removeEventListener('click', initialPlayHandler);
                        }).catch(e => {
                            // Still couldn't play for some reason
                            console.error("Still couldn't play audio after user interaction:", e);
                        });
                    }
                }, { once: false });
            });
        }
    }
    
    // Toggle audio function
    function toggleAudio() {
        if (backgroundMusic.muted) {
            // Unmute
            backgroundMusic.muted = false;
            backgroundMusic.play().catch(error => {
                console.log("Audio play prevented until user interacts with page");
            });
            soundWave1.style.display = 'block';
            soundWave2.style.display = 'block';
            muteSlash.style.display = 'none';
            
            // Save preference to cookie (unmuted = false)
            setCookie('bananaquestAudioMuted', 'false', 30); // Expires in 30 days
        } else {
            // Mute
            backgroundMusic.muted = true;
            soundWave1.style.display = 'none';
            soundWave2.style.display = 'none';
            muteSlash.style.display = 'block';
            
            // Save preference to cookie (muted = true)
            setCookie('bananaquestAudioMuted', 'true', 30); // Expires in 30 days
        }
    }
    
    // Add click event to toggle audio
    audioControl.addEventListener('click', toggleAudio);
}

// Call functions when the page loads
window.onload = function() {
    createMonkeys();
    setupInactivityDetection(); // Initialize the inactivity detection
};