// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, getDoc, doc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

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

// Function to show messages
function showMessage(message, divClass) {
  const messageDiv = document.querySelector("." + divClass);
  if (!messageDiv) {
    console.error("Message div not found:", divClass);
    return;
  }
  messageDiv.style.display = "block";
  messageDiv.innerHTML = message;
  messageDiv.style.opacity = 1;
  setTimeout(function() {
    messageDiv.style.opacity = 0;
  }, 5000);
}

// Login form submission handler
document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  
  if (!loginForm) {
    console.error("Login form not found");
    return;
  }
  
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
      console.log("Attempting login for:", email);
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("Successfully logged in:", user.uid);
      
      // Get user data from Firestore
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const userData = docSnap.data();
        console.log("Retrieved user data:", userData);
        
        // Set player name in session storage for use in the game
        sessionStorage.setItem('playerName', userData.name);
        sessionStorage.setItem('playerEmail', userData.email);
        sessionStorage.setItem('playerId', user.uid);
        
        showMessage(`Welcome back, ${userData.name}! Redirecting to game menu...`, 'loginMessage');
        
        // Redirect to game menu after short delay
        console.log("Redirecting to menu.html in 2 seconds...");
        setTimeout(() => {
          window.location.href = 'menu.html';
        }, 2000);
      } else {
        console.log("No user data found in Firestore!");
        showMessage("User data not found. Please contact support.", 'loginMessage');
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorCode = error.code;
      
      if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') {
        showMessage("Invalid email or password", 'loginMessage');
      } else {
        showMessage("Login failed: " + error.message, 'loginMessage');
      }
    }
  });
});