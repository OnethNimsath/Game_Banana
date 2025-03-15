// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js"
import { getFirestore, setDoc, doc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js"
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
        const userData = {
          email: email,
          name: name
        };
        
        showMessage('Player account created successfully! Redirecting to login...', 'signUpMessage');
        
        // This is where we store the data in Firestore
        return setDoc(doc(db, "users", user.uid), userData);
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
});