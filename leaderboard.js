// Import Firebase modules
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';

// Your Firebase configuration
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
const db = getFirestore(app);

// Class to handle leaderboard functionality
class Leaderboard {
  constructor(difficulty = 'easy', maxEntries = 20) {
    this.difficulty = difficulty;
    this.maxEntries = maxEntries;
    this.leaderboardData = [];
    this.leaderboardContainer = document.querySelector('.leaderboard-entries');
  }

  // Fetch top scores from Firestore
  async fetchTopScores() {
    try {
      // Query scores collection for the specified difficulty, ordered by score descending
      const scoresQuery = query(
        collection(db, 'scores'),
        where('difficulty', '==', this.difficulty),
        orderBy('score', 'desc'),
        limit(this.maxEntries)
      );
      
      const scoresSnapshot = await getDocs(scoresQuery);
      const scores = [];
      
      // Process each score document
      for (const scoreDoc of scoresSnapshot.docs) {
        const scoreData = scoreDoc.data();
        let playerInfo = { displayName: scoreData.playerName };
        
        // If it's not "Anonymous", try to get the user details
        if (scoreData.playerName !== 'Anonymous') {
          // Try to find user by name
          const usersQuery = query(
            collection(db, 'users'),
            where('name', '==', scoreData.playerName)
          );
          
          const usersSnapshot = await getDocs(usersQuery);
          
          if (!usersSnapshot.empty) {
            const userData = usersSnapshot.docs[0].data();
            playerInfo = {
              displayName: userData.displayName || userData.name,
              email: userData.email
            };
          }
        }
        
        scores.push({
          playerName: playerInfo.displayName,
          playerEmail: playerInfo.email,
          score: scoreData.score,
          timestamp: scoreData.timestamp
        });
      }
      
      this.leaderboardData = scores;
      return scores;
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
      return [];
    }
  }
  
  // Render the leaderboard in the container
  renderLeaderboard() {
    if (!this.leaderboardContainer) {
      console.error('Leaderboard entries container not found!');
      return;
    }
    
    // Clear existing content
    this.leaderboardContainer.innerHTML = '';
    
    // Add each entry
    this.leaderboardData.forEach((entry, index) => {
      const entryElement = document.createElement('div');
      entryElement.className = 'leaderboard-entry';
      
      // Apply special styling for top 3
      if (index < 3) {
        entryElement.classList.add(`rank-${index + 1}`);
      }
      
      entryElement.innerHTML = `
        <div class="rank">${index + 1}</div>
        <div class="player-info">
          <span class="player-name">${entry.playerName}</span>
        </div>
        <div class="score">${entry.score.toLocaleString()}</div>
      `;
      
      this.leaderboardContainer.appendChild(entryElement);
    });
  }
  
  // Initialize the leaderboard
  async initialize() {
    await this.fetchTopScores();
    this.renderLeaderboard();
  }
  
  // Change difficulty and refresh the leaderboard
  async changeDifficulty(difficulty) {
    this.difficulty = difficulty;
    await this.initialize();
  }
}

// Initialize and display the leaderboard when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const leaderboard = new Leaderboard();
  leaderboard.initialize();
  
  // Optional: Add difficulty selector
  const difficultySelector = document.getElementById('difficulty-selector');
  if (difficultySelector) {
    difficultySelector.addEventListener('change', (e) => {
      leaderboard.changeDifficulty(e.target.value);
    });
  }
});

// Export for use in other modules
export default Leaderboard;