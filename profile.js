// https://firebase.google.com/docs/auth/web/start used for reference

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged,
  updateProfile 
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

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
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

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

// Debug function to log all fields in an object
function logAllFields(obj, prefix = '') {
  console.log(`${prefix} Fields:`, Object.keys(obj));
  for (const [key, value] of Object.entries(obj)) {
    console.log(`${prefix} ${key}:`, value);
  }
}

//Checking the user login
onAuthStateChanged(auth, user => {
  if (user) {
    loadUserData(user);
  } else {
    window.location.href = 'login.html';
  }
});

//https://firebase.google.com/docs/firestore/query-data/get-data used for reference
//https://stackoverflow.com/questions/56249121/how-to-retrieve-and-display-data-from-users-that-are-logged-in-firestore used for reference
//https://www.youtube.com/watch?v=qWy9ylc3f9U used for reference

// Load user data from Firestore
async function loadUserData(user) {
  emailInput.value = user.email;
  
  highScoreElement.textContent = "Loading...";
  bananasCollectedElement.textContent = "Loading...";
  gamesPlayedElement.textContent = "Loading...";
  
  console.log("Loading user data for:", user.email);
  
  try {
    //Fetching additional data from the collection
    const userDocRef = doc(db, "users", user.uid);
    const userSnapshot = await getDoc(userDocRef);
    
    if (userSnapshot.exists()) {
      const userData = userSnapshot.data();
      console.log("Found user document:", userData);
      logAllFields(userData, "User data");
      playerNameInput.value = userData.displayName || '';
      if (!playerNameInput.value) {
        playerNameInput.value = localStorage.getItem('playerName') || 
                              sessionStorage.getItem('playerName') || 
                              user.email.split('@')[0] || '';
      }
      if (userData.bananasCollected !== undefined) {
        bananasCollectedElement.textContent = parseInt(userData.bananasCollected).toLocaleString();
      } else {
        bananasCollectedElement.textContent = '0';
      }
      
      //Check number of games played
      if (userData.gamesPlayed !== undefined) {
        gamesPlayedElement.textContent = parseInt(userData.gamesPlayed).toLocaleString();
      } else {
        gamesPlayedElement.textContent = '0';
      }
      
      //Displaying of high score
      let shooterScore = 0;
      if (userData.shooterHighScore !== undefined) {
        shooterScore = parseInt(userData.shooterHighScore);
      } else if (userData.highScore !== undefined) {
        shooterScore = parseInt(userData.highScore);
      } else if (userData.score !== undefined) {
        shooterScore = parseInt(userData.score);
      }
      
      console.log("Found shooter high score in user document:", shooterScore);
      highScoreElement.textContent = shooterScore.toLocaleString();
    
      if (playerNameInput.value && !userData.displayName) {
        try {
          await updateDoc(userDocRef, {
            displayName: playerNameInput.value
          });
        } catch (error) {
          console.error("Error updating displayName:", error);
        }
      }
    } else {
      console.log("No user document found, creating one");
      // Try to get name from session or localStorage
      const storedName = localStorage.getItem('playerName') || 
                       sessionStorage.getItem('playerName') || 
                       user.email.split('@')[0] || '';
      
      //Create firestore document if no document exist
      await setDoc(userDocRef, {
        displayName: storedName,
        email: user.email,
        highScore: 0, 
        score: 0,
        lastPlayed: serverTimestamp(),
        bananasCollected: 0,
        gamesPlayed: 0
      });
      
      playerNameInput.value = storedName;
      highScoreElement.textContent = '0';
      bananasCollectedElement.textContent = '0';
      gamesPlayedElement.textContent = '0';
    }
    await searchUsersByEmail(user.email, user.uid);
    localStorage.setItem('userEmail', user.email);
    
    loadingMessage.style.display = 'none';
    accountContent.style.display = 'block';
  } catch (error) {
    console.error("Error getting user document:", error);
    loadingMessage.textContent = 'Error loading user data. Please try again.';
    
    //Show default values if there is an error loading user data
    highScoreElement.textContent = '0';
    bananasCollectedElement.textContent = '0';
    gamesPlayedElement.textContent = '0';
    loadingMessage.style.display = 'none';
    accountContent.style.display = 'block';
  }
}

// Function to search for user documents by email
async function searchUsersByEmail(email, currentUserId) {
  console.log("Searching for user documents with email:", email);
  
  try {
    // Search for documents with matching email
    const usersCollection = collection(db, "users");
    const emailQuery = query(usersCollection, where("email", "==", email));
    const emailSnapshot = await getDocs(emailQuery);
    
    console.log("Found", emailSnapshot.size, "documents with matching email");
    
    if (emailSnapshot.empty) {
      console.log("No documents found with email:", email);
      return;
    }
    
    await processUserDocuments(emailSnapshot.docs, currentUserId);
  } catch (error) {
    console.error("Error searching for user by email:", error);
  }
}

async function processUserDocuments(docs, currentUserId) {
  let highestShooterScore = parseInt(highScoreElement.textContent.replace(/,/g, '')) || 0;
  
  docs.forEach(document => {
    const userData = document.data();
    console.log("Processing user document:", document.id, userData);
    logAllFields(userData, "Processing document");
    let docHighScore = 0;
    
    if (userData.shooterHighScore !== undefined) {
      docHighScore = parseInt(userData.shooterHighScore) || 0;
    } else if (userData.highScore !== undefined) {
      docHighScore = parseInt(userData.highScore) || 0;
    } else if (userData.score !== undefined) {
      docHighScore = parseInt(userData.score) || 0;
    }
    
    if (docHighScore > highestShooterScore) {
      highestShooterScore = docHighScore;
      console.log("Found higher shooter score:", highestShooterScore);
    }
  });
  
  //https://stackoverflow.com/questions/64113076/javascript-high-score-update-regardless-of-whether-new-score-is-higher-or-not
  //Used LLM for code enhancements
  
  // Update the high score display if we found a higher score
  if (highestShooterScore > 0) {
    console.log("Setting highest shooter score:", highestShooterScore);
    highScoreElement.textContent = highestShooterScore.toLocaleString();
    
    try {
      // Also update the current user's document if needed
      const currentUserDocRef = doc(db, "users", currentUserId);
      const currentUserDoc = await getDoc(currentUserDocRef);
      
      if (currentUserDoc.exists()) {
        const userData = currentUserDoc.data();
        let currentHighScore = 0;
        
        // Check which field name is being used
        if (userData.shooterHighScore !== undefined) {
          currentHighScore = parseInt(userData.shooterHighScore) || 0;
          
          //Checking the new score with the previous score
          if (highestShooterScore > currentHighScore) {
            await updateDoc(currentUserDocRef, {
              shooterHighScore: highestShooterScore
            });
          }
        } else if (userData.highScore !== undefined) {
          currentHighScore = parseInt(userData.highScore) || 0;
          
          if (highestShooterScore > currentHighScore) {
            await updateDoc(currentUserDocRef, {
              highScore: highestShooterScore
            });
          }
        } else {
          await updateDoc(currentUserDocRef, {
            highScore: highestShooterScore
          });
        }
        console.log("Updated user document with highest shooter score:", highestShooterScore);
      }
    } catch (error) {
      console.error("Error updating user document:", error);
    }
  }
}

//Saving the player name
saveNameBtn.addEventListener('click', async function() {
  const newName = playerNameInput.value.trim();
  
  if (!newName) {
    errorMessage.textContent = 'Please enter a valid name';
    errorMessage.style.display = 'block';
    return;
  }
  errorMessage.style.display = 'none';
  saveNameBtn.disabled = true;
  saveNameBtn.textContent = 'Saving...';
  
  const user = auth.currentUser;
  if (user) {
    try {
      //Update name when changed
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        displayName: newName
      });
      await updateProfile(user, {
        displayName: newName
      });
      //Save in local storage for cross page consistency
      localStorage.setItem('playerName', newName);
      sessionStorage.setItem('playerName', newName);
      
      saveNameBtn.textContent = 'Saved!';
      setTimeout(() => {
        saveNameBtn.disabled = false;
        saveNameBtn.textContent = 'Save';
      }, 2000);
    } catch (error) {
      console.error("Error updating name:", error);
      errorMessage.textContent = 'Error saving name. Please try again.';
      errorMessage.style.display = 'block';
      saveNameBtn.disabled = false;
      saveNameBtn.textContent = 'Save';
    }
  }
});

// Function to update shooter high score
export async function updateShooterHighScore(newScore) {
  const user = auth.currentUser;
  if (user) {
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        let fieldName = 'highScore';
        let currentHighScore = 0;
        
        if (userData.shooterHighScore !== undefined) {
          fieldName = 'shooterHighScore';
          currentHighScore = parseInt(userData.shooterHighScore) || 0;
        } else if (userData.highScore !== undefined) {
          fieldName = 'highScore';
          currentHighScore = parseInt(userData.highScore) || 0;
        } else if (userData.score !== undefined) {
          fieldName = 'score';
          currentHighScore = parseInt(userData.score) || 0;
        }
        
        // Only update if the new score is higher
        if (newScore > currentHighScore) {
          const updateData = {
            [fieldName]: newScore,
            score: newScore,
            lastPlayed: serverTimestamp()
          };
          
          await updateDoc(userDocRef, updateData);
          console.log(`Updated ${fieldName} to:`, newScore);

          if (highScoreElement) {
            highScoreElement.textContent = newScore.toLocaleString();
          }
        } else {
          await updateDoc(userDocRef, {
            score: newScore,
            lastPlayed: serverTimestamp()
          });
          console.log("Updated current score to:", newScore);
        }
      } else {
        const playerName = localStorage.getItem('playerName') || 
                         sessionStorage.getItem('playerName') || 
                         user.displayName || 
                         user.email.split('@')[0] || '';
        
        await setDoc(userDocRef, {
          displayName: playerName,
          email: user.email,
          highScore: newScore, 
          score: newScore,
          lastPlayed: serverTimestamp(),
          bananasCollected: 0,
          gamesPlayed: 0
        });
        console.log("Created new user document with score:", newScore);
      }
    } catch (error) {
      console.error("Error updating shooter high score:", error);
    }
  } else {
    console.log("No user logged in, can't update score");
  }
}

// Function to update game stats (call this when player finishes a game)
export async function updateGameStats(bananasCollected) {
  const user = auth.currentUser;
  if (user) {
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentBananas = userData.bananasCollected || 0;
        const currentGames = userData.gamesPlayed || 0;
        
        //Updating the number of times the game is played
        await updateDoc(userDocRef, {
          bananasCollected: currentBananas + bananasCollected,
          gamesPlayed: currentGames + 1
        });
      } else {
        const playerName = localStorage.getItem('playerName') || 
                         sessionStorage.getItem('playerName') || 
                         user.displayName || 
                         user.email.split('@')[0] || '';
        await setDoc(userDocRef, {
          displayName: playerName,
          email: user.email,
          highScore: 0,
          score: 0,
          lastPlayed: serverTimestamp(),
          bananasCollected: bananasCollected,
          gamesPlayed: 1
        });
      }
      
      console.log("Game stats updated");

      if (bananasCollectedElement && gamesPlayedElement) {
        const currentBananas = parseInt(bananasCollectedElement.textContent.replace(/,/g, '')) || 0;
        const currentGames = parseInt(gamesPlayedElement.textContent.replace(/,/g, '')) || 0;
        
        bananasCollectedElement.textContent = (currentBananas + bananasCollected).toLocaleString();
        gamesPlayedElement.textContent = (currentGames + 1).toLocaleString();
      }
    } catch (error) {
      console.error("Error updating game stats:", error);
    }
  }
}