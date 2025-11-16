/* ---------- GLOBAL STATE ---------- */

// Version tracking for debugging
const APP_VERSION = '1.2.2'; // Fixed: Added bid popup detection to status-changed code path
console.log(`%c🎮 Game of Judgement v${APP_VERSION}`, 'color: #4caf50; font-weight: bold; font-size: 14px;');

// Debug flag - set to true for development, false for production
const DEBUG = false;

// Debug logging helper - only logs when DEBUG is true
function debugLog(...args) {
  if (DEBUG) {
    console.log(...args);
  }
}

const storage = {
  players: [],
  hostId: null,
  dealerId: null,
  currentBidder: null,
  round: 1,
  cardsPerRound: 0,
  deck: [],
  hands: {},
  trick: [],
  leadSuit: null,
  trump: null,
  bids: {},
  tricksWon: {},
  scores: {},
  roundHistory: [],  // Track each round: {round, players: {[id]: {bid, won, points}}}
  myId: null,
  lobbyId: null,
  gameRef: null,
  isHost: false,
  trickResolving: false,
  cardPlaying: false,  // Flag to prevent double-playing cards
  disconnectedPlayers: {},  // Track disconnected players: {playerId: {name, disconnectedAt, timerId}}
  waitingForReconnect: false,  // Flag to pause game while waiting for reconnection
  presenceRef: null  // Reference to Firebase presence path
};

/* ---------- FIREBASE PRESENCE SYSTEM ---------- */

// Setup Firebase presence system for this player
function setupPresence() {
  if (!storage.lobbyId || !storage.myId) return;
  
  const playerRef = db.ref(`lobbies/${storage.lobbyId}/players/${storage.myId}`);
  storage.presenceRef = playerRef;
  
  // Set player as online
  playerRef.update({
    status: 'online',
    lastSeen: Date.now()
  });
  
  // Setup onDisconnect handler - Firebase automatically sets this when connection drops
  playerRef.onDisconnect().update({
    status: 'offline',
    lastSeen: Date.now()
  });
  
  debugLog('Presence system activated for player:', storage.myId);
  
  // Listen for beforeunload to catch back button / navigation / tab close
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  // Listen for visibility changes (additional safety net)
  document.addEventListener('visibilitychange', handleVisibilityChange);
}

// Handle page unload (back button, navigation, tab close)
function handleBeforeUnload(e) {
  if (storage.presenceRef) {
    // Synchronously mark as offline before page unloads
    // Note: This uses the synchronous REST API to ensure it completes
    navigator.sendBeacon(
      `https://judgement-game-ef741-default-rtdb.firebaseio.com/lobbies/${storage.lobbyId}/players/${storage.myId}.json`,
      JSON.stringify({
        status: 'offline',
        lastSeen: Date.now()
      })
    );
    debugLog('Player marked offline via beforeunload');
  }
}

// Handle visibility change (when user switches tabs or minimizes browser)
function handleVisibilityChange() {
  if (!storage.presenceRef) return;
  
  if (document.hidden) {
    // Tab hidden - update lastSeen
    storage.presenceRef.update({ lastSeen: Date.now() });
  } else {
    // Tab visible again - mark as online and update lastSeen
    storage.presenceRef.update({
      status: 'online',
      lastSeen: Date.now()
    });
  }
}

// Stop presence system (when explicitly leaving)
function stopPresence() {
  if (storage.presenceRef) {
    storage.presenceRef.update({
      status: 'offline',
      lastSeen: Date.now()
    });
    storage.presenceRef.onDisconnect().cancel();
    storage.presenceRef = null;
  }
  
  window.removeEventListener('beforeunload', handleBeforeUnload);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  
  debugLog('Presence system stopped');
}

// Check if a player is disconnected based on their status
function checkPlayerConnection(player) {
  // If player has status field, use it (new presence system)
  if (player.status) {
    return player.status === 'online';
  }
  
  // Fallback: Assume online if no status field yet (during transition)
  return true;
}

// Check all players for disconnections (only during active game, not in lobby)
function checkForDisconnectedPlayers() {
  if (storage.waitingForReconnect) return; // Already waiting for someone
  
  // Only check during active game phases (not in lobby)
  if (!storage.gameRef) {
    debugLog('Skipping disconnection check - still in lobby');
    return;
  }
  
  // Don't check for disconnections if game is already over
  if (storage.gameEnded || storage.status === 'ended') {
    debugLog('Skipping disconnection check - game is over');
    return;
  }
  
  // Find any player marked as offline (excluding myself)
  const disconnectedPlayer = storage.players.find(p => 
    p.id !== storage.myId && p.status === 'offline'
  );
  
  if (disconnectedPlayer) {
    const existingDisconnect = storage.disconnectedPlayers[disconnectedPlayer.id];
    
    if (!existingDisconnect) {
      // First time detecting this disconnection - start grace period
      debugLog('Detected disconnected player, starting 30s grace period:', disconnectedPlayer.name);
      storage.disconnectedPlayers[disconnectedPlayer.id] = {
        name: disconnectedPlayer.name,
        disconnectedAt: Date.now(),
        graceTimeout: setTimeout(() => {
          // After 30 seconds, show the modal
          debugLog('Grace period expired, showing reconnect modal for:', disconnectedPlayer.name);
          showReconnectModal(disconnectedPlayer);
        }, 30000) // 30 seconds
      };
    }
  }
  
  // Check if any previously disconnected player is back online
  Object.keys(storage.disconnectedPlayers).forEach(playerId => {
    const player = storage.players.find(p => p.id === playerId);
    if (player && player.status === 'online') {
      debugLog('Player reconnected during grace period:', player.name);
      
      // Clear grace period timeout if it exists
      const disconnectInfo = storage.disconnectedPlayers[playerId];
      if (disconnectInfo.graceTimeout) {
        clearTimeout(disconnectInfo.graceTimeout);
        debugLog('Cancelled grace period timeout for:', player.name);
      }
      
      hideReconnectModal();
    }
  });
}

/* ---------- RECONNECTION MODAL ---------- */

// Show the reconnection waiting modal
function showReconnectModal(player) {
  // Don't show reconnect modal if game is already over
  if (storage.gameEnded || storage.status === 'ended') {
    debugLog('Game is over, skipping reconnect modal for:', player.name);
    return;
  }
  
  storage.waitingForReconnect = true;
  const overlay = document.getElementById('reconnectOverlay');
  const playerNameEl = document.getElementById('reconnectPlayerName');
  const timerEl = document.getElementById('reconnectTimer');
  
  if (!overlay || !playerNameEl || !timerEl) return;
  
  playerNameEl.textContent = `Waiting for ${player.name} to reconnect...`;
  overlay.style.display = 'flex';
  
  // Start 300-second countdown
  let secondsLeft = 300;
  timerEl.textContent = secondsLeft;
  
  // Update the disconnected player info (grace period is over)
  if (!storage.disconnectedPlayers[player.id]) {
    storage.disconnectedPlayers[player.id] = {
      name: player.name,
      disconnectedAt: Date.now()
    };
  }
  
  const countdownInterval = setInterval(() => {
    secondsLeft--;
    timerEl.textContent = secondsLeft;
    
    // Check if player reconnected
    const currentPlayer = storage.players.find(p => p.id === player.id);
    if (currentPlayer && checkPlayerConnection(currentPlayer)) {
      debugLog('Player reconnected:', player.name);
      hideReconnectModal();
      clearInterval(countdownInterval);
      return;
    }
    
    // Time's up - remove player automatically
    if (secondsLeft <= 0) {
      clearInterval(countdownInterval);
      removeDisconnectedPlayer(player.id);
    }
  }, 1000);
  
  storage.disconnectedPlayers[player.id].countdownInterval = countdownInterval;
  
  debugLog('Showing reconnect modal for player:', player.name);
}

// Dismiss the modal but keep waiting in background
function dismissReconnectModal() {
  const overlay = document.getElementById('reconnectOverlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
  debugLog('Modal dismissed - continuing to wait in background');
}

// Hide the reconnection modal (called when player reconnects or is removed)
function hideReconnectModal() {
  storage.waitingForReconnect = false;
  const overlay = document.getElementById('reconnectOverlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
  
  // Clear all countdown intervals and grace timeouts
  Object.values(storage.disconnectedPlayers).forEach(info => {
    if (info.countdownInterval) {
      clearInterval(info.countdownInterval);
    }
    if (info.graceTimeout) {
      clearTimeout(info.graceTimeout);
    }
  });
  
  storage.disconnectedPlayers = {};
  debugLog('Reconnect modal hidden and all timers cleared');
}

// Continue without the disconnected player (called by button)
function continueWithoutPlayer() {
  const disconnectedPlayerId = Object.keys(storage.disconnectedPlayers)[0];
  if (disconnectedPlayerId) {
    removeDisconnectedPlayer(disconnectedPlayerId);
  }
}

// Remove a disconnected player from the game
function removeDisconnectedPlayer(playerId) {
  debugLog('Removing disconnected player:', playerId);
  
  // Clear countdown
  if (storage.disconnectedPlayers[playerId]?.countdownInterval) {
    clearInterval(storage.disconnectedPlayers[playerId].countdownInterval);
  }
  
  hideReconnectModal();
  
  // Remove player from Firebase
  db.ref(`lobbies/${storage.lobbyId}/players/${playerId}`).remove();
  
  // Remove from game state
  const gameRef = db.ref(`lobbies/${storage.lobbyId}/game`);
  gameRef.once('value', (snapshot) => {
    const gameData = snapshot.val();
    if (!gameData) return;
    
    // Remove player from players array
    const updatedPlayers = gameData.players.filter(p => p.id !== playerId);
    
    // Remove player's data from all game objects
    const updates = {
      players: updatedPlayers
    };
    
    // Clean up player-specific data
    if (gameData.hands && gameData.hands[playerId]) {
      delete gameData.hands[playerId];
      updates.hands = gameData.hands;
    }
    
    if (gameData.bids && gameData.bids[playerId] !== undefined) {
      delete gameData.bids[playerId];
      updates.bids = gameData.bids;
    }
    
    if (gameData.tricksWon && gameData.tricksWon[playerId] !== undefined) {
      delete gameData.tricksWon[playerId];
      updates.tricksWon = gameData.tricksWon;
    }
    
    if (gameData.scores && gameData.scores[playerId] !== undefined) {
      delete gameData.scores[playerId];
      updates.scores = gameData.scores;
    }
    
    // If disconnected player was current player, move to next player
    if (gameData.currentPlayer === playerId || gameData.currentBidder === playerId) {
      const currentIndex = gameData.players.findIndex(p => p.id === playerId);
      const nextIndex = (currentIndex + 1) % updatedPlayers.length;
      const nextPlayer = updatedPlayers[nextIndex];
      
      if (gameData.phase === 'bidding') {
        updates.currentBidder = nextPlayer.id;
      } else if (gameData.phase === 'playing') {
        updates.currentPlayer = nextPlayer.id;
      }
    }
    
    // If disconnected player was dealer, assign new dealer
    if (gameData.dealerId === playerId) {
      updates.dealerId = updatedPlayers[0].id;
    }
    
    // Update Firebase
    gameRef.update(updates).then(() => {
      debugLog('Player removed successfully from game');
    }).catch(err => {
      console.error('Error removing player:', err);
    });
  });
}
