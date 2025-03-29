var quest = "";
var solution = -1;
var lives = 3;
var difficulty = "medium"; // Default difficulty
var timer = null;
var timeLeft = 20; // Default time (will be set based on difficulty)

// Function to navigate back to menu.html when the back button is clicked
function goBack() {
    window.location.href = 'game_difficulty.html';
}

// Initialize game based on selected difficulty
function initializeGame() {
    // Get difficulty from localStorage (or default to medium)
    difficulty = localStorage.getItem('gameDifficulty') || "medium";
    
    // Set lives based on difficulty
    switch(difficulty) {
        case "easy":
            lives = 5;
            timeLeft = 30;
            break;
        case "medium":
            lives = 3;
            timeLeft = 20;
            break;
        case "hard":
            lives = 1;
            timeLeft = 15;
            break;
        default:
            lives = 3;
            timeLeft = 20;
    }
    
    // Add difficulty indicator to UI
    addDifficultyIndicator();
    
    // Create or update timer element
    if (!document.getElementById('timer')) {
        let timerElement = document.createElement("div");
        timerElement.id = "timer";
        timerElement.innerHTML = "Time: " + timeLeft;
        timerElement.className = "timer-display"; // Add a class for styling
        
        // Add to the header area
        document.querySelector('.back-button').after(timerElement);
    } else {
        document.getElementById('timer').innerHTML = "Time: " + timeLeft;
    }
    
    updateLivesDisplay();
    updateTimerDisplay();
    startup();
    startTimer();
}

// Add a visual indicator for the current difficulty
function addDifficultyIndicator() {
    // Remove existing indicator if present
    let existingIndicator = document.getElementById("difficulty-indicator");
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    let difficultyLabel = document.createElement("div");
    difficultyLabel.id = "difficulty-indicator";
    difficultyLabel.className = "difficulty-" + difficulty;
    
    // Set text and styling based on difficulty
    switch(difficulty) {
        case "easy":
            difficultyLabel.innerHTML = "Easy Mode";
            difficultyLabel.style.color = "#8CC152";
            break;
        case "medium":
            difficultyLabel.innerHTML = "Medium Mode";
            difficultyLabel.style.color = "#F6BB42";
            break;
        case "hard":
            difficultyLabel.innerHTML = "Hard Mode";
            difficultyLabel.style.color = "#E9573F";
            break;
    }
    
    // Insert after the lives display
    let livesElement = document.getElementById("lives");
    livesElement.parentNode.insertBefore(difficultyLabel, livesElement.nextSibling);
}

function startTimer() {
    // Clear any existing timer
    if (timer) {
        clearInterval(timer);
    }
    
    // Start a new timer
    timer = setInterval(function() {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            // Time's up!
            clearInterval(timer);
            handleTimeOut();
        }
    }, 1000);
}

function updateTimerDisplay() {
    let timerElement = document.getElementById('timer');
    timerElement.innerHTML = "Time: " + timeLeft;
    
    // Change color based on time remaining
    if (timeLeft <= 5) {
        timerElement.style.color = "#E9573F"; // Red for danger
        timerElement.classList.add('critical');
    } else if (timeLeft <= 10) {
        timerElement.style.color = "#8B8000"; // Yellow for warning
        timerElement.classList.remove('critical');
    } else {
        timerElement.style.color = "#8CC152"; // Green for good
        timerElement.classList.remove('critical');
    }
}

// Function to play the timer alert sound
function playTimerAlertSound() {
    const sound = document.getElementById('timerAlertSound');
    if (sound) {
        sound.currentTime = 0; // Reset the audio to the beginning
        sound.play().catch(error => {
            console.log("Audio play failed:", error);
            // This can happen if user hasn't interacted with the page yet
        });
    }
}

function handleTimeOut() {
    lives--;
    updateLivesDisplay();
    
    if (lives === 0) {
        document.getElementById("note").innerHTML = "Game Over!";
        document.getElementById('newGameButtonContainer').innerHTML = '<button class="button-62" onclick="newgame()">New Game?</button>';
        
        // Reset lives and time based on difficulty for next game
        resetLivesAndTime();
    } else {
        document.getElementById("note").innerHTML = "Time's Up!";
        // Reset time and provide a new puzzle
        resetTime();
        fetchText();
        startTimer();
    }
}

function resetTime() {
    // Reset time based on difficulty
    switch(difficulty) {
        case "easy":
            timeLeft = 30;
            break;
        case "medium":
            timeLeft = 20;
            break;
        case "hard":
            timeLeft = 15;
            break;
        default:
            timeLeft = 20;
    }
    updateTimerDisplay();
}

function resetLivesAndTime() {
    // Reset lives and time based on difficulty
    switch(difficulty) {
        case "easy":
            lives = 5;
            timeLeft = 30;
            break;
        case "medium":
            lives = 3;
            timeLeft = 20;
            break;
        case "hard":
            lives = 1;
            timeLeft = 15;
            break;
        default:
            lives = 3;
            timeLeft = 20;
    }
    updateLivesDisplay();
    updateTimerDisplay();
}

function newgame() {
    // Get difficulty from localStorage again in case it changed
    difficulty = localStorage.getItem('gameDifficulty') || "medium";
    
    // Reset lives and time
    resetLivesAndTime();
    
    // Update the difficulty indicator
    addDifficultyIndicator();
    
    // Reset timer
    if (timer) {
        clearInterval(timer);
    }
    
    startup();
    startTimer();
}

function handleInput() {
    let inp = document.getElementById("input");
    let note = document.getElementById("note");
    if (parseInt(inp.value) === solution) {
        // Stop the timer
        clearInterval(timer);
        
        note.innerHTML = 'Correct!';
        document.getElementById('newGameButtonContainer').innerHTML = '<button class="button-62" onclick="newgame()">New Game?</button>';
    } else {
        lives--;
        updateLivesDisplay();
        if (lives === 0) {
            // Stop the timer
            clearInterval(timer);
            
            note.innerHTML = "Game Over!";
            document.getElementById('newGameButtonContainer').innerHTML = '<button class="button-62" onclick="newgame()">New Game?</button>';
            
            // Reset lives and time based on difficulty for next game
            resetLivesAndTime();
        } else {
            note.innerHTML = "Not Correct!";
            
            // Reset timer for a new attempt on the same puzzle
            resetTime();
            clearInterval(timer);
            startTimer();
        }
    }
}

function updateLivesDisplay() {
    document.getElementById('lives').textContent = "Lives: " + lives;
}

async function fetchText() {
    try {
        let response = await fetch('https://marcconrad.com/uob/banana/api.php');
        let data = await response.text();
        startQuest(data);
    } catch (error) {
        document.getElementById("note").innerHTML = "Error loading question. Try again.";
    }
}

function startQuest(data) {
    var parsed = JSON.parse(data);
    quest = parsed.question;
    solution = parsed.solution;
    let img = document.getElementById("quest");
    img.src = quest;
    let note = document.getElementById("note");
    note.innerHTML = "Quest is ready.";
}

function startup() {
    fetchText();
    document.getElementById("input").value = "";
    document.getElementById('newGameButtonContainer').innerHTML = '<button class="button-62" onclick="newgame()">New Game?</button>';
}

// Randomize floating bananas
const floatingBananas = document.querySelectorAll('.floating-banana');
floatingBananas.forEach(banana => {
    const randomTop = Math.random() * 100; // Random percentage
    const randomLeft = Math.random() * 100;
    const randomDelay = Math.random() * 5; // Random delay up to 5 seconds

    banana.style.top = `${randomTop}%`;
    banana.style.left = `${randomLeft}%`;
    banana.style.animationDelay = `${randomDelay}s`;
});

// Randomize falling bananas
const fallingBananas = document.querySelectorAll('.falling-banana');
fallingBananas.forEach(banana => {
    const randomLeft = Math.random() * 100;
    const randomDelay = Math.random() * 7;

    banana.style.left = `${randomLeft}%`;
    banana.style.animationDelay = `${randomDelay}s`;
});



// Start the game with difficulty settings
// Replace the original startup() call with this
initializeGame();