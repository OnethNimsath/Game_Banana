// Firebase configuration with your provided details
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
const auth = firebase.auth();
const db = firebase.firestore();

// DOM elements
const loadingMessage = document.getElementById('loadingMessage');
const accountContent = document.getElementById('accountContent');
const playerNameInput = document.getElementById('playerName');
const emailInput = document.getElementById('email');
const highScoreElement = document.getElementById('highScore');
const bananasCollectedElement = document.getElementById('bananasCollected');
const gamesPlayedElement = document.getElementById('gamesPlayed');
const saveNameBtn = document.getElementById('saveNameBtn');
const errorMessage = document.getElementById('errorMessage');

// Check if user is logged in
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in, fetch their data from Firestore
        loadUserData(user);
    } else {
        // No user is signed in, redirect to login page
        window.location.href = 'login.html';
    }
});

// Load user data from Firestore
function loadUserData(user) {
    // Set email from auth
    emailInput.value = user.email;
    
    // Fetch additional user data from 'users' collection
    db.collection('users').doc(user.uid).get()
        .then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                
                // Set player name if it exists in Firestore
                playerNameInput.value = userData.name || '';
                
                // Set player stats if they exist
                bananasCollectedElement.textContent = userData.bananasCollected?.toLocaleString() || '0';
                gamesPlayedElement.textContent = userData.gamesPlayed?.toLocaleString() || '0';
            } else {
                // No Firestore document exists yet, create one with default values
                db.collection('users').doc(user.uid).set({
                    name: user.displayName || '',
                    email: user.email,
                    bananasCollected: 0,
                    gamesPlayed: 0
                });
                
                playerNameInput.value = user.displayName || '';
            }
            
            // Fetch highest score using player's email (more reliable than name)
            fetchPlayerHighScore(user.email);
            
            // Show account content
            loadingMessage.style.display = 'none';
            accountContent.style.display = 'block';
        })
        .catch(error => {
            console.error("Error getting user document:", error);
            loadingMessage.textContent = 'Error loading user data. Please try again.';
        });
}

// Fetch the highest score for a player using email
function fetchPlayerHighScore(playerEmail) {
    console.log("Fetching high score for player email:", playerEmail);
    
    // First try to fetch by email
    db.collection('scores')
        .where('playerEmail', '==', playerEmail)
        .orderBy('score', 'desc')
        .limit(1)
        .get()
        .then(snapshot => {
            if (!snapshot.empty) {
                const highScoreDoc = snapshot.docs[0];
                const highScore = highScoreDoc.data().score;
                console.log("Found high score by email:", highScore);
                highScoreElement.textContent = highScore.toLocaleString();
            } else {
                console.log("No scores found by email, trying by player name");
                // Fallback to fetch by player name for backward compatibility
                fallbackFetchByPlayerName();
            }
        })
        .catch(error => {
            console.error("Error fetching high score by email:", error);
            // Try fallback if the query fails (e.g., missing index)
            fallbackFetchByPlayerName();
        });
        
    // Fallback function to fetch by player name
    function fallbackFetchByPlayerName() {
        const playerName = playerNameInput.value || auth.currentUser.displayName || 'Anonymous';
        
        db.collection('scores')
            .where('playerName', '==', playerName)
            .orderBy('score', 'desc')
            .limit(1)
            .get()
            .then(snapshot => {
                if (!snapshot.empty) {
                    const highScoreDoc = snapshot.docs[0];
                    const highScore = highScoreDoc.data().score;
                    console.log("Found high score by name:", highScore);
                    highScoreElement.textContent = highScore.toLocaleString();
                } else {
                    console.log("No scores found for player");
                    highScoreElement.textContent = '0';
                }
            })
            .catch(error => {
                console.error("Error in fallback fetch by name:", error);
                highScoreElement.textContent = '0';
            });
    }
}

// Save player name button functionality
saveNameBtn.addEventListener('click', function() {
    const newName = playerNameInput.value.trim();
    
    if (!newName) {
        // Show error if name is empty
        errorMessage.textContent = 'Please enter a valid name';
        errorMessage.style.display = 'block';
        return;
    }
    
    errorMessage.style.display = 'none';
    saveNameBtn.disabled = true;
    saveNameBtn.textContent = 'Saving...';
    
    const user = auth.currentUser;
    if (user) {
        // Update name in Firestore
        db.collection('users').doc(user.uid).update({
            name: newName
        })
        .then(() => {
            // Update displayName in Auth if needed
            return user.updateProfile({
                displayName: newName
            });
        })
        .then(() => {
            saveNameBtn.textContent = 'Saved!';
            setTimeout(() => {
                saveNameBtn.disabled = false;
                saveNameBtn.textContent = 'Save';
            }, 2000);
            
            // After updating the name, refresh the high score
            fetchPlayerHighScore(user.email);
        })
        .catch(error => {
            console.error("Error updating name:", error);
            errorMessage.textContent = 'Error saving name. Please try again.';
            errorMessage.style.display = 'block';
            saveNameBtn.disabled = false;
            saveNameBtn.textContent = 'Save';
        });
    }
});

// Function to update high score (call this when player finishes a game)
function updateHighScore(newScore) {
    const user = auth.currentUser;
    if (user) {
        // Get the current player name
        db.collection('users').doc(user.uid).get()
            .then(doc => {
                const playerName = doc.exists ? (doc.data().name || user.displayName || 'Anonymous') : (user.displayName || 'Anonymous');
                
                // Add new score document in 'scores' collection
                return db.collection('scores').add({
                    playerName: playerName,
                    playerEmail: user.email, // Add email for reliable queries
                    score: newScore,
                    difficulty: localStorage.getItem('gameDifficulty') || 'medium', // Get from localStorage
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            })
            .then(() => {
                console.log("New score added:", newScore);
                
                // Refresh the high score display
                fetchPlayerHighScore(user.email);
            })
            .catch(error => {
                console.error("Error adding new score:", error);
            });
    }
}

// Function to update game stats (call this when player finishes a game)
function updateGameStats(bananasCollected) {
    const user = auth.currentUser;
    if (user) {
        // Get the current user document
        db.collection('users').doc(user.uid).get()
            .then(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    const currentBananas = userData.bananasCollected || 0;
                    const currentGames = userData.gamesPlayed || 0;
                    
                    // Update user document with incremented stats
                    return db.collection('users').doc(user.uid).update({
                        bananasCollected: currentBananas + bananasCollected,
                        gamesPlayed: currentGames + 1
                    });
                } else {
                    // If the document doesn't exist, create it
                    return db.collection('users').doc(user.uid).set({
                        name: user.displayName || '',
                        email: user.email,
                        bananasCollected: bananasCollected,
                        gamesPlayed: 1
                    });
                }
            })
            .then(() => {
                console.log("Game stats updated");
                
                // Refresh the displayed stats
                bananasCollectedElement.textContent = (parseInt(bananasCollectedElement.textContent.replace(/,/g, '')) + bananasCollected).toLocaleString();
                gamesPlayedElement.textContent = (parseInt(gamesPlayedElement.textContent.replace(/,/g, '')) + 1).toLocaleString();
            })
            .catch(error => {
                console.error("Error updating game stats:", error);
            });
    }
}