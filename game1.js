// Game variables
let score = 0;
let lives = 5; // Default for easy difficulty
let timerValue = 60; // Default timer value
let timerInterval;
let difficulty = "easy"; // Default difficulty
let gameActive = true;
let correctAnswer; // Variable to store the correct answer

// Initialize the game based on difficulty from localStorage
window.onload = function() {
    // Get difficulty from localStorage (set in difficulty menu)
    const savedDifficulty = localStorage.getItem('selectedDifficulty') || 'easy';
    setDifficulty(savedDifficulty);
    
    // Initialize game
    startGame();
};

// Set game difficulty
function setDifficulty(difficultyLevel) {
    difficulty = difficultyLevel;
    
    // Set lives and timer based on difficulty
    switch(difficulty) {
        case 'easy':
            lives = 3; // Adjusted lives based on your requirements
            timerValue = 30;
            break;
        case 'medium':
            lives = 2;
            timerValue = 20;
            break;
        case 'hard':
            lives = 1;
            timerValue = 15;
            break;
        default:
            lives = 3; // Default to easy
            timerValue = 30;
    }
    
    // Update the UI
    document.getElementById('lives').textContent = `Lives: ${lives}`;
    document.getElementById('timer-display').textContent = `Time: ${timerValue}`;
}

// Start the game
function startGame() {
    // Reset score
    score = 0;
    document.getElementById('score-display').textContent = `Score: ${score}`;
    
    // Generate new puzzle
    generatePuzzle();
    
    // Start the timer
    startTimer();
    
    // Set game as active
    gameActive = true;
}

// Generate a new puzzle
function generatePuzzle() {
    // Example puzzle generation code
    // You would replace this with your actual puzzle generation logic
    document.getElementById('quest').src = "https://www.sanfoh.com/uob/banana/data/t70c9af9b2750792cc9835e656cn64.png";
    document.getElementById('input').value = "";
    document.getElementById('input').focus();

    // Generate a random correct answer (replace with your logic)
    correctAnswer = Math.floor(Math.random() * 10).toString(); 
}

// Start the timer
function startTimer() {
    // Clear any existing timer
    clearInterval(timerInterval);
    
    // Reset timer value based on difficulty
    timerValue = getTimerValueForDifficulty(difficulty);
    
    // Update the timer display
    document.getElementById('timer-display').textContent = `Time: ${timerValue}`;
    
    // Start the countdown
    timerInterval = setInterval(function() {
        timerValue--;
        document.getElementById('timer-display').textContent = `Time: ${timerValue}`;
        
        // When timer reaches 10 seconds, add visual alert
        if (timerValue <= 10) {
            document.getElementById('timer-display').classList.add('timer-alert');
            
            // Play alert sound at 10 seconds
            if (timerValue === 10) {
                document.getElementById('timerAlertSound').play();
            }
        }
        
        // If timer runs out
        if (timerValue <= 0) {
            clearInterval(timerInterval);
            decrementLives();
            
            // Generate new puzzle if still has lives
            if (lives > 0) {
                startTimer();
                generatePuzzle();
            } else {
                // Game over when no lives left
                gameOver();
            }
        }
    }, 1000);
}

// Helper function to get timer value based on difficulty
function getTimerValueForDifficulty(diff) {
    switch(diff) {
        case 'easy': return 30;
        case 'medium': return 20;
        case 'hard': return 15;
        default: return 30;
    }
}

// Handle user input
function handleInput() {
    if (!gameActive) return;
    
    const userInput = document.getElementById('input').value;
    
    // Check if input is valid
    if (userInput === "" || isNaN(userInput)) {
        alert("Please enter a valid digit (0-9)");
        return;
    }
    
    // Check if answer is correct
    if (userInput === correctAnswer) {
        // Correct answer
        incrementScore();
        generatePuzzle();
        
        // Reset timer for next puzzle
        clearInterval(timerInterval);
        startTimer();
    } else {
        // Wrong answer
        decrementLives();
        
        if (lives > 0) {
            // Still has lives, try again
            document.getElementById('input').value = "";
            document.getElementById('input').focus();
        } else {
            // Game over when no lives left
            gameOver();
        }
    }
}

// Increment score
function incrementScore() {
    score++;
    document.getElementById('score-display').textContent = `Score: ${score}`;
}

// Decrement lives
function decrementLives() {
    lives--;
    document.getElementById('lives').textContent = `Lives: ${lives}`;
    
    if (lives <= 0) {
        gameOver();
    }
}

// Game over
function gameOver() {
    gameActive = false;
    clearInterval(timerInterval);
    
    // Hide main game and show game over screen
    document.getElementById('main-game').style.display = 'none';
    document.getElementById('game-over-screen').style.display = 'block';
}

// New game
function newgame() {
    // Reset lives based on difficulty
    lives = getLivesForDifficulty(difficulty);
    
    document.getElementById('lives').textContent = `Lives: ${lives}`;
    
    // Hide game over screen and show main game
    document.getElementById('game-over-screen').style.display = 'none';
    document.getElementById('main-game').style.display = 'block';
    
    // Reset timer display class
    document.getElementById('timer-display').classList.remove('timer-alert');
    
    // Start new game
    startGame();
}

// Helper function to get lives based on difficulty
function getLivesForDifficulty(diff) {
    switch(diff) {
        case 'easy': return 3;
        case 'medium': return 2;
        case 'hard': return 1;
        default: return 3;
    }
}

// Show extra life mini-game
function showExtraLifeMiniGame() {
    document.getElementById('game-over-screen').style.display = 'none';
    document.getElementById('extra-life-mini-game').style.display = 'block';
    
    // Randomize the buttons
    const container = document.getElementById('banana-choices');
    for (let i = container.children.length; i >= 0; i--) {
        container.appendChild(container.children[Math.random() * i | 0]);
    }
}

// Win extra life
function winExtraLife() {
    lives = 1;
    document.getElementById('mini-game-result').textContent = "You won an extra life!";
    
    setTimeout(function() {
        document.getElementById('extra-life-mini-game').style.display = 'none';
        document.getElementById('main-game').style.display = 'block';
        document.getElementById('lives').textContent = `Lives: ${lives}`;
        startGame();
    }, 1500);
}

// Lose extra life attempt
function loseExtraLifeAttempt() {
    document.getElementById('mini-game-result').textContent = "Sorry, wrong choice!";
    
    setTimeout(function() {
        document.getElementById('extra-life-mini-game').style.display = 'none';
        document.getElementById('game-over-screen').style.display = 'block';
    }, 1500);
}

// Go back to difficulty menu
function goBackToDifficulty() {
    // Stop any active timers
    clearInterval(timerInterval);
    
    // Navigate to the difficulty menu page
    window.location.href = "game_difficulty.html";
}