// Import Firebase modules
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

// Check if user is logged in
onAuthStateChanged(auth, user => {
  if (user) {
    // User is signed in, fetch their data from Firestore
    loadUserData(user);
  } else {
    // No user is signed in, redirect to login page
    window.location.href = 'login.html';
  }
});

// Load user data from Firestore
async function loadUserData(user) {
  // Set email from auth
  emailInput.value = user.email;
  
  // Set loading messages
  highScoreElement.textContent = "Loading...";
  bananasCollectedElement.textContent = "Loading...";
  gamesPlayedElement.textContent = "Loading...";
  
  console.log("Loading user data for:", user.email);
  
  try {
    // Fetch additional user data from 'users' collection using UID
    const userDocRef = doc(db, "users", user.uid);
    const userSnapshot = await getDoc(userDocRef);
    
    if (userSnapshot.exists()) {
      const userData = userSnapshot.data();
      console.log("Found user document:", userData);
      
      // Log all fields to debug
      logAllFields(userData, "User data");
      
      // Set player name if it exists in Firestore
      playerNameInput.value = userData.displayName || '';
      
      // If name is still empty, try to get it from localStorage or sessionStorage
      if (!playerNameInput.value) {
        playerNameInput.value = localStorage.getItem('playerName') || 
                              sessionStorage.getItem('playerName') || 
                              user.email.split('@')[0] || '';
      }
      
      // Set bananas collected if it exists
      if (userData.bananasCollected !== undefined) {
        bananasCollectedElement.textContent = parseInt(userData.bananasCollected).toLocaleString();
      } else {
        bananasCollectedElement.textContent = '0';
      }
      
      // Set games played if it exists
      if (userData.gamesPlayed !== undefined) {
        gamesPlayedElement.textContent = parseInt(userData.gamesPlayed).toLocaleString();
      } else {
        gamesPlayedElement.textContent = '0';
      }
      
      // IMPORTANT: Check for both shooterHighScore and highScore fields
      // Based on console output, it appears your document uses highScore, not shooterHighScore
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
      
      // Save the name back to Firestore if we got it from another source but it's not in Firestore
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
      
      // No Firestore document exists yet, create one with default values
      await setDoc(userDocRef, {
        displayName: storedName,
        email: user.email,
        highScore: 0,  // Using highScore based on your document structure
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
    
    // Also search by email in users collection to find all documents related to this user
    await searchUsersByEmail(user.email, user.uid);
    
    // Store email in localStorage for other pages
    localStorage.setItem('userEmail', user.email);
    
    // Show account content
    loadingMessage.style.display = 'none';
    accountContent.style.display = 'block';
  } catch (error) {
    console.error("Error getting user document:", error);
    loadingMessage.textContent = 'Error loading user data. Please try again.';
    
    // Still show account content with default values
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

// Process all user documents found
async function processUserDocuments(docs, currentUserId) {
  let highestShooterScore = parseInt(highScoreElement.textContent.replace(/,/g, '')) || 0;
  
  docs.forEach(document => {
    const userData = document.data();
    console.log("Processing user document:", document.id, userData);
    
    // Log all fields for debugging
    logAllFields(userData, "Processing document");
    
    // Check multiple field names that might contain the score
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
          // If neither field exists, use highScore based on your structure
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

// Save player name button functionality
saveNameBtn.addEventListener('click', async function() {
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
    try {
      // Update name in Firestore
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        displayName: newName
      });
      
      // Update displayName in Auth if needed
      await updateProfile(user, {
        displayName: newName
      });
      
      // Save to localStorage and sessionStorage for cross-page consistency
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

// Function to update shooter high score (call this when player finishes a shooter game)
export async function updateShooterHighScore(newScore) {
  const user = auth.currentUser;
  if (user) {
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Determine which field is used for high score
        let fieldName = 'highScore'; // Default based on your structure
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
          
          // Update the display if we're on the profile page
          if (highScoreElement) {
            highScoreElement.textContent = newScore.toLocaleString();
          }
        } else {
          // Always update the current score and timestamp
          await updateDoc(userDocRef, {
            score: newScore,
            lastPlayed: serverTimestamp()
          });
          console.log("Updated current score to:", newScore);
        }
      } else {
        // If document doesn't exist, create it with the shooter score
        const playerName = localStorage.getItem('playerName') || 
                         sessionStorage.getItem('playerName') || 
                         user.displayName || 
                         user.email.split('@')[0] || '';
        
        await setDoc(userDocRef, {
          displayName: playerName,
          email: user.email,
          highScore: newScore,  // Using highScore based on your structure
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
        
        // Update user document with incremented stats
        await updateDoc(userDocRef, {
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
        await setDoc(userDocRef, {
          displayName: playerName,
          email: user.email,
          highScore: 0,  // Using highScore based on your structure
          score: 0,
          lastPlayed: serverTimestamp(),
          bananasCollected: bananasCollected,
          gamesPlayed: 1
        });
      }
      
      console.log("Game stats updated");
      
      // Refresh the displayed stats if we're on the profile page
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