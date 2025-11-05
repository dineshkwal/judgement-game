/* ---------- REGISTER ---------- */

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
  document.getElementById('userInfoName').textContent = name;
  document.getElementById('userInfoAvatar').src = avatar;
  document.getElementById('userInfo').classList.add('active');
  
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
  }).catch(err => alert('Error rejoining lobby: ' + err.message));
}

// Helper function to handle joining as a new player
function joinAsNewPlayer(name, avatar, normalizedLobbyId) {
  debugLog('New player joining lobby:', name);
  
  // Check if game is already in progress
  db.ref(`lobbies/${normalizedLobbyId}/game`).once('value', (gameSnapshot) => {
    if(gameSnapshot.exists()) {
      // Game already started - don't allow new players
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
    document.getElementById('userInfoName').textContent = name;
    document.getElementById('userInfoAvatar').src = avatar;
    document.getElementById('userInfo').classList.add('active');
    
    db.ref(`lobbies/${normalizedLobbyId}/players`).child(id).set(player).then(()=>{
      // Update browser URL
      updateBrowserURL(normalizedLobbyId);
      
      showScreen('lobby');
      listenForPlayers();
      updateLobbyInfo();
      setupPresence(); // Start Firebase presence system
    }).catch(err => alert('Error joining lobby: ' + err.message));
  }).catch(err => alert('Error checking game status: ' + err.message));
}

// Helper function to create a new lobby
function createNewLobby(name, avatar) {
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const player = {id, name, avatar, joinedAt: Date.now(), lastSeen: Date.now(), status: 'online'};
  storage.myId = id;
  
  const lobbyId = Math.random().toString(36).substr(2, 6).toUpperCase();
  storage.lobbyId = lobbyId;
  
  // Store player info in localStorage
  localStorage.setItem('myPlayerInfo', JSON.stringify({name, avatar}));
  localStorage.setItem('lastPlayerId', id);
  localStorage.setItem('lastLobbyId', lobbyId);
  
  // Show user info in top right
  document.getElementById('userInfoName').textContent = name;
  document.getElementById('userInfoAvatar').src = avatar;
  document.getElementById('userInfo').classList.add('active');
  
  db.ref(`lobbies/${lobbyId}/players`).child(id).set(player).then(()=>{
    // Update browser URL
    updateBrowserURL(lobbyId);
    
    showScreen('lobby');
    listenForPlayers();
    updateLobbyInfo();
    setupPresence(); // Start Firebase presence system
  }).catch(err => alert('Error creating lobby: ' + err.message));
}

function registerPlayer(){
  const nameInput = document.getElementById('playerName').value;
  const lobbyCodeInput = document.getElementById('lobbyCodeInput').value;
  
  // Clear previous errors
  clearInputError('playerName');
  clearInputError('lobbyCodeInput');
  
  // Validate and sanitize player name
  const nameValidation = validatePlayerName(nameInput);
  if (!nameValidation.valid) {
    showInputError('playerName', nameValidation.error);
    return;
  }
  const name = sanitizeInput(nameInput.trim());
  
  // Validate and sanitize lobby code
  const codeValidation = validateLobbyCode(lobbyCodeInput);
  if (!codeValidation.valid) {
    showInputError('lobbyCodeInput', codeValidation.error);
    return;
  }
  const lobbyCodeFromInput = sanitizeInput(lobbyCodeInput.trim().toUpperCase());
  
  // Get avatar
  const avatar = getSelectedAvatarURL();
  if(!avatar) return alert('Please select an avatar');
  
  // Check for lobby code from input field first, then URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const urlLobbyId = urlParams.get('lobby');
  const joinLobbyId = lobbyCodeFromInput || urlLobbyId;
  
  if(joinLobbyId){
    // Join existing lobby - check if this player is rejoining
    const normalizedLobbyId = joinLobbyId.toUpperCase();
    
    // First, check if there's a disconnected player with the same name
    db.ref(`lobbies/${normalizedLobbyId}/players`).once('value', (snapshot) => {
      let existingPlayer = null;
      let existingPlayerId = null;
      
      if(snapshot.exists()) {
        // Look for a player with matching name
        snapshot.forEach((childSnapshot) => {
          const player = childSnapshot.val();
          if(player.name === name) {
            existingPlayer = player;
            existingPlayerId = childSnapshot.key;
          }
        });
      }
      
      // If found an existing player with same name, rejoin as them
      if(existingPlayer && existingPlayerId) {
        rejoinAsExistingPlayer(existingPlayerId, existingPlayer, name, avatar, normalizedLobbyId);
      } else {
        // New player joining - check if game is in progress
        joinAsNewPlayer(name, avatar, normalizedLobbyId);
      }
    }).catch(err => alert('Error checking lobby: ' + err.message));
    
  } else {
    // Create new lobby
    createNewLobby(name, avatar);
  }
}
