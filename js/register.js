/* ---------- REGISTER - TABBED INTERFACE ---------- */

// Flag to prevent double submissions
let isRegistering = false;

// Helper function to update browser URL with lobby code
function updateBrowserURL(lobbyId) {
  try {
    const newUrl = `${window.location.origin}${window.location.pathname}?lobby=${lobbyId}`;
    window.history.pushState({lobby: lobbyId}, '', newUrl);
    debugLog('✅ Successfully updated browser URL to:', newUrl);
    debugLog('Current window.location.href:', window.location.href);
  } catch (err) {
    console.error('❌ Error updating browser URL:', err);
  }
}

/**
 * Create a new lobby (from Create tab)
 */
function createLobby() {
  // Prevent double submission
  if (isRegistering) {
    debugLog('Registration already in progress, ignoring duplicate request');
    return;
  }
  isRegistering = true;
  
  const nameInput = document.getElementById('playerNameCreate').value;
  
  // Clear previous errors
  clearInputError('playerNameCreate');
  
  // Validate and sanitize player name
  const nameValidation = validatePlayerName(nameInput);
  if (!nameValidation.valid) {
    showInputError('playerNameCreate', nameValidation.error);
    isRegistering = false;
    return;
  }
  const name = sanitizeInput(nameInput.trim());
  
  // Get avatar from create tab grid
  const avatar = getSelectedAvatarFromGrid('avatarGridCreate');
  if(!avatar) {
    isRegistering = false;
    return alert('Please select an avatar');
  }
  
  debugLog('Creating new lobby for player:', name);
  
  // Generate unique lobby ID
  const id = Date.now().toString();
  storage.myId = id;
  
  const lobbyId = Math.random().toString(36).substr(2, 6).toUpperCase();
  storage.lobbyId = lobbyId;
  
  // Store player info in localStorage
  localStorage.setItem('lastLobbyId', lobbyId);
  localStorage.setItem('lastPlayerId', id);
  localStorage.setItem('myPlayerInfo', JSON.stringify({ name, avatar }));
  
  const player = { name, avatar, id, lastSeen: Date.now(), status: 'online' };
  
  db.ref(`lobbies/${lobbyId}/players`).child(id).set(player).then(()=>{
    debugLog('Lobby created successfully:', lobbyId);
    
    // Track lobby creation
    const rounds = parseInt(document.getElementById('roundSelect')?.dataset?.value || 7);
    Analytics.trackLobbyCreated(lobbyId, rounds);
    Analytics.trackAvatarSelected(avatar.split('style=')[1] || 'adventurer', name);
    
    // Show user info in top right
    const avatarElem = document.getElementById('userInfoAvatar');
    const avatarUrl = getValidAvatar(avatar, name);
    debugLog('Setting userInfo avatar on create:', avatarUrl);
    avatarElem.src = avatarUrl || `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(name)}&backgroundColor=4caf50`;
    avatarElem.onerror = function() {
      debugLog('Avatar load error on create, using fallback');
      this.src = `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(name)}&backgroundColor=4caf50`;
    };
    document.getElementById('userInfo').classList.add('active');
    
    // Update top bar label
    const myNameLabel = document.getElementById('myNameLabel');
    if (myNameLabel) myNameLabel.textContent = name;
    
    // Update browser URL
    updateBrowserURL(lobbyId);
    
    showScreen('lobby');
    listenForPlayers();
    updateLobbyInfo();
    setupPresence(); // Start Firebase presence system
    
    // Reset flag after successful registration
    isRegistering = false;
  }).catch(err => {
    console.error('Firebase error creating lobby:', err);
    isRegistering = false;
    
    // Provide user-friendly error message
    if (err.code === 'PERMISSION_DENIED' || err.message.includes('permission_denied')) {
      alert('⚠️ Database Error\n\nUnable to create lobby due to Firebase permissions.\n\nPlease contact the developer to update database rules.');
    } else {
      alert('Error creating lobby: ' + err.message);
    }
  });
}

/**
 * Join an existing lobby (from Join tab)
 */
function joinLobby() {
  // Prevent double submission
  if (isRegistering) {
    debugLog('Registration already in progress, ignoring duplicate request');
    return;
  }
  isRegistering = true;
  
  const nameInput = document.getElementById('playerNameJoin').value;
  const lobbyCodeInput = document.getElementById('lobbyCodeInput').value;
  
  // Clear previous errors
  clearInputError('playerNameJoin');
  clearInputError('lobbyCodeInput');
  
  // Validate and sanitize player name
  const nameValidation = validatePlayerName(nameInput);
  if (!nameValidation.valid) {
    showInputError('playerNameJoin', nameValidation.error);
    isRegistering = false;
    return;
  }
  const name = sanitizeInput(nameInput.trim());
  
  // Validate and sanitize lobby code
  const codeValidation = validateLobbyCode(lobbyCodeInput);
  if (!codeValidation.valid) {
    showInputError('lobbyCodeInput', codeValidation.error);
    isRegistering = false;
    return;
  }
  
  if (!lobbyCodeInput.trim()) {
    showInputError('lobbyCodeInput', 'Lobby code is required');
    isRegistering = false;
    return;
  }
  
  const normalizedLobbyId = sanitizeInput(lobbyCodeInput.trim().toUpperCase());
  
  // Get avatar from join tab grid
  const avatar = getSelectedAvatarFromGrid('avatarGridJoin');
  if(!avatar) {
    isRegistering = false;
    return alert('Please select an avatar');
  }
  
  debugLog('Attempting to join lobby:', normalizedLobbyId, 'as player:', name);
  
  // Check if there's a disconnected player with the same name
  db.ref(`lobbies/${normalizedLobbyId}/players`).once('value', (snapshot) => {
    let existingPlayer = null;
    let existingPlayerId = null;
    
    if(snapshot.exists()) {
      // Look for a DISCONNECTED player with matching name (for reconnection)
      snapshot.forEach((childSnapshot) => {
        const player = childSnapshot.val();
        // Only match if same name AND player is offline/disconnected
        if(player.name === name && player.status !== 'online') {
          existingPlayer = player;
          existingPlayerId = childSnapshot.key;
        }
      });
    } else {
      // Lobby doesn't exist
      showInputError('lobbyCodeInput', 'Lobby not found. Please check the code.');
      isRegistering = false;
      return;
    }
    
    // If found a disconnected player with same name, rejoin as them
    if(existingPlayer && existingPlayerId) {
      debugLog('Found disconnected player with same name, rejoining as:', existingPlayerId);
      rejoinAsExistingPlayer(existingPlayerId, existingPlayer, name, avatar, normalizedLobbyId);
    } else {
      // New player joining - check if game is in progress
      debugLog('New player joining lobby');
      joinAsNewPlayer(name, avatar, normalizedLobbyId);
    }
  }).catch(err => {
    isRegistering = false;
    alert('Error checking lobby: ' + err.message);
  });
}


// Helper function to handle rejoining as an existing player
function rejoinAsExistingPlayer(existingPlayerId, existingPlayer, name, avatar, normalizedLobbyId) {
  debugLog('Found existing player with same name, rejoining as:', name);
  
  // Reuse the existing player's ID
  storage.myId = existingPlayerId;
  storage.lobbyId = normalizedLobbyId;
  
  // Update their status and lastSeen
  const updatedPlayer = {
    ...existingPlayer,
    avatar: avatar, // Update avatar in case they chose a different one
    lastSeen: Date.now(),
    status: 'online'
  };
  
  // Store player info in localStorage
  localStorage.setItem('myPlayerInfo', JSON.stringify({name, avatar}));
  localStorage.setItem('lastPlayerId', existingPlayerId);
  localStorage.setItem('lastLobbyId', normalizedLobbyId);
  
  // Show user info in top right
  const avatarElem = document.getElementById('userInfoAvatar');
  const avatarUrl = getValidAvatar(avatar, name);
  debugLog('Setting userInfo avatar on rejoin:', avatarUrl);
  avatarElem.src = avatarUrl || `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(name)}&backgroundColor=4caf50`;
  avatarElem.onerror = function() {
    debugLog('Avatar load error on rejoin, using fallback');
    this.src = `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(name)}&backgroundColor=4caf50`;
  };
  document.getElementById('userInfo').classList.add('active');
  
  // Update top bar label
  const myNameLabel = document.getElementById('myNameLabel');
  if (myNameLabel) myNameLabel.textContent = name;
  
  // Update player in Firebase
  db.ref(`lobbies/${normalizedLobbyId}/players/${existingPlayerId}`).update(updatedPlayer).then(() => {
    // Update browser URL
    updateBrowserURL(normalizedLobbyId);
    
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
        console.log('Calling listenForReactions from rejoin game');
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
      
      // Reset flag after successful rejoin
      isRegistering = false;
    });
  }).catch(err => {
    isRegistering = false;
    alert('Error rejoining lobby: ' + err.message);
  });
}

// Helper function to handle joining as a new player
function joinAsNewPlayer(name, avatar, normalizedLobbyId) {
  debugLog('New player joining lobby:', name);
  
  // Check if game is already in progress
  db.ref(`lobbies/${normalizedLobbyId}/game`).once('value', (gameSnapshot) => {
    if(gameSnapshot.exists()) {
      // Game already started - don't allow new players
      isRegistering = false;
      alert('This game has already started. You cannot join a game in progress.');
      return;
    }
    
    // Game hasn't started - allow joining
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const player = {id, name, avatar, joinedAt: Date.now(), lastSeen: Date.now(), status: 'online'};
    storage.myId = id;
    storage.lobbyId = normalizedLobbyId;
    
    // Store player info in localStorage
    localStorage.setItem('myPlayerInfo', JSON.stringify({name, avatar}));
    localStorage.setItem('lastPlayerId', id);
    localStorage.setItem('lastLobbyId', normalizedLobbyId);
    
    // Show user info in top right
    const avatarElem = document.getElementById('userInfoAvatar');
    const avatarUrl = getValidAvatar(avatar, name);
    debugLog('Setting userInfo avatar on new join:', avatarUrl);
    avatarElem.src = avatarUrl || `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(name)}&backgroundColor=4caf50`;
    avatarElem.onerror = function() {
      debugLog('Avatar load error on new join, using fallback');
      this.src = `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(name)}&backgroundColor=4caf50`;
    };
    document.getElementById('userInfo').classList.add('active');
    
    // Update top bar label
    const myNameLabel = document.getElementById('myNameLabel');
    if (myNameLabel) myNameLabel.textContent = name;
    
    db.ref(`lobbies/${normalizedLobbyId}/players`).child(id).set(player).then(()=>{
      // Track lobby join
      db.ref(`lobbies/${normalizedLobbyId}/players`).once('value', (snap) => {
        const playerCount = snap.numChildren();
        Analytics.trackLobbyJoined(normalizedLobbyId, playerCount);
        Analytics.trackAvatarSelected(avatar.split('style=')[1] || 'adventurer', name);
      });
      
      // Update browser URL
      updateBrowserURL(normalizedLobbyId);
      
      showScreen('lobby');
      listenForPlayers();
      updateLobbyInfo();
      setupPresence(); // Start Firebase presence system
      
      // Reset flag after successful join
      isRegistering = false;
    }).catch(err => {
      isRegistering = false;
      alert('Error joining lobby: ' + err.message);
    });
  }).catch(err => {
    isRegistering = false;
    alert('Error checking game status: ' + err.message);
  });
}

/**
 * Play Again - Creates a new lobby with all current players
 * Used from the Game Over screen
 */
function playAgain() {
  if (!storage.lobbyId || !storage.players || storage.players.length === 0) {
    alert('No active lobby found');
    return;
  }

  // Track play again clicked
  Analytics.trackPlayAgainClicked();

  debugLog('Starting Play Again - creating new lobby with all players');
  
  // Store old lobby ID to clean up listeners
  const oldLobbyId = storage.lobbyId;
  
  // Generate new lobby ID
  const newLobbyId = Math.random().toString(36).substr(2, 6).toUpperCase();
  
  // Get all current players
  const currentPlayers = storage.players;
  const myPlayerId = storage.myId;
  
  // Create new lobby with all players
  const playersData = {};
  currentPlayers.forEach(player => {
    playersData[player.id] = {
      name: player.name,
      avatar: player.avatar,
      id: player.id,
      lastSeen: Date.now(),
      status: 'online'
    };
  });
  
  // Write all players to new lobby at once
  db.ref(`lobbies/${newLobbyId}/players`).set(playersData).then(() => {
    debugLog('New lobby created successfully:', newLobbyId);
    
    // Write rematch signal to old lobby so all players get redirected
    return db.ref(`lobbies/${oldLobbyId}/rematch`).set({
      newLobbyId: newLobbyId,
      timestamp: Date.now()
    });
  }).then(() => {
    debugLog('Rematch signal written to old lobby');
    
    // Clean up old lobby listeners
    db.ref(`lobbies/${oldLobbyId}`).off();
    
    // Update local storage
    storage.lobbyId = newLobbyId;
    localStorage.setItem('lastLobbyId', newLobbyId);
    
    // Update browser URL
    updateBrowserURL(newLobbyId);
    
    // Reset ALL game state for fresh start
    storage.gameRef = null;
    storage.gameEnded = false;
    storage.round = 1;
    storage.cardsPerRound = 0;
    storage.deck = [];
    storage.hands = {};
    storage.trick = [];
    storage.leadSuit = null;
    storage.trump = null;
    storage.bids = {};
    storage.tricksWon = {};
    storage.scores = {};
    storage.roundHistory = [];
    storage.dealerId = null;
    storage.currentBidder = null;
    storage.currentPlayer = null;
    storage.trickResolving = false;
    storage.cardPlaying = false;
    
    // Close scorecard overlay
    const overlay = document.getElementById('scorecardOverlay');
    if (overlay) {
      overlay.classList.remove('show');
      overlay.classList.remove('game-over-screen');
    }
    
    // Navigate to lobby screen
    showScreen('lobby');
    listenForPlayers();
    updateLobbyInfo();
    setupPresence(); // Start Firebase presence system
    
    debugLog(`✅ Play Again successful - New lobby: ${newLobbyId}`);
  }).catch(err => {
    console.error('Error creating new lobby:', err);
    alert('Error creating new lobby: ' + err.message);
  });
}

/**
 * Toggle the "How to Play" section visibility
 */
function toggleHowToPlay(button) {
  const content = button.nextElementSibling;
  button.classList.toggle('active');
  content.classList.toggle('show');
}
