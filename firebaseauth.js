// https://firebase.google.com/docs/auth/web/start used for reference
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js"
import { getFirestore, setDoc, doc, updateDoc, increment, getDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js"

//Firebase configuration obtained from Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDkN-xlEdgk5W7RQJwH8LGV-eOmN7LNF8Y",
  authDomain: "smart-banana-97744.firebaseapp.com",
  projectId: "smart-banana-97744",
  storageBucket: "smart-banana-97744.firebasestorage.app",
  messagingSenderId: "225178137471",
  appId: "1:225178137471:web:02a4135eb6347bd7c5204a"
};

//https://medium.com/@sfazleyrabbi/firebase-login-and-registration-authentication-99ea25388cbf used for reference
//Used LLM for code enhancements and bug fixes.

//Initializing the firebase
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
  }, 5000); //fade out message after 5 seconds
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

    //Create user with the email and password provided
    //https://www.youtube.com/watch?v=WM178YopjfI&t=301s used for reference
    //Used LLM as well for code enhancements and bug fixes
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        
        //Display the name of the player in the authentication
        return updateProfile(user, {
          displayName: name
        }).then(() => {
          //Display fields in the firestore database
          const userData = {
            email: email,  
            displayName: name,
            bananasCollected: 0,  
            gamesPlayed: 0,      
            shooterHighScore: 0   
          };
          
          showMessage('Player account created successfully! Redirecting to login...', 'signUpMessage');
          
          //storing data in the firestore
          return setDoc(doc(db, "users", user.uid), userData);
        });
      })
      .then(() => {
        console.log("Document successfully written!");
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);
      })
      .catch((error) => {
        console.error("Error writing document or creating user:", error);
        const errorCode = error.code;
        //Display duplicate email message or error message
        if (errorCode == 'auth/email-already-in-use') {
          showMessage("Email already exists", 'signUpMessage');
        } else {
          showMessage('Unable to create player account: ' + error.message, 'signUpMessage');
        }
      });
  });

  const googleSignInButton = document.querySelector('button[id="googleSignUpBtn"]');
  if (googleSignInButton) {
    googleSignInButton.addEventListener('click', signInWithGoogle);
  } else {
    const googleButton = document.querySelector('.google-signup-btn') || document.querySelector('button:contains("Sign up with Google")');
    //Event listener for the button when clicked
    if (googleButton) {
      googleButton.addEventListener('click', signInWithGoogle);
    } else {
      console.error("Google sign-up button not found");
    }
  }
});

//https://firebase.google.com/docs/auth/web/google-signin used for reference
//https://www.youtube.com/watch?v=Uhbn1KmiNbg used for reference
//Used LLM for code enhancements

//Google sign-in function
function signInWithGoogle(event) {
  if (event) {
    event.preventDefault();
  }
  
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  const db = getFirestore();
  
  showMessage('Connecting to Google...', 'signUpMessage');
  //Google sign in pop-up
  signInWithPopup(auth, provider)
    .then((result) => {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const user = result.user;
      
      const userDocRef = doc(db, "users", user.uid);
      return getDoc(userDocRef)
        .then((docSnapshot) => {
          if (!docSnapshot.exists()) {
          //Creating the user if not existing in firestore
            const userData = {
              email: user.email,
              displayName: user.displayName || "Banana Player", 
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

//Calling function to update score from game.js
export function updatePlayerScore(userId, newScore) {
  const db = getFirestore();
  const userRef = doc(db, "users", userId);
//Updating score and games played
  return updateDoc(userRef, {
    shooterHighScore: newScore,
    gamesPlayed: increment(1)
  }).catch((error) => {
    console.error("Error updating score:", error);
  });
}
//Retreiving the current user
export function getCurrentUser() {
  const auth = getAuth();
  return auth.currentUser;
}