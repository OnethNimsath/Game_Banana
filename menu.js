//https://www.w3schools.com/jS/js_cookies.asp#:~:text=Create%20a%20Cookie%20with%20JavaScript,date%20(in%20UTC%20time). used for reference
//https://stackoverflow.com/questions/14573223/set-cookie-and-get-cookie-with-javascript used for reference
//https://www.youtube.com/watch?v=AuLMvRcWmss used for reference
//https://www.youtube.com/watch?v=GihQAC1I39Q used for reference

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
let inactivityTimer;
const TIMEOUT_DURATION = 20000; //Player inactivity for 20 seconds

//https://medium.com/@patelharsh7458/understanding-sessions-in-javascript-ce5f83928810 used for reference
//https://medium.com/@diwakarkashyap/session-in-javascript-69ef8c39660b used for reference
//Used LLM for code enhancing 

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

// Set up event listeners for user activity
function setupInactivityDetection() {
    resetInactivityTimer();

    //Used event listener to detect user activity
    document.addEventListener("mousemove", resetInactivityTimer);
    document.addEventListener("mousedown", resetInactivityTimer);
    document.addEventListener("keydown", resetInactivityTimer);
    document.addEventListener("touchstart", resetInactivityTimer);
    document.addEventListener("touchmove", resetInactivityTimer);
    document.addEventListener("scroll", resetInactivityTimer);
}

function pauseInactivityDetection() {
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
    }
}

function resumeInactivityDetection() {
    resetInactivityTimer();
}
  
//Navigation links
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
  
//Floating animations for monkeys
function createMonkeys() {
    for (let i = 0; i < 10; i++) {
        const monkey = document.createElement('div');
        monkey.className = 'monkey';
        monkey.style.left = Math.random() * 100 + 'vw';
        monkey.style.top = Math.random() * 100 + 'vh';
        monkey.style.animationDelay = Math.random() * 5 + 's';
        document.body.appendChild(monkey);
    }
    initializeAudio();
}
  
//Game audio initialization
function initializeAudio() {
    const audioControl = document.getElementById('audioControl');
    const audioIcon = document.getElementById('audioIcon');
    const soundWave1 = document.getElementById('soundWave1');
    const soundWave2 = document.getElementById('soundWave2');
    const muteSlash = document.getElementById('muteSlash');
    const backgroundMusic = document.getElementById('backgroundMusic');
    
    backgroundMusic.muted = true;
    backgroundMusic.load(); 
    
    //https://www.youtube.com/watch?v=WCVUyVQopAE used for reference 
    //https://stackoverflow.com/questions/50041235/create-cookie-for-audio-play-mute-setting used for reference

    //Saving audio preferences in cookies
    const audioMuted = getCookie('bananaquestAudioMuted');
    
    if (audioMuted === 'false') {
        soundWave1.style.display = 'block';
        soundWave2.style.display = 'block';
        muteSlash.style.display = 'none';
        backgroundMusic.muted = false;
        
        const playPromise = backgroundMusic.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log("Audio autoplay prevented by browser, needs user interaction");
                
                //Event listener added to click audio button
                document.addEventListener('click', function initialPlayHandler() {
                    if (!backgroundMusic.muted) {
                        backgroundMusic.play().then(() => {
                            document.removeEventListener('click', initialPlayHandler);
                        }).catch(e => {
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
            backgroundMusic.muted = false;
            backgroundMusic.play().catch(error => {
                console.log("Audio play prevented until user interacts with page");
            });
            soundWave1.style.display = 'block';
            soundWave2.style.display = 'block';
            muteSlash.style.display = 'none';
            setCookie('bananaquestAudioMuted', 'false', 30); // Cookie expires in 30 days
        } else {
            backgroundMusic.muted = true;
            soundWave1.style.display = 'none';
            soundWave2.style.display = 'none';
            muteSlash.style.display = 'block';
            setCookie('bananaquestAudioMuted', 'true', 30); // Cookie expires in 30 days
        }
    }
    //Used event listener to the audio button
    audioControl.addEventListener('click', toggleAudio);
}

//Loading of the page
window.onload = function() {
    createMonkeys();
    setupInactivityDetection(); 
};