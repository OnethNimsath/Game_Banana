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