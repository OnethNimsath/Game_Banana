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

function goBack() {
    window.location.href = 'game_difficulty.html';
}

function initializeGame() {
    score = 0;
    updateScoreDisplay();
    
    //https://stackoverflow.com/questions/64712803/change-game-difficulty-javascript used for reference
    // Get difficulty from localStorage
    difficulty = localStorage.getItem('gameDifficulty') || "medium";
    
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

//https://stackoverflow.com/questions/60626853/saving-users-scores-and-favorites-in-firestore-database used for reference
//https://feloy.medium.com/firebase-saving-scores-into-firestore-with-go-functions-b128fd8c425 used for reference

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


function addDifficultyIndicator() {

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
    if (timer) {
        clearInterval(timer);
    }
    
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
        timerElement.style.color = "#E9573F"; // Red
        timerElement.classList.add('critical');
    } else if (timeLeft <= 10) {
        timerElement.style.color = "#8B8000"; // Yellow
        timerElement.classList.remove('critical');
    } else {
        timerElement.style.color = "#8CC152"; // Green
        timerElement.classList.remove('critical');
    }
}

function handleTimeOut() {
    lives--;
    updateLivesDisplay();
    
    if (lives === 0) {
        clearInterval(timer);
        document.getElementById("note").innerHTML = "Game Over!";
        document.getElementById('newGameButtonContainer').innerHTML = `
            <div class="game-over-message">Final Score: ${score}</div>
            <button class="button-62" onclick="saveAndStartNewGame()">New Game?</button>
        `;

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
    difficulty = localStorage.getItem('gameDifficulty') || "medium";
    score = 0;
    updateScoreDisplay();
    resetLivesAndTime();
    addDifficultyIndicator();
    
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
        saveScoreToFirestore();
        resetLivesAndTime();
    } else {
        document.getElementById("note").innerHTML = "Not Correct!";
        resetTime();
        clearInterval(timer);
        startTimer();
    }
}

function handleInput() {
    let inp = document.getElementById("input");
    let note = document.getElementById("note");
    
    if (parseInt(inp.value) === solution) {
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

        score += basePoints + timeBonus;
        
        updateScoreDisplay();
        localStorage.setItem('puzzleScore', score);
        note.innerHTML = `Correct! +${basePoints + timeBonus} points`;
        showRedirectMessage("Great job! Redirecting to bonus game...");

        setTimeout(function() {
            window.location.href = 'extra_game.html';
        }, 2000);
    } else {
        // Use the handleIncorrectAnswer function for wrong answers
        handleIncorrectAnswer();
    }
}

// Function to show a redirect message
function showRedirectMessage(message) {

    let messageContainer = document.getElementById('redirect-message');
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.id = 'redirect-message';
        document.body.appendChild(messageContainer);
    }
    messageContainer.innerHTML = message;
    messageContainer.style.display = 'flex';

    messageContainer.classList.add('message-animation');
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
        let response = await fetch('https://marcconrad.com/uob/banana/api.php'); //Used reference video given by UOB for understanding
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
    
    const closeButton = document.createElement('button');
    closeButton.innerHTML = 'X';
    closeButton.className = 'leaderboard-close-btn';
    closeButton.onclick = () => {
        document.body.removeChild(leaderboardContainer);
    };
    
    const content = document.createElement('div');
    content.innerHTML = '<h2>Leaderboard</h2><div id="leaderboard-loading">Loading scores...</div>';

    leaderboardContainer.appendChild(closeButton);
    leaderboardContainer.appendChild(content);

    document.body.appendChild(leaderboardContainer);
    
    fetchLeaderboardScores();
}
initializeGame();