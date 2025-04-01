// Page navigation
document.getElementById("exitGame").addEventListener("click", function() {
    window.location.href = "login.html";
});

document.getElementById("board").addEventListener("click", function() {
    window.location.href = "leaderboard.html";
});

document.getElementById("setting").addEventListener("click", function() {
    window.location.href = "settings.html";
});

document.getElementById("playerAccount").addEventListener("click", function() {
    window.location.href = "profile.html";
}); 

document.getElementById("playGame").addEventListener("click", function() {
    window.location.href = "game_difficulty.html";
});

// Create floating monkey animations
function createMonkeys() {
  for (let i = 0; i < 10; i++) {
    const monkey = document.createElement('div');
    monkey.className = 'monkey';
    monkey.style.left = Math.random() * 100 + 'vw';
    monkey.style.top = Math.random() * 100 + 'vh';
    monkey.style.animationDelay = Math.random() * 5 + 's';
    document.body.appendChild(monkey);
  }
  
  // Initialize audio after creating elements
  initializeAudio();
}
// Initialize audio functionality
function initializeAudio() {
  const audioControl = document.getElementById('audioControl');
  const audioIcon = document.getElementById('audioIcon');
  const soundWave1 = document.getElementById('soundWave1');
  const soundWave2 = document.getElementById('soundWave2');
  const muteSlash = document.getElementById('muteSlash');
  const backgroundMusic = document.getElementById('backgroundMusic');
  
  // Set initial state to muted
  backgroundMusic.muted = true;
  backgroundMusic.load(); // Make sure the audio is loaded and ready
  
  // Toggle audio function
  function toggleAudio() {
    if (backgroundMusic.muted) {
      // Unmute
      backgroundMusic.muted = false;
      backgroundMusic.play().catch(error => {
        console.log("Audio play prevented until user interacts with page");
      });
      soundWave1.style.display = 'block';
      soundWave2.style.display = 'block';
      muteSlash.style.display = 'none';
      localStorage.setItem('bananaquestAudioMuted', 'false');
    } else {
      // Mute
      backgroundMusic.muted = true;
      soundWave1.style.display = 'none';
      soundWave2.style.display = 'none';
      muteSlash.style.display = 'block';
      localStorage.setItem('bananaquestAudioMuted', 'true');
    }
  }
  
  // Add click event to toggle audio
  audioControl.addEventListener('click', toggleAudio);
  
  // Implement cross-page audio persistence
  // Check if we should restore audio from previous session
  if (localStorage.getItem('bananaquestAudioMuted') === 'false') {
    // Try to restore unmuted state, but we still need user interaction to play
    soundWave1.style.display = 'block';
    soundWave2.style.display = 'block';
    muteSlash.style.display = 'none';
    
    // We'll need a user interaction to actually play the sound
    document.addEventListener('click', function audioPlayHandler() {
      if (!backgroundMusic.muted) {
        backgroundMusic.muted = false;
        backgroundMusic.play().then(() => {
          // Successfully playing
          document.removeEventListener('click', audioPlayHandler);
        }).catch(error => {
          // Still can't play, will try again on next click
        });
      }
    });
  }
}

// Call the function when the page loads
window.onload = createMonkeys;