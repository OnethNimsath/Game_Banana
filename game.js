var quest = "";
var solution = -1;
var lives = 3;
var difficulty = "medium"; // Default difficulty
var timer = null;
var timeLeft = 20; // Default time (will be set based on difficulty)
var score = 0;

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDkN-xlEdgk5W7RQJwH8LGV-eOmN7LNF8Y",
    authDomain: "smart-banana-97744.firebaseapp.com",
    projectId: "smart-banana-97744",
    storageBucket: "smart-banana-97744.firebasestorage.app",
    messagingSenderId: "225178137471",
    appId: "1:225178137471:web:02a4135eb6347bd7c5204a"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Function to navigate back to menu
function goBack() {
    window.location.href = 'game_difficulty.html';
}

// Initialize game based on selected difficulty
function initializeGame() {
    // Reset score
    score = 0;
    updateScoreDisplay();
    
    // Get difficulty from localStorage
    difficulty = localStorage.getItem('gameDifficulty') || "medium";
    
    // Set lives and time based on difficulty
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
        timerElement.className = "timer-display";
        document.querySelector('.back-button').after(timerElement);
    } else {
        document.getElementById('timer').innerHTML = "Time: " + timeLeft;
    }
    
    // Create score display if it doesn't exist
    if (!document.getElementById('score-display')) {
        let scoreElement = document.createElement("div");
        scoreElement.id = "score-display";
        scoreElement.className = "score-display";
        scoreElement.innerHTML = "Score: 0";
        document.getElementById('lives').after(scoreElement);
    }
    
    updateLivesDisplay();
    updateTimerDisplay();
    updateScoreDisplay();
    startup();
    startTimer();
}

// Function to update the score display
function updateScoreDisplay() {
    const scoreElement = document.getElementById('score-display');
    if (scoreElement) {
        scoreElement.innerHTML = "Score: " + score;
    } else {
        // Create score element if it doesn't exist
        let scoreElement = document.createElement("div");
        scoreElement.id = "score-display";
        scoreElement.className = "score-display";
        scoreElement.innerHTML = "Score: " + score;
        document.getElementById('lives').after(scoreElement);
    }
}

// Save score to Firestore
function saveScoreToFirestore() {
    const userEmail = localStorage.getItem('userEmail');
    
    if (!userEmail) {
        console.error("No user email found. Cannot save score.");
        return Promise.resolve(false);
    }

    const userDocRef = db.collection('users').doc(userEmail);

    return db.runTransaction((transaction) => {
        return transaction.get(userDocRef).then((userDoc) => {
            const newScore = score;
            let currentHighScore = 0;
            if (userDoc.exists) {
                const userData = userDoc.data();
                currentHighScore = userData.highScore || 0;
            }

            const updateData = {
                score: newScore,
                lastPlayed: firebase.firestore.Timestamp.now()
            };

            if (newScore > currentHighScore) {
                updateData.highScore = newScore;
            }

            transaction.set(userDocRef, updateData, { merge: true });
            return newScore > currentHighScore;
        });
    })
    .then((isNewHighScore) => {
        console.log("Score saved successfully. New high score:", isNewHighScore);
        return isNewHighScore;
    })
    .catch((error) => {
        console.error("Transaction failed: ", error);
        return false;
    });
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

function handleTimeOut() {
    lives--;
    updateLivesDisplay();
    
    if (lives === 0) {
        // Game over due to time out
        clearInterval(timer);
        document.getElementById("note").innerHTML = "Game Over!";
        document.getElementById('newGameButtonContainer').innerHTML = `
            <div class="game-over-message">Final Score: ${score}</div>
            <button class="button-62" onclick="saveAndStartNewGame()">New Game?</button>
        `;
        
        // Save the score
        saveScoreToFirestore()
            .then((isNewHighScore) => {
                if (isNewHighScore) {
                    alert("New high score: " + score + "!");
                }
            });
        
        resetLivesAndTime();
    } else {
        // Still have lives left
        document.getElementById("note").innerHTML = "Time's Up!";
        resetTime();
        fetchText();
        startTimer();
    }
}

// Function to save score and start new game
function saveAndStartNewGame() {
    saveScoreToFirestore()
        .then(() => {
            newgame();
        });
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
    
    // Reset score
    score = 0;
    updateScoreDisplay();
    
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

// Function for handling incorrect answers
function handleIncorrectAnswer() {
    lives--;
    updateLivesDisplay();
    
    if (lives === 0) {
        // Game over due to wrong answer
        clearInterval(timer);
        document.getElementById("note").innerHTML = "Game Over!";
        document.getElementById('newGameButtonContainer').innerHTML = `
            <div class="game-over-message">Final Score: ${score}</div>
            <button class="button-62" onclick="saveAndStartNewGame()">New Game?</button>
        `;
        
        // Save the score
        saveScoreToFirestore();
        
        resetLivesAndTime();
    } else {
        // Still have lives left
        document.getElementById("note").innerHTML = "Not Correct!";
        resetTime();
        clearInterval(timer);
        startTimer();
    }
}

// Handle user input
function handleInput() {
    let inp = document.getElementById("input");
    let note = document.getElementById("note");
    
    if (parseInt(inp.value) === solution) {
        // Stop the timer
        clearInterval(timer);
        
        // Calculate score based on difficulty and time left
        let timeBonus = 0;
        let basePoints = 0;
        
        switch(difficulty) {
            case "easy":
                basePoints = 100;
                timeBonus = timeLeft * 5;
                break;
            case "medium":
                basePoints = 200;
                timeBonus = timeLeft * 10;
                break;
            case "hard":
                basePoints = 300;
                timeBonus = timeLeft * 20;
                break;
        }
        
        // Add to score
        score += basePoints + timeBonus;
        
        updateScoreDisplay();
        
        // Display score with the correct answer
        note.innerHTML = `Correct! +${basePoints + timeBonus} points`;
        document.getElementById('newGameButtonContainer').innerHTML = `
            <div class="score-message">Current Score: ${score}</div>
            <button class="button-62" onclick="nextPuzzle()">Next Puzzle</button>
        `;
    } else {
        // Use the handleIncorrectAnswer function for wrong answers
        handleIncorrectAnswer();
    }
}

// Function to move to next puzzle without resetting score
function nextPuzzle() {
    fetchText();
    document.getElementById("input").value = "";
    document.getElementById("note").innerHTML = "Enter the missing digit below:";
    document.getElementById('newGameButtonContainer').innerHTML = '';
    resetTime();
    startTimer();
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
    document.getElementById('newGameButtonContainer').innerHTML = '';
}

// Fetch leaderboard scores from Firestore
async function fetchLeaderboardScores() {
    try {
        // Get top 10 scores
        const scoresRef = db.collection('users');
        const snapshot = await scoresRef.orderBy('highScore', 'desc').limit(10).get();
        
        let tableHTML = `
            <table class="leaderboard-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Player</th>
                        <th>High Score</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        let rank = 1;
        snapshot.forEach(doc => {
            const userData = doc.data();
            tableHTML += `
                <tr>
                    <td>${rank}</td>
                    <td>${userData.displayName || 'Unknown'}</td>
                    <td>${userData.highScore || 0}</td>
                </tr>
            `;
            rank++;
        });
        
        tableHTML += `</tbody></table>`;
        
        // If no scores found
        if (rank === 1) {
            document.getElementById('leaderboard-loading').innerHTML = 'No scores found yet!';
        } else {
            document.getElementById('leaderboard-loading').innerHTML = tableHTML;
        }
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        document.getElementById('leaderboard-loading').innerHTML = 'Error loading leaderboard.';
    }
}

// Function to show leaderboard
function showLeaderboard() {
    // Create a leaderboard container
    const leaderboardContainer = document.createElement('div');
    leaderboardContainer.id = 'leaderboard-container';
    leaderboardContainer.className = 'leaderboard-container';
    
    // Add a close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = 'X';
    closeButton.className = 'leaderboard-close-btn';
    closeButton.onclick = () => {
        document.body.removeChild(leaderboardContainer);
    };
    
    // Create leaderboard content
    const content = document.createElement('div');
    content.innerHTML = '<h2>Leaderboard</h2><div id="leaderboard-loading">Loading scores...</div>';
    
    // Add elements to container
    leaderboardContainer.appendChild(closeButton);
    leaderboardContainer.appendChild(content);
    
    // Add to body
    document.body.appendChild(leaderboardContainer);
    
    // Fetch scores from Firestore
    fetchLeaderboardScores();
}

// Start the game with difficulty settings
initializeGame();