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
// Load user data from Firestore
function loadUserData(user) {
    // Set email from auth
    emailInput.value = user.email;
    
    // Get display name from Auth first (if it exists)
    const authDisplayName = user.displayName || '';
    
    // Fetch additional user data from Firestore
    db.collection('users').doc(user.uid).get()
        .then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                
                // Try to get name from Firestore first, then fall back to Auth if missing
                playerNameInput.value = userData.displayName || authDisplayName;
                
                // If name is in Auth but not in Firestore, update Firestore
                if (!userData.displayName && authDisplayName) {
                    db.collection('users').doc(user.uid).update({
                        displayName: authDisplayName
                    });
                }
                
                // Set player stats...
                highScoreElement.textContent = userData.highScore?.toLocaleString() || '0';
                bananasCollectedElement.textContent = userData.bananasCollected?.toLocaleString() || '0';
                gamesPlayedElement.textContent = userData.gamesPlayed?.toLocaleString() || '0';
            } else {
                // No Firestore document exists yet, create one with default values
                db.collection('users').doc(user.uid).set({
                    displayName: authDisplayName,
                    email: user.email,
                    highScore: 0,
                    bananasCollected: 0,
                    gamesPlayed: 0
                });
                
                playerNameInput.value = authDisplayName;
            }
            
            // Show account content
            loadingMessage.style.display = 'none';
            accountContent.style.display = 'block';
        })
        .catch(error => {
            console.error("Error getting user document:", error);
            loadingMessage.textContent = 'Error loading user data. Please try again.';
        });
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
        // Update displayName in Firestore
        db.collection('users').doc(user.uid).update({
            displayName: newName
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
        db.collection('users').doc(user.uid).get()
            .then(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    const currentHighScore = userData.highScore || 0;
                    
                    // Only update if new score is higher
                    if (newScore > currentHighScore) {
                        return db.collection('users').doc(user.uid).update({
                            highScore: newScore
                        });
                    }
                }
            })
            .catch(error => {
                console.error("Error updating high score:", error);
            });
    }
}

// Function to update game stats (call this when player finishes a game)
function updateGameStats(bananasCollected) {
    const user = auth.currentUser;
    if (user) {
        db.collection('users').doc(user.uid).get()
            .then(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    const currentBananas = userData.bananasCollected || 0;
                    const currentGames = userData.gamesPlayed || 0;
                    
                    return db.collection('users').doc(user.uid).update({
                        bananasCollected: currentBananas + bananasCollected,
                        gamesPlayed: currentGames + 1
                    });
                }
            })
            .catch(error => {
                console.error("Error updating game stats:", error);
            });
    }
}