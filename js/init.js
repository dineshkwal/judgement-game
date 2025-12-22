/* ---------- INITIALIZATION ---------- */

// Avatar data - 20 DiceBear Adventurer style avatars
const avatars = [
  { seed: 'Felix', name: 'Felix', bg: '4caf50', style: 'adventurer' },
  { seed: 'Aneka', name: 'Aneka', bg: '2196f3', style: 'adventurer' },
  { seed: 'Charlie', name: 'Charlie', bg: 'ff9800', style: 'adventurer' },
  { seed: 'Lucy', name: 'Lucy', bg: 'e91e63', style: 'adventurer' },
  { seed: 'Max', name: 'Max', bg: '9c27b0', style: 'adventurer' },
  { seed: 'Sophie', name: 'Sophie', bg: '00bcd4', style: 'adventurer' },
  { seed: 'Oscar', name: 'Oscar', bg: 'ff5722', style: 'adventurer' },
  { seed: 'Emma', name: 'Emma', bg: 'cddc39', style: 'adventurer' },
  { seed: 'Jack', name: 'Jack', bg: 'ff6f00', style: 'adventurer' },
  { seed: 'Mia', name: 'Mia', bg: '8bc34a', style: 'adventurer' },
  { seed: 'Luna', name: 'Luna', bg: '3f51b5', style: 'adventurer' },
  { seed: 'Oliver', name: 'Oliver', bg: 'f44336', style: 'adventurer' },
  { seed: 'Zoe', name: 'Zoe', bg: 'ff6b9d', style: 'adventurer' },
  { seed: 'Leo', name: 'Leo', bg: 'ffb74d', style: 'adventurer' },
  { seed: 'Aria', name: 'Aria', bg: '81c784', style: 'adventurer' },
  { seed: 'Noah', name: 'Noah', bg: '64b5f6', style: 'adventurer' },
  { seed: 'Maya', name: 'Maya', bg: 'ba68c8', style: 'adventurer' },
  { seed: 'Ethan', name: 'Ethan', bg: 'ffb300', style: 'adventurer' },
  { seed: 'Stella', name: 'Stella', bg: 'ff80ab', style: 'adventurer' },
  { seed: 'Liam', name: 'Liam', bg: '26c6da', style: 'adventurer' }
];

let selectedAvatar = avatars[0];

// Initialize app
window.addEventListener('DOMContentLoaded', () => {
  debugLog('DOM loaded, initializing...');
  
  // Track page view
  Analytics.trackPageView('Home - Game Registration');
  
  // Initialize avatar grids for both tabs
  setTimeout(() => {
    const avatarGridCreate = document.getElementById('avatarGridCreate');
    const avatarGridJoin = document.getElementById('avatarGridJoin');
    
    debugLog('Avatar grid elements - Create:', avatarGridCreate, 'Join:', avatarGridJoin);
    
    // Generate avatars for Create tab
    if (avatarGridCreate) {
      debugLog('Generating avatars for Create tab...');
      avatars.forEach((avatar, index) => {
        const avatarBtn = document.createElement('button');
        avatarBtn.className = 'avatar-option' + (index === 0 ? ' selected' : '');
        avatarBtn.type = 'button';
        
        // Generate DiceBear URL
        const style = avatar.style || 'adventurer';
        const avatarUrl = `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(avatar.seed)}&backgroundColor=${avatar.bg}`;
        
        avatarBtn.dataset.avatar = avatarUrl;
        avatarBtn.onclick = () => selectAvatarInGrid(avatar, avatarBtn, 'avatarGridCreate');
        avatarBtn.onfocus = () => selectAvatarInGrid(avatar, avatarBtn, 'avatarGridCreate');
        
        const img = document.createElement('img');
        img.src = avatarUrl;
        img.alt = avatar.name;
        
        avatarBtn.appendChild(img);
        avatarGridCreate.appendChild(avatarBtn);
      });
      debugLog('Create tab avatar grid populated with', avatars.length, 'avatars');
      setupAvatarScrollForGrid('avatarGridCreate', 'avatarScrollLeftCreate', 'avatarScrollRightCreate');
    }
    
    // Generate avatars for Join tab
    if (avatarGridJoin) {
      debugLog('Generating avatars for Join tab...');
      avatars.forEach((avatar, index) => {
        const avatarBtn = document.createElement('button');
        avatarBtn.className = 'avatar-option' + (index === 0 ? ' selected' : '');
        avatarBtn.type = 'button';
        
        // Generate DiceBear URL
        const style = avatar.style || 'adventurer';
        const avatarUrl = `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(avatar.seed)}&backgroundColor=${avatar.bg}`;
        
        avatarBtn.dataset.avatar = avatarUrl;
        avatarBtn.onclick = () => selectAvatarInGrid(avatar, avatarBtn, 'avatarGridJoin');
        avatarBtn.onfocus = () => selectAvatarInGrid(avatar, avatarBtn, 'avatarGridJoin');
        
        const img = document.createElement('img');
        img.src = avatarUrl;
        img.alt = avatar.name;
        
        avatarBtn.appendChild(img);
        avatarGridJoin.appendChild(avatarBtn);
      });
      debugLog('Join tab avatar grid populated with', avatars.length, 'avatars');
      setupAvatarScrollForGrid('avatarGridJoin', 'avatarScrollLeftJoin', 'avatarScrollRightJoin');
    }
  }, 100);
  
  // Check for active session and show resume banner if applicable
  // DISABLED: Resume banner feature turned off
  // setTimeout(() => {
  //   checkAndShowResumeBanner();
  // }, 200);
  
  // Check if player is rejoining an existing lobby via URL
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
          const avatarElem = document.getElementById('userInfoAvatar');
          const avatarUrl = getValidAvatar(playerInfo.avatar, playerInfo.name);
          debugLog('Setting userInfo avatar:', avatarUrl);
          avatarElem.src = avatarUrl || `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(playerInfo.name)}&backgroundColor=4caf50`;
          avatarElem.onerror = function() {
            debugLog('Avatar load error, using fallback');
            this.src = `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(playerInfo.name)}&backgroundColor=4caf50`;
          };
          document.getElementById('userInfo').classList.add('active');
          
          // Update top bar label
          const myNameLabel = document.getElementById('myNameLabel');
          if (myNameLabel) myNameLabel.textContent = playerInfo.name;
          
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
              
              // Start listening for emoji reactions
              console.log('Calling listenForReactions from URL rejoin');
              listenForReactions();
              
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
  
  // Add Enter key listeners to both tabs in registration screen
  const registerScreen = document.getElementById('register');
  if (registerScreen) {
    debugLog('Adding Enter key listener to registration screen');
    registerScreen.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.keyCode === 13) {
        debugLog('Enter key pressed in registration screen');
        e.preventDefault();
        
        // Call the appropriate function based on active tab
        const createTab = document.getElementById('createTabContent');
        if (createTab && createTab.classList.contains('active')) {
          createLobby();
        } else {
          joinLobby();
        }
      }
    });
  } else {
    debugLog('Registration screen not found');
  }
  
  // If URL has ?lobby= parameter, switch to Join tab and pre-fill lobby code
  if (joinLobbyId) {
    debugLog('URL has lobby parameter, switching to Join tab:', joinLobbyId);
    
    // Switch to Join tab
    switchRegistrationTab('join');
    
    // Pre-fill lobby code
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

/**
 * Select avatar in a specific grid
 */
function selectAvatarInGrid(avatar, buttonElement, gridId) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  
  // Update selected state only within this grid
  grid.querySelectorAll('.avatar-option').forEach(btn => btn.classList.remove('selected'));
  if (buttonElement) {
    buttonElement.classList.add('selected');
  }
  
  debugLog('Avatar selected in grid', gridId, ':', avatar.name);
}

/**
 * Setup avatar scroll navigation for a specific grid
 */
function setupAvatarScrollForGrid(gridId, leftBtnId, rightBtnId) {
  const grid = document.getElementById(gridId);
  const leftBtn = document.getElementById(leftBtnId);
  const rightBtn = document.getElementById(rightBtnId);
  
  if (!grid || !leftBtn || !rightBtn) return;
  
  // Scroll functionality
  leftBtn.addEventListener('click', () => {
    grid.scrollBy({ left: -200, behavior: 'smooth' });
  });
  
  rightBtn.addEventListener('click', () => {
    grid.scrollBy({ left: 200, behavior: 'smooth' });
  });
  
  // Show/hide navigation buttons based on scroll position
  const updateNavButtons = () => {
    if (typeof updateAvatarScrollButtons === 'function') {
      updateAvatarScrollButtons(gridId, leftBtnId, rightBtnId);
    } else {
      // Fallback if tabs.js not loaded
      const scrollLeft = grid.scrollLeft;
      const scrollWidth = grid.scrollWidth;
      const clientWidth = grid.clientWidth;
      
      if (scrollLeft <= 0) {
        leftBtn.classList.add('hidden');
      } else {
        leftBtn.classList.remove('hidden');
      }
      
      if (scrollLeft + clientWidth >= scrollWidth - 1) {
        rightBtn.classList.add('hidden');
      } else {
        rightBtn.classList.remove('hidden');
      }
    }
  };
  
  grid.addEventListener('scroll', updateNavButtons);
  window.addEventListener('resize', updateNavButtons);
  
  // Initial check with delay to ensure layout is complete
  setTimeout(updateNavButtons, 100);
}

// Legacy functions for backward compatibility (if needed)
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
      // Player still exists in lobby - check if game is over and if there are active players
      db.ref(`lobbies/${savedLobbyId}`).once('value', (lobbySnapshot) => {
        const lobbyData = lobbySnapshot.val();
        
        if (!lobbyData) {
          debugLog('Lobby data not found, clearing localStorage');
          localStorage.removeItem('lastLobbyId');
          localStorage.removeItem('lastPlayerId');
          localStorage.removeItem('myPlayerInfo');
          return;
        }
        
        const gameStatus = lobbyData.game?.status;
        const players = lobbyData.players || {};
        
        debugLog('Game status:', gameStatus);
        debugLog('Players in lobby:', Object.keys(players).length);
        
        // Don't show resume banner if game has ended
        if (gameStatus === 'ended') {
          debugLog('Game has ended, not showing resume banner');
          // Clear localStorage since game is over
          localStorage.removeItem('lastLobbyId');
          localStorage.removeItem('lastPlayerId');
          localStorage.removeItem('myPlayerInfo');
          return;
        }
        
        // Check if there are any OTHER players in the lobby besides the current player
        // We check for both active AND recently active players (within last 5 minutes)
        const now = Date.now();
        const FIVE_MINUTES = 5 * 60 * 1000;
        
        const otherPlayers = Object.values(players).filter(p => {
          if (p.id === savedPlayerId) return false; // Exclude current player
          
          // Consider player "active" if:
          // 1. They're marked as online, OR
          // 2. Their last seen was within the last 5 minutes
          const recentlyActive = p.lastSeen && (now - p.lastSeen < FIVE_MINUTES);
          return p.status === 'online' || recentlyActive;
        });
        
        debugLog('Other players count (active or recently active):', otherPlayers.length);
        debugLog('All players:', Object.values(players).map(p => ({id: p.id, status: p.status, name: p.name, lastSeen: p.lastSeen})));
        
        if (otherPlayers.length === 0) {
          debugLog('No other active players in lobby, not showing resume banner');
          // Clear localStorage since the lobby is effectively empty
          localStorage.removeItem('lastLobbyId');
          localStorage.removeItem('lastPlayerId');
          localStorage.removeItem('myPlayerInfo');
          return;
        }
        
        // Game is still active and has active players - show resume banner
        const playerInfo = JSON.parse(savedPlayerInfo);
        const resumeBanner = document.getElementById('resumeBanner');
        const resumeLobbyCode = document.getElementById('resumeLobbyCode');
        const resumePlayerName = document.getElementById('resumePlayerName');
        
        debugLog('Game is still active with active players, showing resume banner for player:', playerInfo.name);
        
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
        console.error('Error checking lobby data:', err);
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
    
    // If permission denied, clear localStorage to prevent repeated errors
    if (err.code === 'PERMISSION_DENIED' || err.message.includes('permission_denied')) {
      console.log('Permission denied accessing saved session data, clearing localStorage');
      localStorage.removeItem('lastLobbyId');
      localStorage.removeItem('lastPlayerId');
      localStorage.removeItem('myPlayerInfo');
    }
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
    const avatarElem = document.getElementById('userInfoAvatar');
    const avatarUrl = getValidAvatar(playerInfo.avatar, playerInfo.name);
    debugLog('Setting userInfo avatar on resume:', avatarUrl);
    avatarElem.src = avatarUrl || `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(playerInfo.name)}&backgroundColor=4caf50`;
    avatarElem.onerror = function() {
      debugLog('Avatar load error on resume, using fallback');
      this.src = `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(playerInfo.name)}&backgroundColor=4caf50`;
    };
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
        
        // Start listening for emoji reactions
        console.log('Calling listenForReactions from resume game');
        listenForReactions();
        
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
