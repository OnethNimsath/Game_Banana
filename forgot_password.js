// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

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

// Reset password form submission handler
document.addEventListener('DOMContentLoaded', function() {
  const resetForm = document.getElementById('resetForm');
  
  if (!resetForm) {
    console.error("Reset form not found");
    return;
  }
  
  resetForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const resetButton = document.getElementById('resetButton');
    
    // Disable button to prevent multiple submissions
    resetButton.disabled = true;
    resetButton.textContent = "Sending...";
    
    try {
      await sendPasswordResetEmail(auth, email);
      showMessage(`Password reset link sent to ${email}. Please check your inbox and spam folders.`, 'resetMessage');
      document.getElementById('email').value = '';
      setTimeout(() => {
        resetButton.disabled = false;
        resetButton.textContent = "Send Reset Password Link";
      }, 3000);
      
    } catch (error) {
      console.error("Password reset error:", error);

      let errorMessage = "Failed to send reset email. Please try again.";
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email address.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many password reset attempts. Please try again later.";
      }
      
      showMessage(errorMessage, 'resetMessage');
      resetButton.disabled = false;
      resetButton.textContent = "Send Reset Password Link";
    }
  });
});