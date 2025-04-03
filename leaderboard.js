// Import Firebase modules
// https://firebase.google.com/docs/auth/web/start used for reference

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getFirestore, collection, query, orderBy, limit, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

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
const db = getFirestore();

document.addEventListener('DOMContentLoaded', () => {
  loadShooterLeaderboard();
  loadPlayerStats();
});

//Used LLM for referencing of codes
// Load Shooter Game Leaderboard
async function loadShooterLeaderboard() {
    
  const leaderboardContainer = document.getElementById('shooter-leaderboard');
  
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("shooterHighScore", "desc"), limit(10));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      leaderboardContainer.innerHTML = '<p class="no-data">No scores recorded yet. Be the first to play!</p>';
      return;
    }
    
    let tableHTML = `
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>High Score</th>
            <th>Last Played</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    let rank = 1;
    let hasScores = false;
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Skip entries with no shooter score
      if (!data.shooterHighScore) return;
      
      hasScores = true;
      const playerName = data.displayName || doc.id.split('@')[0];
      const highScore = data.shooterHighScore || 0;
      
      let lastPlayed = 'Never';
      if (data.lastPlayedShooter) {
        const date = data.lastPlayedShooter.toDate ? data.lastPlayedShooter.toDate() : new Date(data.lastPlayedShooter);
        lastPlayed = date.toLocaleDateString();
      }
      
      const rowClass = rank <= 3 ? `rank-${rank}` : '';
      
      tableHTML += `
        <tr class="${rowClass}">
          <td>${rank}</td>
          <td>${playerName}</td>
          <td>${highScore}</td>
          <td>${lastPlayed}</td>
        </tr>
      `;
      
      rank++;
    });
    
    // If no shooter scores were found
    if (!hasScores) {
      leaderboardContainer.innerHTML = '<p class="no-data">No scores recorded yet. Be the first to play!</p>';
      return;
    }
    
    tableHTML += '</tbody></table>';
    leaderboardContainer.innerHTML = tableHTML;
    
  } catch (error) {
    console.error("Error fetching shooter leaderboard:", error);
    leaderboardContainer.innerHTML = '<p class="error">Failed to load leaderboard. Please try again later.</p>';
  }
}

// Load Current Player Stats
async function loadPlayerStats() {
  const playerStatsContainer = document.getElementById('player-stats');
  
  // Check if user is logged in by getting player email from localStorage
  const playerEmail = localStorage.getItem('userEmail');
  
  if (!playerEmail) {
    playerStatsContainer.innerHTML = '<p>Please log in to view your statistics.</p>';
    return;
  }
  
  try {
    // Fetch current user's data from Firestore
    const usersCollection = collection(db, "users");
    const q = query(usersCollection);
    const querySnapshot = await getDocs(q);
    
    // Find user by email
    let userData = null;
    let playerDoc = null;
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.email === playerEmail) {
        userData = data;
        playerDoc = doc.id;
      }
    });
    
    if (!userData) {
      playerStatsContainer.innerHTML = '<p>No statistics found for your account.</p>';
      return;
    }
    const shooterRanking = await getPlayerRanking(playerDoc, "shooterHighScore");
    const shooterHighScore = userData.shooterHighScore || 0;
    const playerName = userData.displayName || playerEmail.split('@')[0];
    
    // If player has no shooter score yet
    if (!userData.shooterHighScore) {
      playerStatsContainer.innerHTML = `
        <h4>Player: ${playerName}</h4>
        <p>You haven't played the Banana Shooter game yet. Play now to get on the leaderboard!</p>
      `;
      return;
    }
    
    playerStatsContainer.innerHTML = `
      <h4>Player: ${playerName}</h4>
      <div class="stats-grid">
        <div class="stat-card">
          <h4>Your High Score</h4>
          <div class="stat-value">${shooterHighScore}</div>
          <div class="rank">Rank: ${shooterRanking}</div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error("Error fetching player stats:", error);
    playerStatsContainer.innerHTML = '<p class="error">Failed to load your statistics. Please try again later.</p>';
  }
}

// Get player ranking
async function getPlayerRanking(playerId, scoreField) {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy(scoreField, "desc"));
    const querySnapshot = await getDocs(q);
    
    let rank = 1;
    let playerRank = "N/A";
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (!data[scoreField]) return;
      
      if (doc.id === playerId) {
        playerRank = rank;
      }
      rank++;
    });
    
    return playerRank;
  } catch (error) {
    console.error(`Error getting ranking for ${scoreField}:`, error);
    return "N/A";
  }
}