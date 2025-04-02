// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js"
import { getFirestore, setDoc, doc, updateDoc, increment, getDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
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

function showMessage(message, divID) {
  var messageDiv = document.querySelector("." + divID);
  if (!messageDiv) {
    console.error("Message div not found:", divID);
    return;
  }
  messageDiv.style.display = "block";
  messageDiv.innerHTML = message;
  messageDiv.style.opacity = 1;
  setTimeout(function() {
    messageDiv.style.opacity = 0;
  }, 5000);
}

document.addEventListener('DOMContentLoaded', function() {
  const signUpForm = document.getElementById('signupForm');
  if (!signUpForm) {
    console.error("Signup form not found");
    return;
  }

  signUpForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const name = document.getElementById('name').value;

    const auth = getAuth();
    const db = getFirestore();

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        
        // Set the display name in Firebase Authentication
        return updateProfile(user, {
          displayName: name
        }).then(() => {
          // After displayName is updated, proceed to store in Firestore
          const userData = {
            email: email,  // Store email explicitly in Firestore
            displayName: name,
            bananasCollected: 0,  // Initialize bananas collected
            gamesPlayed: 0,      // Initialize games played counter
            shooterHighScore: 0   // Initialize shooter high score
          };
          
          showMessage('Player account created successfully! Redirecting to login...', 'signUpMessage');
          
          // This is where we store the data in Firestore
          return setDoc(doc(db, "users", user.uid), userData);
        });
      })
      .then(() => {
        console.log("Document successfully written!");
        // Changed redirect to login.html instead of menu.html
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000); // Give user time to see the success message
      })
      .catch((error) => {
        console.error("Error writing document or creating user:", error);
        const errorCode = error.code;
        if (errorCode == 'auth/email-already-in-use') {
          showMessage("Email already exists", 'signUpMessage');
        } else {
          showMessage('Unable to create player account: ' + error.message, 'signUpMessage');
        }
      });
  });
  
  // Add Google Sign-in button event listener - Updated to match your HTML ID
  const googleSignInButton = document.querySelector('button[id="googleSignUpBtn"]');
  if (googleSignInButton) {
    googleSignInButton.addEventListener('click', signInWithGoogle);
  } else {
    // Try finding the Google button by the class or the Sign up with Google button in a different way
    const googleButton = document.querySelector('.google-signup-btn') || document.querySelector('button:contains("Sign up with Google")');
    if (googleButton) {
      googleButton.addEventListener('click', signInWithGoogle);
    } else {
      console.error("Google sign-up button not found");
    }
  }
});

// Function to handle Google sign-in
function signInWithGoogle(event) {
  // Prevent form submission
  if (event) {
    event.preventDefault();
  }
  
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  const db = getFirestore();
  
  // Show a loading message
  showMessage('Connecting to Google...', 'signUpMessage');
  
  signInWithPopup(auth, provider)
    .then((result) => {
      // This gives you a Google Access Token
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const user = result.user;
      
      // Check if user document exists in Firestore
      const userDocRef = doc(db, "users", user.uid);
      
      return getDoc(userDocRef)
        .then((docSnapshot) => {
          if (!docSnapshot.exists()) {
            // New user - create document in Firestore
            const userData = {
              email: user.email,
              displayName: user.displayName || "Banana Player", // Fallback if no display name
              bananasCollected: 0,
              gamesPlayed: 0,
              shooterHighScore: 0
            };
            
            return setDoc(userDocRef, userData)
              .then(() => {
                showMessage('Account created with Google successfully!', 'signUpMessage');
                setTimeout(() => {
                  window.location.href = 'menu.html';
                }, 2000);
              });
          } else {
            // Existing user - redirect directly
            showMessage('Signed in with Google successfully!', 'signUpMessage');
            setTimeout(() => {
              window.location.href = 'menu.html';
            }, 2000);
          }
        });
    })
    .catch((error) => {
      console.error("Google sign-in error:", error);
      showMessage('Google sign-in failed: ' + error.message, 'signUpMessage');
    });
}

// Function to update player score in Firestore
// This function can be called from game.js when a player scores
export function updatePlayerScore(userId, newScore) {
  const db = getFirestore();
  const userRef = doc(db, "users", userId);
  
  // Update the player's score and increment games played
  return updateDoc(userRef, {
    shooterHighScore: newScore,
    gamesPlayed: increment(1)
  }).catch((error) => {
    console.error("Error updating score:", error);
  });
}

// Function to get current user
export function getCurrentUser() {
  const auth = getAuth();
  return auth.currentUser;
}