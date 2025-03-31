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
    
    // Set loading messages
    highScoreElement.textContent = "Loading...";
    bananasCollectedElement.textContent = "Loading...";
    gamesPlayedElement.textContent = "Loading...";
    
    console.log("Loading user data for:", user.email);
    
    // Fetch additional user data from 'users' collection using UID
    db.collection('users').doc(user.uid).get()
        .then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                console.log("Found user document:", userData);
                
                // Set player name if it exists in Firestore - CHECK FOR DISPLAY NAME FIRST
                playerNameInput.value = userData.displayName || userData.name || '';
                
                // If name is still empty, try to get it from localStorage or sessionStorage
                if (!playerNameInput.value) {
                    playerNameInput.value = localStorage.getItem('playerName') || 
                                           sessionStorage.getItem('playerName') || 
                                           user.email.split('@')[0] || '';
                }
                
                // Set player stats if they exist
                bananasCollectedElement.textContent = userData.bananasCollected?.toLocaleString() || '0';
                gamesPlayedElement.textContent = userData.gamesPlayed?.toLocaleString() || '0';
                
                // Set shooter high score directly from user document
                if (userData.shooterHighScore) {
                    console.log("Found shooter high score in user document:", userData.shooterHighScore);
                    highScoreElement.textContent = userData.shooterHighScore.toLocaleString();
                } else {
                    console.log("No shooter high score found in user document");
                    highScoreElement.textContent = '0';
                }
                
                // Save the name back to Firestore if we got it from another source but it's not in Firestore
                if (playerNameInput.value && !userData.displayName && !userData.name) {
                    db.collection('users').doc(user.uid).update({
                        displayName: playerNameInput.value
                    }).catch(error => console.error("Error updating displayName:", error));
                }
            } else {
                console.log("No user document found, creating one");
                // Try to get name from session or localStorage
                const storedName = localStorage.getItem('playerName') || 
                                   sessionStorage.getItem('playerName') || 
                                   user.email.split('@')[0] || '';
                
                // No Firestore document exists yet, create one with default values
                db.collection('users').doc(user.uid).set({
                    displayName: storedName,
                    email: user.email,
                    bananasCollected: 0,
                    gamesPlayed: 0,
                    shooterHighScore: 0
                });
                
                playerNameInput.value = storedName;
                highScoreElement.textContent = '0';
                bananasCollectedElement.textContent = '0';
                gamesPlayedElement.textContent = '0';
            }
            
            // Also search by email in users collection to find all documents related to this user
            searchUsersByEmail(user.email, user.uid);
            
            // Show account content
            loadingMessage.style.display = 'none';
            accountContent.style.display = 'block';
        })
        .catch(error => {
            console.error("Error getting user document:", error);
            loadingMessage.textContent = 'Error loading user data. Please try again.';
            
            // Still show account content with default values
            highScoreElement.textContent = '0';
            bananasCollectedElement.textContent = '0';
            gamesPlayedElement.textContent = '0';
            loadingMessage.style.display = 'none';
            accountContent.style.display = 'block';
        });
}

// Function to search for user documents by email
function searchUsersByEmail(email, currentUserId) {
    console.log("Searching for user documents with email:", email);
    
    db.collection('users')
        .where('email', '==', email)
        .get()
        .then(snapshot => {
            console.log("Found", snapshot.size, "documents with matching email");
            
            if (snapshot.empty) {
                // Try alternate field name
                db.collection('users')
                    .where('userEmail', '==', email)
                    .get()
                    .then(altSnapshot => {
                        processUserDocuments(altSnapshot.docs, currentUserId);
                    })
                    .catch(error => console.error("Error in alternate email search:", error));
                return;
            }
            
            processUserDocuments(snapshot.docs, currentUserId);
        })
        .catch(error => {
            console.error("Error searching for user by email:", error);
        });
}

// Process all user documents found
function processUserDocuments(docs, currentUserId) {
    let highestShooterScore = parseInt(highScoreElement.textContent.replace(/,/g, '')) || 0;
    let userDocToUpdate = null;
    
    docs.forEach(doc => {
        const userData = doc.data();
        console.log("Processing user document:", doc.id, userData);
        
        if (userData.shooterHighScore && userData.shooterHighScore > highestShooterScore) {
            highestShooterScore = userData.shooterHighScore;
            console.log("Found higher shooter score:", highestShooterScore);
        }
    });
    
    // Update the high score display if we found a higher score
    if (highestShooterScore > 0) {
        console.log("Setting highest shooter score:", highestShooterScore);
        highScoreElement.textContent = highestShooterScore.toLocaleString();
        
        // Also update the current user's document if needed
        if (parseInt(highScoreElement.textContent.replace(/,/g, '')) < highestShooterScore) {
            db.collection('users').doc(currentUserId).update({
                shooterHighScore: highestShooterScore
            }).then(() => {
                console.log("Updated user document with highest shooter score");
            }).catch(error => {
                console.error("Error updating user document:", error);
            });
        }
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
            displayName: newName
        })
        .then(() => {
            // Update displayName in Auth if needed
            return user.updateProfile({
                displayName: newName
            });
        })
        .then(() => {
            // Save to localStorage and sessionStorage for cross-page consistency
            localStorage.setItem('playerName', newName);
            sessionStorage.setItem('playerName', newName);
            
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
        // Get the current player name
        db.collection('users').doc(user.uid).get()
            .then(doc => {
                const playerName = doc.exists ? 
                                  (doc.data().displayName || doc.data().name || user.displayName || 'Anonymous') : 
                                  (user.displayName || localStorage.getItem('playerName') || 'Anonymous');
                
                // Also get current high score to see if we need to update it
                const currentHighScore = doc.exists ? (doc.data().highScore || 0) : 0;
                
                // Add new score document in 'scores' collection
                const scorePromise = db.collection('scores').add({
                    playerName: playerName,
                    playerEmail: user.email, // Add email for reliable queries
                    score: newScore,
                    difficulty: localStorage.getItem('gameDifficulty') || 'medium', // Get from localStorage
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                // Update high score in user document if needed
                let updatePromise = Promise.resolve();
                if (newScore > currentHighScore) {
                    updatePromise = db.collection('users').doc(user.uid).update({
                        highScore: newScore
                    });
                }
                
                return Promise.all([scorePromise, updatePromise]);
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
                    // Try to get name from various sources
                    const playerName = localStorage.getItem('playerName') || 
                                     sessionStorage.getItem('playerName') || 
                                     user.displayName || 
                                     user.email.split('@')[0] || '';
                    
                    // If the document doesn't exist, create it
                    return db.collection('users').doc(user.uid).set({
                        displayName: playerName,
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