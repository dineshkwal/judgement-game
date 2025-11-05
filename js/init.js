/* ---------- INITIALIZATION ---------- */

// Avatar data with fun styles
const avatars = [
  { seed: 'Felix', name: 'Felix', bg: '4caf50' },
  { seed: 'Aneka', name: 'Aneka', bg: '2196f3' },
  { seed: 'Charlie', name: 'Charlie', bg: 'ff9800' },
  { seed: 'Lucy', name: 'Lucy', bg: 'e91e63' },
  { seed: 'Max', name: 'Max', bg: '9c27b0' },
  { seed: 'Sophie', name: 'Sophie', bg: '00bcd4' },
  { seed: 'Oscar', name: 'Oscar', bg: 'ff5722' },
  { seed: 'Emma', name: 'Emma', bg: 'cddc39' },
  { seed: 'Jack', name: 'Jack', bg: 'ff6f00' },
  { seed: 'Mia', name: 'Mia', bg: '8bc34a' },
  { seed: 'Luna', name: 'Luna', bg: '3f51b5' },
  { seed: 'Oliver', name: 'Oliver', bg: 'f44336' }
];

let selectedAvatar = avatars[0];

// Initialize app
window.addEventListener('DOMContentLoaded', () => {
  debugLog('DOM loaded, initializing...');
  
  // Initialize avatar grid first (always needed for registration)
  setTimeout(() => {
    const avatarGrid = document.getElementById('avatarGrid');
    
    debugLog('Avatar grid element:', avatarGrid);
    
    if (avatarGrid) {
      debugLog('Generating avatars...');
      avatars.forEach((avatar, index) => {
        const avatarBtn = document.createElement('button');
        avatarBtn.className = 'avatar-option' + (index === 0 ? ' selected' : '');
        avatarBtn.type = 'button';
        avatarBtn.onclick = () => selectAvatar(avatar, avatarBtn);
        
        // Add focus event to update avatar when tabbing through
        avatarBtn.onfocus = () => selectAvatar(avatar, avatarBtn);
        
        const img = document.createElement('img');
        img.src = `https://api.dicebear.com/9.x/adventurer/svg?seed=${avatar.seed}&backgroundColor=${avatar.bg}`;
        img.alt = avatar.name;
        
        avatarBtn.appendChild(img);
        avatarGrid.appendChild(avatarBtn);
      });
      debugLog('Avatar grid populated with', avatars.length, 'avatars');
      
      // Setup navigation buttons
      setupAvatarScroll();
    } else {
      console.error('Could not find avatar grid element');
    }
  }, 100);
  
  // Check for active session and show resume banner if applicable
  // Add small delay to ensure DOM is ready and Firebase is initialized
  setTimeout(() => {
    checkAndShowResumeBanner();
  }, 200);
  
  // Check if player is rejoining an existing lobby
  const urlParams = new URLSearchParams(window.location.search);
  const joinLobbyId = urlParams.get('lobby');
  
  if(joinLobbyId) {
    // Normalize lobby ID to uppercase for case-insensitive matching
    const normalizedLobbyId = joinLobbyId.toUpperCase();
    
    // Try to rejoin with existing player data
    const savedPlayerInfo = localStorage.getItem('myPlayerInfo');
    const savedLobbyId = localStorage.getItem('lastLobbyId');
    const savedPlayerId = localStorage.getItem('lastPlayerId');
    
    if(savedPlayerInfo && savedLobbyId === normalizedLobbyId && savedPlayerId) {
      // Player is rejoining the same lobby - restore their session
      debugLog('Rejoining lobby with saved credentials');
      const playerInfo = JSON.parse(savedPlayerInfo);
      storage.myId = savedPlayerId;
      storage.lobbyId = normalizedLobbyId;
      
      // Check if player still exists in lobby
      db.ref(`lobbies/${normalizedLobbyId}/players/${savedPlayerId}`).once('value', (snapshot) => {
        if(snapshot.exists()) {
          // Player still in lobby - just update status and rejoin
          debugLog('Player found in lobby, rejoining...');
          db.ref(`lobbies/${normalizedLobbyId}/players/${savedPlayerId}`).update({
            lastSeen: Date.now(),
            status: 'online'
          });
          
          // Show user info
          document.getElementById('userInfoName').textContent = playerInfo.name;
          document.getElementById('userInfoAvatar').src = playerInfo.avatar;
          document.getElementById('userInfo').classList.add('active');
          
          // Check if game has started
          db.ref(`lobbies/${normalizedLobbyId}/game`).once('value', (gameSnapshot) => {
            if(gameSnapshot.exists()) {
              debugLog('Game in progress, rejoining game screen');
              
              // Load game state into storage
              const gameData = gameSnapshot.val();
              
              // Ensure arrays/objects exist
              if(!gameData.bids || typeof gameData.bids !== 'object') gameData.bids = {};
              if(!gameData.tricksWon || typeof gameData.tricksWon !== 'object') gameData.tricksWon = {};
              if(!gameData.hands || typeof gameData.hands !== 'object') gameData.hands = {};
              if(!gameData.trick) gameData.trick = [];
              
              Object.assign(storage, gameData);
              
              showScreen('game');
              
              // Render all game UI components
              renderScoreboard();
              renderTable();
              renderMyHand();
              renderCurrentTrick();
              updateRoundInfo();
              updateUI();
            } else {
              showScreen('lobby');
            }
            listenForPlayers();
            updateLobbyInfo();
            setupPresence(); // Start Firebase presence system
          });
          return;
        } else {
          // Player was removed - need to re-register
          debugLog('Player not found in lobby, showing registration');
          showScreen('register');
        }
      });
    } else {
      // No saved data or different lobby - show registration
      showScreen('register');
    }
  } else {
    showScreen('register');
  }
  
  // Initialize custom dropdown
  if (typeof initCustomDropdown === 'function') {
    initCustomDropdown();
  }
  
  // Adjust hand alignment on window resize
  window.addEventListener('resize', () => {
    if (typeof adjustHandAlignment === 'function') {
      adjustHandAlignment();
    }
  });
  
  // Add Enter key listener to registration screen (works from anywhere on the screen)
  const registerScreen = document.getElementById('register');
  if (registerScreen) {
    debugLog('Adding Enter key listener to registration screen');
    registerScreen.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.keyCode === 13) {
        debugLog('Enter key pressed in registration screen');
        e.preventDefault();
        registerPlayer();
      }
    });
  } else {
    debugLog('Registration screen not found');
  }
  
  // Pre-fill lobby code if coming from a lobby link (reuse urlParams from above)
  if (joinLobbyId) {
    const lobbyCodeInput = document.getElementById('lobbyCodeInput');
    if (lobbyCodeInput) {
      lobbyCodeInput.value = joinLobbyId.toUpperCase();
      debugLog('Pre-filled lobby code from URL:', joinLobbyId);
    }
  }
});

function setupAvatarScroll() {
  const avatarGrid = document.getElementById('avatarGrid');
  const leftBtn = document.getElementById('avatarScrollLeft');
  const rightBtn = document.getElementById('avatarScrollRight');
  
  if (!avatarGrid || !leftBtn || !rightBtn) return;
  
  // Update button visibility based on scroll position
  function updateNavButtons() {
    const scrollLeft = avatarGrid.scrollLeft;
    const maxScroll = avatarGrid.scrollWidth - avatarGrid.clientWidth;
    
    leftBtn.classList.toggle('hidden', scrollLeft <= 0);
    rightBtn.classList.toggle('hidden', scrollLeft >= maxScroll - 1);
  }
  
  // Scroll left
  leftBtn.onclick = () => {
    avatarGrid.scrollBy({ left: -200, behavior: 'smooth' });
  };
  
  // Scroll right
  rightBtn.onclick = () => {
    avatarGrid.scrollBy({ left: 200, behavior: 'smooth' });
  };
  
  // Update buttons on scroll
  avatarGrid.addEventListener('scroll', updateNavButtons);
  
  // Initial button state
  updateNavButtons();
  
  // Add touch/mouse drag scrolling
  let isDown = false;
  let startX;
  let scrollLeftPos;
  
  avatarGrid.addEventListener('mousedown', (e) => {
    isDown = true;
    avatarGrid.style.cursor = 'grabbing';
    startX = e.pageX - avatarGrid.offsetLeft;
    scrollLeftPos = avatarGrid.scrollLeft;
  });
  
  avatarGrid.addEventListener('mouseleave', () => {
    isDown = false;
    avatarGrid.style.cursor = 'grab';
  });
  
  avatarGrid.addEventListener('mouseup', () => {
    isDown = false;
    avatarGrid.style.cursor = 'grab';
  });
  
  avatarGrid.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - avatarGrid.offsetLeft;
    const walk = (x - startX) * 1.5;
    avatarGrid.scrollLeft = scrollLeftPos - walk;
  });
  
  avatarGrid.style.cursor = 'grab';
}

function selectAvatar(avatar, buttonElement) {
  selectedAvatar = avatar;
  
  // Update selected state
  document.querySelectorAll('.avatar-option').forEach(btn => btn.classList.remove('selected'));
  if (buttonElement) {
    buttonElement.classList.add('selected');
  }
}

function getSelectedAvatarURL() {
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${selectedAvatar.seed}&backgroundColor=${selectedAvatar.bg}`;
}

/* ---------- RESUME GAME BANNER ---------- */
function checkAndShowResumeBanner() {
  // Only show on registration screen without URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const hasUrlLobby = urlParams.get('lobby');
  
  debugLog('checkAndShowResumeBanner called, hasUrlLobby:', hasUrlLobby);
  
  if (hasUrlLobby) {
    // User came from a direct link, don't show banner
    debugLog('URL has lobby parameter, skipping resume banner');
    return;
  }
  
  const savedLobbyId = localStorage.getItem('lastLobbyId');
  const savedPlayerId = localStorage.getItem('lastPlayerId');
  const savedPlayerInfo = localStorage.getItem('myPlayerInfo');
  
  debugLog('localStorage data:', {
    savedLobbyId,
    savedPlayerId,
    savedPlayerInfo: savedPlayerInfo ? 'exists' : 'missing'
  });
  
  if (!savedLobbyId || !savedPlayerId || !savedPlayerInfo) {
    // No saved session
    debugLog('No saved session found in localStorage');
    return;
  }
  
  // Check if the lobby still exists and player is still in it
  debugLog('Checking if player exists in lobby:', savedLobbyId, savedPlayerId);
  db.ref(`lobbies/${savedLobbyId}/players/${savedPlayerId}`).once('value', (snapshot) => {
    debugLog('Firebase snapshot exists:', snapshot.exists());
    
    if (snapshot.exists()) {
      // Player still exists in lobby - check if game is over
      db.ref(`lobbies/${savedLobbyId}/game/status`).once('value', (gameStatusSnapshot) => {
        const gameStatus = gameStatusSnapshot.val();
        
        debugLog('Game status:', gameStatus);
        
        // Don't show resume banner if game has ended
        if (gameStatus === 'ended') {
          debugLog('Game has ended, not showing resume banner');
          // Clear localStorage since game is over
          localStorage.removeItem('lastLobbyId');
          localStorage.removeItem('lastPlayerId');
          localStorage.removeItem('myPlayerInfo');
          return;
        }
        
        // Game is still active or hasn't started - show resume banner
        const playerInfo = JSON.parse(savedPlayerInfo);
        const resumeBanner = document.getElementById('resumeBanner');
        const resumeLobbyCode = document.getElementById('resumeLobbyCode');
        const resumePlayerName = document.getElementById('resumePlayerName');
        
        debugLog('Game is still active, showing resume banner for player:', playerInfo.name);
        
        if (resumeBanner && resumeLobbyCode && resumePlayerName) {
          resumePlayerName.textContent = playerInfo.name;
          resumeLobbyCode.textContent = savedLobbyId;
          resumeBanner.style.display = 'flex';
          debugLog('Resume banner displayed successfully');
        } else {
          console.error('Resume banner elements not found:', {
            resumeBanner: !!resumeBanner,
            resumeLobbyCode: !!resumeLobbyCode,
            resumePlayerName: !!resumePlayerName
          });
        }
      }).catch(err => {
        console.error('Error checking game status:', err);
      });
    } else {
      // Player was removed or lobby doesn't exist - clear localStorage
      debugLog('Player not found in lobby, clearing localStorage');
      localStorage.removeItem('lastLobbyId');
      localStorage.removeItem('lastPlayerId');
      localStorage.removeItem('myPlayerInfo');
    }
  }).catch(err => {
    console.error('Error checking saved session:', err);
    debugLog('Error checking saved session:', err);
  });
}

function resumeGame() {
  const savedLobbyId = localStorage.getItem('lastLobbyId');
  const savedPlayerId = localStorage.getItem('lastPlayerId');
  const savedPlayerInfo = localStorage.getItem('myPlayerInfo');
  
  if (savedLobbyId && savedPlayerId && savedPlayerInfo) {
    debugLog('Resuming game directly without page reload');
    
    // Hide the resume banner first
    const resumeBanner = document.getElementById('resumeBanner');
    if (resumeBanner) {
      resumeBanner.style.display = 'none';
    }
    
    // Update URL without reloading
    const newUrl = `${window.location.origin}${window.location.pathname}?lobby=${savedLobbyId}`;
    window.history.pushState({lobby: savedLobbyId}, '', newUrl);
    
    // Set up storage
    const playerInfo = JSON.parse(savedPlayerInfo);
    storage.myId = savedPlayerId;
    storage.lobbyId = savedLobbyId;
    
    // Show user info in top right
    document.getElementById('userInfoName').textContent = playerInfo.name;
    document.getElementById('userInfoAvatar').src = playerInfo.avatar;
    document.getElementById('userInfo').classList.add('active');
    
    // Update player status in Firebase
    db.ref(`lobbies/${savedLobbyId}/players/${savedPlayerId}`).update({
      lastSeen: Date.now(),
      status: 'online'
    });
    
    // Check if game has started
    db.ref(`lobbies/${savedLobbyId}/game`).once('value', (gameSnapshot) => {
      if(gameSnapshot.exists()) {
        debugLog('Game in progress, rejoining game screen');
        
        // Load game state into storage
        const gameData = gameSnapshot.val();
        
        // Ensure arrays/objects exist
        if(!gameData.bids || typeof gameData.bids !== 'object') gameData.bids = {};
        if(!gameData.tricksWon || typeof gameData.tricksWon !== 'object') gameData.tricksWon = {};
        if(!gameData.hands || typeof gameData.hands !== 'object') gameData.hands = {};
        if(!gameData.trick) gameData.trick = [];
        
        Object.assign(storage, gameData);
        
        showScreen('game');
        
        // Render all game UI components
        renderScoreboard();
        renderTable();
        renderMyHand();
        renderCurrentTrick();
        updateRoundInfo();
        updateUI();
      } else {
        showScreen('lobby');
      }
      listenForPlayers();
      updateLobbyInfo();
      setupPresence(); // Start Firebase presence system
    });
  }
}

function dismissResume() {
  // Hide the banner
  const resumeBanner = document.getElementById('resumeBanner');
  if (resumeBanner) {
    resumeBanner.style.display = 'none';
  }
  
  // Clear saved session
  localStorage.removeItem('lastLobbyId');
  localStorage.removeItem('lastPlayerId');
  localStorage.removeItem('myPlayerInfo');
}
