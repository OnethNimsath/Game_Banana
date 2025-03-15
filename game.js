var quest = "";
var solution = -1;
var lives = 3;
var difficulty = "medium"; // Default difficulty

// Initialize game based on selected difficulty
function initializeGame() {
    // Get difficulty from localStorage (or default to medium)
    difficulty = localStorage.getItem('gameDifficulty') || "medium";
    
    // Set lives based on difficulty
    switch(difficulty) {
        case "easy":
            lives = 5;
            break;
        case "medium":
            lives = 3;
            break;
        case "hard":
            lives = 1;
            break;
        default:
            lives = 3;
    }
    
    // Add difficulty indicator to UI
    addDifficultyIndicator();
    
    updateLivesDisplay();
    startup();
}

// Add a visual indicator for the current difficulty
function addDifficultyIndicator() {
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

function newgame() {
    // Get difficulty from localStorage again in case it changed
    difficulty = localStorage.getItem('gameDifficulty') || "medium";
    
    // Set lives based on difficulty
    switch(difficulty) {
        case "easy":
            lives = 5;
            break;
        case "medium":
            lives = 3;
            break;
        case "hard":
            lives = 1;
            break;
        default:
            lives = 3;
    }
    
    // Update the difficulty indicator if it exists, otherwise add it
    let difficultyIndicator = document.getElementById("difficulty-indicator");
    if (difficultyIndicator) {
        difficultyIndicator.className = "difficulty-" + difficulty;
        
        switch(difficulty) {
            case "easy":
                difficultyIndicator.innerHTML = "Easy Mode";
                difficultyIndicator.style.color = "#8CC152";
                break;
            case "medium":
                difficultyIndicator.innerHTML = "Medium Mode";
                difficultyIndicator.style.color = "#F6BB42";
                break;
            case "hard":
                difficultyIndicator.innerHTML = "Hard Mode";
                difficultyIndicator.style.color = "#E9573F";
                break;
        }
    } else {
        addDifficultyIndicator();
    }
    
    updateLivesDisplay();
    startup();
}

function handleInput() {
    let inp = document.getElementById("input");
    let note = document.getElementById("note");
    if (parseInt(inp.value) === solution) {
        note.innerHTML = 'Correct!';
        document.getElementById('newGameButtonContainer').innerHTML = '<button class="button-62" onclick="newgame()">New Game?</button>';
    } else {
        lives--;
        updateLivesDisplay();
        if (lives === 0) {
            note.innerHTML = "Game Over!";
            document.getElementById('newGameButtonContainer').innerHTML = '<button class="button-62" onclick="newgame()">New Game?</button>';
            
            // Reset lives based on difficulty for next game
            switch(difficulty) {
                case "easy":
                    lives = 5;
                    break;
                case "medium":
                    lives = 3;
                    break;
                case "hard":
                    lives = 1;
                    break;
                default:
                    lives = 3;
            }
            
            fetchText();
            updateLivesDisplay(); // Update lives display immediately after reset
        } else {
            note.innerHTML = "Not Correct!";
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

function goBack() {
    window.history.back();
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