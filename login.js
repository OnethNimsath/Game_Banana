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
        
        // Extract username from email if displayName is not available
        const playerName = userData.displayName || email.split('@')[0];
        
        // Store in both sessionStorage and localStorage for different use cases
        sessionStorage.setItem('playerName', playerName);
        sessionStorage.setItem('playerEmail', userData.email);
        sessionStorage.setItem('playerId', user.uid);
        
        // Also store in localStorage for persistence across sessions
        localStorage.setItem('playerName', playerName);
        localStorage.setItem('userEmail', userData.email);
        localStorage.setItem('playerId', user.uid);
        
        showMessage(`Welcome back, ${playerName}! Redirecting to game menu...`, 'loginMessage');
        
        // Redirect to game menu after short delay
        console.log("Redirecting to menu.html in 2 seconds...");
        setTimeout(() => {
          window.location.href = 'menu.html';
        }, 2000);
      } else {
        console.log("No user data found in Firestore!");
        
        // Create a basic user record if none exists
        const basicUserData = {
          email: email,
          displayName: email.split('@')[0],
          score: 0,
          highScore: 0,
          lastPlayed: new Date()
        };
        
        // Store the basic data
        await setDoc(doc(db, "users", user.uid), basicUserData);
        
        // Store in both sessionStorage and localStorage
        const playerName = email.split('@')[0];
        sessionStorage.setItem('playerName', playerName);
        sessionStorage.setItem('playerEmail', email);
        sessionStorage.setItem('playerId', user.uid);
        
        localStorage.setItem('playerName', playerName);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('playerId', user.uid);
        
        showMessage(`Welcome, ${playerName}! Redirecting to game menu...`, 'loginMessage');
        
        setTimeout(() => {
          window.location.href = 'menu.html';
        }, 2000);
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