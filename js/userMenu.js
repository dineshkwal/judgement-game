/* ---------- USER MENU DROPDOWN ---------- */
function toggleUserMenu(){
  const menu = document.getElementById('userMenu');
  const isOpening = !menu.classList.contains('show');
  
  if (isOpening) {
    Analytics.trackUserMenuOpened();
    
    // Show/hide buttons based on whether user is lobby creator
    const resetBtn = document.getElementById('resetToLobbyBtn');
    const leaveBtn = document.getElementById('leaveGameBtn');
    const newGameBtn = document.getElementById('newGameBtn');
    
    if (storage.isLobbyCreator) {
      // Host sees "Reset to Lobby" and "New Game"
      resetBtn.style.display = 'block';
      leaveBtn.style.display = 'none';
      newGameBtn.style.display = 'block';
    } else {
      // Others only see "Leave Game"
      resetBtn.style.display = 'none';
      leaveBtn.style.display = 'block';
      newGameBtn.style.display = 'none';
    }
  }
  
  menu.classList.toggle('show');
}

/**
 * Reset to Lobby (Host only) - takes all players back to lobby
 * Game state is cleared but players stay in the lobby
 */
function resetToLobby(){
  if(!confirm('Reset to lobby? All players will return to the lobby.')) return;
  
  // Close the menu
  document.getElementById('userMenu').classList.remove('show');
  
  if(storage.lobbyId){
    // Clear the game data but keep players - this triggers everyone to go back to lobby
    db.ref(`lobbies/${storage.lobbyId}/game`).remove();
    
    // Reset local game state
    storage.gameRef = null;
    storage.gameEnded = false;
    storage.round = 1;
    storage.cardsPerRound = 0;
    storage.hand = [];
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
    
    // Close scorecard overlay if open
    const overlay = document.getElementById('scorecardOverlay');
    if (overlay) {
      overlay.classList.remove('show');
      overlay.classList.remove('game-over-screen');
    }
    
    // Navigate to lobby screen
    showScreen('lobby');
    listenForPlayers();
    updateLobbyInfo();
  }
}

function leaveGame(){
  if(!confirm('Leave this game? The game will continue without you.')) return;
  
  // Close the menu
  document.getElementById('userMenu').classList.remove('show');
  
  // Track game abandonment if game was in progress
  if(storage.round && storage.cardsPerRound && !storage.gameEnded) {
    Analytics.trackGameAbandoned(storage.lobbyId, storage.round, storage.cardsPerRound);
  }
  
  if(storage.lobbyId && storage.myId){
    // Remove player from players list
    db.ref(`lobbies/${storage.lobbyId}/players/${storage.myId}`).remove();
    
    // Also remove from game state (hands, bids, tricksWon) so game can continue
    const gameUpdates = {};
    gameUpdates[`hands/${storage.myId}`] = null;
    gameUpdates[`bids/${storage.myId}`] = null;
    gameUpdates[`tricksWon/${storage.myId}`] = null;
    
    db.ref(`lobbies/${storage.lobbyId}/game`).update(gameUpdates);
  }
  
  // Clear local storage
  localStorage.removeItem('myPlayerInfo');
  localStorage.removeItem('lastLobbyId');
  localStorage.removeItem('lastPlayerId');
  
  storage.myId = null;
  storage.lobbyId = null;
  document.getElementById('userInfo').classList.remove('active');
  window.history.replaceState({}, document.title, window.location.pathname);
  location.reload();
}

function newGame(){
  if(!confirm('Start a new game? This will end the current game.')) return;
  resetGame();
}

/**
 * DEBUG FUNCTION: Skip current round and deal next round
 * Only available when DEBUG flag is true
 */
function debugSkipToNextRound() {
  if (!DEBUG) return;
  
  console.log('🔧 DEBUG: Skipping to next round...');
  
  // Check if game is active
  if (!storage.gameRef || !storage.dealerId) {
    alert('No active game to skip!');
    return;
  }
  
  // Check if we're the dealer (only dealer can advance rounds)
  if (storage.dealerId !== storage.myId) {
    alert('Only the dealer can skip rounds! Current dealer: ' + 
      storage.players.find(p => p.id === storage.dealerId)?.name);
    return;
  }
  
  // Force complete the current round by setting all bids and tricks
  storage.players.forEach(p => {
    if (!storage.bids[p.id]) storage.bids[p.id] = 0;
    if (!storage.tricksWon[p.id]) storage.tricksWon[p.id] = 0;
  });
  
  // Clear current state
  storage.trick = [];
  storage.leadSuit = null;
  storage.currentPlayer = null;
  storage.currentBidder = null;
  storage.showingWinnerMessage = false;
  storage.trickResolving = false;
  
  // Calculate scores for current round
  const roundData = {
    round: storage.round,
    players: {}
  };
  
  storage.players.forEach(p => {
    const bid = storage.bids[p.id] || 0;
    const won = storage.tricksWon[p.id] || 0;
    let points = 0;
    
    if (bid === won) {
      points = 20;
    } else if (won < bid) {
      points = 0;
    } else {
      points = won;
    }
    
    storage.scores[p.id] = (storage.scores[p.id] || 0) + points;
    roundData.players[p.id] = { bid, won, points };
  });
  
  if (!storage.roundHistory) storage.roundHistory = [];
  storage.roundHistory.push(roundData);
  
  // Move to next round
  storage.round++;
  
  // Check if game should end
  if (storage.round > storage.cardsPerRound) {
    console.log('🔧 DEBUG: Game would end here, but starting new round anyway');
    storage.round = 1; // Loop back to round 1 for testing
  }
  
  // Reset for next round
  storage.bids = {};
  storage.tricksWon = {};
  storage.hands = {};
  storage.trick = [];
  storage.leadSuit = null;
  storage.status = 'waiting_deal';
  
  // Update dealer (rotate to next player)
  const currentDealerIndex = storage.players.findIndex(p => p.id === storage.dealerId);
  const nextDealerIndex = (currentDealerIndex + 1) % storage.players.length;
  storage.dealerId = storage.players[nextDealerIndex].id;
  
  // Calculate trump for next round
  const suits = ['♠️', '♥️', '♦️', '♣️'];
  storage.trump = suits[storage.round % suits.length];
  
  // Update Firebase
  const updates = {
    round: storage.round,
    dealerId: storage.dealerId,
    bids: {},
    tricksWon: {},
    hands: {},
    trick: [],
    leadSuit: null,
    trump: storage.trump,
    status: 'waiting_deal',
    scores: storage.scores,
    roundHistory: storage.roundHistory,
    currentBidder: null,
    currentPlayer: null
  };
  
  storage.gameRef.update(updates).then(() => {
    console.log('🔧 DEBUG: Round skipped successfully! Now on round', storage.round);
    // Render updated UI
    renderScoreboard();
    renderTable();
    renderMyHand();
    updateRoundInfo();
    updateUI();
    hideCenterMessage();
  }).catch(err => {
    console.error('🔧 DEBUG: Error skipping round:', err);
  });
}

// Close dropdown when clicking outside
window.addEventListener('click', function(event) {
  const userInfo = document.getElementById('userInfo');
  const userMenu = document.getElementById('userMenu');
  
  // If clicking outside BOTH userInfo and userMenu, close the menu
  if (userInfo && userMenu && !userInfo.contains(event.target) && !userMenu.contains(event.target)) {
    userMenu.classList.remove('show');
  }
});

// Show debug button if DEBUG mode is enabled
if (typeof DEBUG !== 'undefined' && DEBUG) {
  document.addEventListener('DOMContentLoaded', function() {
    const debugBtn = document.getElementById('debugSkipRound');
    if (debugBtn) {
      debugBtn.style.display = 'block';
      console.log('🔧 DEBUG MODE: Skip Round button enabled');
    }
  });
}
