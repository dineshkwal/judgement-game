/* ---------- LOBBY SYNC ---------- */
function listenForPlayers(){
  db.ref(`lobbies/${storage.lobbyId}/players`).on('value', (snapshot) => {
    const data = snapshot.val();
    storage.players = data ? Object.values(data) : [];
    storage.players.sort((a,b) => a.joinedAt - b.joinedAt);
    refreshLobby();
    
    // Check for disconnected players (only during active game)
    checkForDisconnectedPlayers();
  });
  
  // Listen for rematch/play again signal
  db.ref(`lobbies/${storage.lobbyId}/rematch`).on('value', (snapshot) => {
    const rematchData = snapshot.val();
    if (rematchData && rematchData.newLobbyId) {
      debugLog('Rematch detected! Redirecting to new lobby:', rematchData.newLobbyId);
      
      // Clean up old lobby listeners
      db.ref(`lobbies/${storage.lobbyId}`).off();
      
      // Update to new lobby
      storage.lobbyId = rematchData.newLobbyId;
      localStorage.setItem('lastLobbyId', rematchData.newLobbyId);
      
      // Update browser URL
      const newUrl = `${window.location.origin}${window.location.pathname}?lobby=${rematchData.newLobbyId}`;
      window.history.pushState({lobby: rematchData.newLobbyId}, '', newUrl);
      
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
      setupPresence();
    }
  });
  
  // Also listen for game start
  const gameRef = db.ref(`lobbies/${storage.lobbyId}/game`);
  gameRef.on('value', (snapshot) => {
    const gameData = snapshot.val();
    if(gameData && document.getElementById('game').classList.contains('active') === false){
      // Game started, switch to game screen
      storage.gameRef = gameRef; // Set this only when game actually starts
      console.log('Game detected, switching to game screen');
      showScreen('game');
      // Start listening for emoji reactions
      console.log('Calling listenForReactions from game detection');
      listenForReactions();
      console.log('listenForReactions called');
    }
    if(gameData){
      // Mark that game has started (for disconnection detection)
      if (!storage.gameRef) {
        storage.gameRef = gameRef;
      }
      
      // Preserve local flags before overwriting
      const wasResolving = storage.trickResolving;
      const prevCurrentPlayer = storage.currentPlayer;
      const prevTrickLength = storage.trick?.length || 0;
      const prevGameEnded = storage.gameEnded; // Preserve gameEnded flag
      
      // CRITICAL: Use lastKnownBids to track what we had BEFORE this Firebase update
      // This prevents missing bid popups when multiple updates happen rapidly
      const prevBids = storage.lastKnownBids ? {...storage.lastKnownBids} : {};
      const currentBids = gameData.bids && typeof gameData.bids === 'object' ? {...gameData.bids} : {};
      
      console.log('🔍 BEFORE Object.assign - prevBids (lastKnown):', prevBids, 'currentBids (incoming):', currentBids);
      console.log('🔍 storage.bids:', storage.bids, 'gameData.bids:', gameData.bids);
      
      // Clear these before Object.assign in case Firebase doesn't send them (empty objects become null)
      if(gameData.bids === null || gameData.bids === undefined) {
        gameData.bids = {};
      }
      if(gameData.tricksWon === null || gameData.tricksWon === undefined) {
        gameData.tricksWon = {};
      }
      if(gameData.hands === null || gameData.hands === undefined) {
        gameData.hands = {};
      }
      
      const prevStatus = storage.status; // Track status changes
      
      Object.assign(storage, gameData);
      
      // Restore local-only flags that shouldn't be overwritten
      storage.gameEnded = prevGameEnded;
      
      // Save current bids as lastKnownBids for next update cycle
      // This ensures we always compare against the PREVIOUS Firebase update, not current storage
      storage.lastKnownBids = currentBids;
      
      // Detect status change - critical for ensuring UI updates correctly
      const statusChanged = prevStatus !== gameData.status;
      if (statusChanged) {
        debugLog(`🔄 STATUS CHANGED: ${prevStatus} → ${gameData.status}`);
      }
      
      // Firebase removes empty objects, so ensure these are always objects (not null)
      if(!storage.bids || typeof storage.bids !== 'object' || Array.isArray(storage.bids)) {
        storage.bids = {};
      }
      if(!storage.tricksWon || typeof storage.tricksWon !== 'object' || Array.isArray(storage.tricksWon)) {
        storage.tricksWon = {};
      }
      if(!storage.hands || typeof storage.hands !== 'object' || Array.isArray(storage.hands)) {
        storage.hands = {};
      }
      
      const trickNowFull = gameData.trick && gameData.trick.length === gameData.players.length;
      const currentPlayerNowNull = !gameData.currentPlayer;
      const currentPlayerChangedToNull = prevCurrentPlayer && !gameData.currentPlayer;
      const trickJustCompleted = trickNowFull && currentPlayerNowNull && currentPlayerChangedToNull;
      
      debugLog('DEBUG trick completion check:', {
        trickNowFull,
        currentPlayerNowNull,
        currentPlayerChangedToNull,
        trickJustCompleted,
        prevCurrentPlayer,
        newCurrentPlayer: gameData.currentPlayer,
        trickLength: gameData.trick?.length,
        playersLength: gameData.players?.length
      });
      
      // Don't clear cardPlaying flag here - let playCard() promises handle it
      // This prevents cards from re-enabling too quickly after playing
      // Only clear when trick is completely empty (new trick starting)
      if(!gameData.trick || gameData.trick.length === 0) {
        storage.cardPlaying = false;
      }
      
      // Restore local flag only if trick is still in progress
      // If trick just completed or is empty, don't restore flag
      if(wasResolving && gameData.trick && gameData.trick.length > 0 && !trickJustCompleted) {
        storage.trickResolving = true;
      } else if(!gameData.trick || gameData.trick.length === 0) {
        // Trick cleared - resolution complete
        const wasJustResolving = storage.trickResolving; // Save state before clearing
        storage.trickResolving = false;
        storage.cardPlaying = false;
        
        debugLog('DEBUG: Firebase listener - trick cleared, wasJustResolving:', wasJustResolving);
        
        // Track that trick was just cleared - but ONLY if it transitioned from non-empty to empty
        // This prevents false triggers during initial game setup when trick is always empty
        const trickJustTransitionedToEmpty = prevTrickLength > 0 && (!gameData.trick || gameData.trick.length === 0);
        if(trickJustTransitionedToEmpty) {
          debugLog('DEBUG: Setting trickJustCleared=true (trick went from', prevTrickLength, 'cards to 0)');
          // Only set the flag for non-dealers to prevent showing stale currentPlayer
          // Dealer already knows the correct next player since they just set it
          if(storage.dealerId !== storage.myId) {
            storage.trickJustCleared = true;
          } else {
            debugLog('DEBUG: I am dealer, NOT setting trickJustCleared');
          }
        }
        
        // CRITICAL: Check game status FIRST before any UI logic
        // This ensures all players see the Game Over screen even if they have winner messages showing
        if(gameData.status === 'ended') {
          debugLog('DEBUG: Firebase listener detected status=ended, calling endGame()');
          debugLog('DEBUG: gameData.round=', gameData.round, 'gameData.cardsPerRound=', gameData.cardsPerRound);
          debugLog('DEBUG: Current player ID:', storage.myId);
          debugLog('DEBUG: Dealer ID:', gameData.dealerId);
          endGame();
          return; // Game is over, no need to update UI
        }
        
        // If we just finished resolving, OR if winner message is still showing, skip updateUI()
        // to avoid overwriting the "X won the hand!" message
        // EXCEPTION: If status changed (e.g., to 'waiting_deal'), we MUST call updateUI() to show the correct UI
        const centerMsg = document.getElementById('centerMsg');
        const winnerMessageShowing = centerMsg && centerMsg.isTimedMessage;
        
        if((wasJustResolving || winnerMessageShowing) && !statusChanged) {
          debugLog('DEBUG: Skipping updateUI() because wasJustResolving:', wasJustResolving, 'or winnerMessageShowing:', winnerMessageShowing);
          renderScoreboard();
          renderTable();
          renderMyHand();
          renderCurrentTrick();
          updateRoundInfo();
          // Skip updateUI() - it will be called by next Firebase update or after message timeout
          
          // Detect new bids and show popup (after table is rendered so seats exist)
          // Show popup to all players including the bidder
          console.log('🎯 [TRICK-RESOLVED PATH] Checking for new bids. Previous:', prevBids, 'Current:', currentBids);
          if (currentBids && typeof currentBids === 'object') {
            for (let playerId in currentBids) {
              console.log(`🔍 Player ${playerId}: prevBids[${playerId}]=${prevBids[playerId]}, currentBids[${playerId}]=${currentBids[playerId]}, myId=${storage.myId}`);
              if (prevBids[playerId] === undefined && currentBids[playerId] !== undefined) {
                // New bid detected! Show popup to all players
                console.log(`✅ SHOWING POPUP for player ${playerId} with bid ${currentBids[playerId]}`);
                showBidPopup(playerId, currentBids[playerId]);
              } else {
                console.log(`⏭️ Skipping ${playerId}: already in prevBids`);
              }
            }
          }
          
          // If we set trickJustCleared flag, schedule a delayed updateUI() call
          // to show the correct turn message after Firebase sync completes
          // Wait 2100ms to ensure winner message (2000ms) has fully cleared
          if(storage.trickJustCleared) {
            debugLog('DEBUG: Scheduling delayed updateUI() for trickJustCleared case');
            setTimeout(() => {
              storage.trickJustCleared = false;
              debugLog('DEBUG: Delayed updateUI() after trickJustCleared');
              updateUI();
            }, 2100);
          }
          
          // If scorecard modal is open, refresh it with latest data
          const scorecardOverlay = document.getElementById('scorecardOverlay');
          if (scorecardOverlay && scorecardOverlay.classList.contains('show')) {
            renderScorecard();
          }
          return; // Don't continue with normal flow
        }
        
        // If status changed, we need to call updateUI() even if trick was just resolved
        if (statusChanged) {
          debugLog('DEBUG: Status changed during trick resolution, calling updateUI()');
          renderScoreboard();
          renderTable();
          renderMyHand();
          renderCurrentTrick();
          updateRoundInfo();
          updateUI();
          
          // CRITICAL: Check for bid popups even when status changes
          console.log('🎯 [STATUS-CHANGED PATH] Checking for new bids. Previous:', prevBids, 'Current:', currentBids);
          if (currentBids && typeof currentBids === 'object') {
            for (let playerId in currentBids) {
              console.log(`🔍 Player ${playerId}: prevBids[${playerId}]=${prevBids[playerId]}, currentBids[${playerId}]=${currentBids[playerId]}, myId=${storage.myId}`);
              if (prevBids[playerId] === undefined && currentBids[playerId] !== undefined) {
                // New bid detected! Show popup to all players
                console.log(`✅ SHOWING POPUP for player ${playerId} with bid ${currentBids[playerId]}`);
                showBidPopup(playerId, currentBids[playerId]);
              } else {
                console.log(`⏭️ Skipping ${playerId}: already in prevBids`);
              }
            }
          }
          
          return;
        }
      } else {
        // Trick not empty - clear the flag if it was set
        storage.trickJustCleared = false;
      }
      
      debugLog('DEBUG: Firebase listener calling updateUI()');
      renderScoreboard();
      renderTable();
      renderMyHand();
      renderCurrentTrick();
      updateRoundInfo();
      updateUI();
      
      // Detect new bids and show popup (after table is rendered so seats exist)
      // Show popup to all players including the bidder
      console.log('🎯 [NORMAL PATH] Checking for new bids. Previous:', prevBids, 'Current:', currentBids);
      if (currentBids && typeof currentBids === 'object') {
        for (let playerId in currentBids) {
          console.log(`🔍 Player ${playerId}: prevBids[${playerId}]=${prevBids[playerId]}, currentBids[${playerId}]=${currentBids[playerId]}, myId=${storage.myId}`);
          if (prevBids[playerId] === undefined && currentBids[playerId] !== undefined) {
            // New bid detected! Show popup to all players
            console.log(`✅ SHOWING POPUP for player ${playerId} with bid ${currentBids[playerId]}`);
            showBidPopup(playerId, currentBids[playerId]);
          } else {
            console.log(`⏭️ Skipping ${playerId}: already in prevBids`);
          }
        }
      }
      
      // If scorecard modal is open, refresh it with latest data
      const scorecardOverlay = document.getElementById('scorecardOverlay');
      if (scorecardOverlay && scorecardOverlay.classList.contains('show')) {
        renderScorecard();
      }
      
      // If trick just completed and we haven't started resolving yet, trigger resolution
      if(trickJustCompleted && !storage.trickResolving && !wasResolving){
        storage.trickResolving = true;
        setTimeout(() => {
          if(typeof resolveTrick === 'function'){
            resolveTrick();
          }
        }, 1000);
      }
    }
  });
}

function updateLobbyInfo(){
  const lobbyInfo = document.getElementById('lobbyInfo');
  const shareUrl = `${window.location.origin}${window.location.pathname}?lobby=${storage.lobbyId}`;
  lobbyInfo.innerHTML = `
    <div class="lobby-share-row">
      <div class="lobby-code-display">
        <span class="code-label">Code</span>
        <span class="code-value">${storage.lobbyId}</span>
      </div>
      <button id="copyLinkBtn" class="copy-link-btn">📋 Copy Link</button>
    </div>
  `;
  
  // Add click handler for copy button
  const copyBtn = document.getElementById('copyLinkBtn');
  
  copyBtn.onclick = function(){
    navigator.clipboard.writeText(shareUrl);
    this.innerHTML = '✓ Copied!';
    this.classList.add('copied');
    setTimeout(() => {
      this.innerHTML = '📋 Copy Link';
      this.classList.remove('copied');
    }, 2000);
  };
}

function refreshLobby(){
  const list = document.getElementById('lobbyList');
  list.innerHTML = '';
  storage.players.forEach(p => {
    const div = document.createElement('div');
    div.className = 'player-item';
    div.innerHTML = `<img src="${p.avatar}" width="40" height="40" style="border-radius:50%;"> ${p.name}`;
    list.appendChild(div);
  });

  // Show game header only when there's 1 player
  const gameHeader = document.getElementById('lobbyGameHeader');
  const lobbyScreen = document.getElementById('lobby');
  if (storage.players.length === 1) {
    gameHeader.classList.add('show');
    lobbyScreen.classList.add('single-player');
  } else {
    gameHeader.classList.remove('show');
    lobbyScreen.classList.remove('single-player');
  }

  const roundSelContainer = document.getElementById('roundSelectContainer');
  const roundSel = document.getElementById('roundSelect');
  const startBtn = document.getElementById('startBtn');
  if(storage.players.length >= 2){
    roundSelContainer.style.display = 'block';
    startBtn.style.display = 'inline-block';
    
    // Populate round selector with custom dropdown
    const N = storage.players.length;
    const maxCardsPerPlayer = Math.floor(52 / N);
    const roundOptionsContainer = roundSel.querySelector('.dropdown-options');
    roundOptionsContainer.innerHTML = '';
    for(let i = 1; i <= maxCardsPerPlayer; i++){
      const cards = maxCardsPerPlayer - i + 1;
      const optDiv = document.createElement('div');
      optDiv.className = 'dropdown-option';
      optDiv.textContent = `${cards} cards`;
      optDiv.dataset.value = cards;
      if(i === 1) {
        optDiv.classList.add('selected');
        roundSel.querySelector('.dropdown-selected').textContent = optDiv.textContent;
        roundSel.dataset.value = cards;
      }
      optDiv.addEventListener('click', () => {
        roundSel.querySelectorAll('.dropdown-option').forEach(o => o.classList.remove('selected'));
        optDiv.classList.add('selected');
        roundSel.querySelector('.dropdown-selected').textContent = optDiv.textContent;
        roundSel.dataset.value = optDiv.dataset.value;
        roundSel.classList.remove('open');
      });
      roundOptionsContainer.appendChild(optDiv);
    }
    
    // Initialize dropdown toggle functionality
    initLobbyDropdowns();
  } else {
    roundSelContainer.style.display = 'none';
    startBtn.style.display = 'none';
  }
}

function initLobbyDropdowns() {
  const dropdowns = document.querySelectorAll('.lobby-dropdown');
  
  dropdowns.forEach(dropdown => {
    const selected = dropdown.querySelector('.dropdown-selected');
    
    // Remove any existing listeners
    const newSelected = selected.cloneNode(true);
    selected.parentNode.replaceChild(newSelected, selected);
    
    newSelected.addEventListener('click', (e) => {
      e.stopPropagation();
      // Close other dropdowns
      document.querySelectorAll('.lobby-dropdown').forEach(d => {
        if(d !== dropdown) d.classList.remove('open');
      });
      dropdown.classList.toggle('open');
    });
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if(!e.target.closest('.lobby-dropdown')) {
      document.querySelectorAll('.lobby-dropdown').forEach(d => d.classList.remove('open'));
    }
  });
}

function leaveLobby(){
  if(storage.myId && storage.lobbyId) {
    db.ref(`lobbies/${storage.lobbyId}/players`).child(storage.myId).remove();
  }
  stopPresence(); // Stop Firebase presence system
  hideReconnectModal(); // Hide any open reconnect modal
  storage.myId = null;
  storage.lobbyId = null;
  localStorage.removeItem('myPlayerInfo');
  localStorage.removeItem('lastPlayerId');
  localStorage.removeItem('lastLobbyId');
  document.getElementById('userInfo').classList.remove('active');
  window.history.replaceState({}, document.title, window.location.pathname);
  showScreen('register');
}

function startGame(){
  // Randomly select a starting dealer
  const randomIndex = Math.floor(Math.random() * storage.players.length);
  const hostId = storage.players[randomIndex].id;
  
  const startingCards = parseInt(document.getElementById('roundSelect').dataset.value);
  storage.hostId = hostId;
  storage.isHost = (hostId === storage.myId);
  const N = storage.players.length;
  const maxCardsPerPlayer = Math.floor(52 / N);
  storage.cardsPerRound = startingCards || maxCardsPerPlayer;
  storage.round = 1; // Always start at round 1
  storage.players.forEach((p, i) => p.seat = i);
  
  // Initialize scores
  const scores = {};
  storage.players.forEach(p => scores[p.id] = 0);

  storage.gameRef = db.ref(`lobbies/${storage.lobbyId}/game`);
  const initialState = {
    hostId, 
    dealerId: hostId,
    players: storage.players, 
    round: 1, 
    cardsPerRound: storage.cardsPerRound,
    hands: {}, 
    trick: [], 
    leadSuit: null, 
    trump: suits[1 % suits.length], // Calculate trump based on round like in dealCards()
    status: 'waiting_deal',
    bids: {},
    tricksWon: {},
    scores: scores,
    roundHistory: [],  // Initialize round history
    currentBidder: null,
    currentPlayer: null
  };
  console.log('Setting initial game state to Firebase...');
  storage.gameRef.set(initialState).then(() => {
    console.log('Game started, switching to game screen');
    showScreen('game');
    // Start listening for emoji reactions
    console.log('Calling listenForReactions from startGame');
    listenForReactions();
    console.log('listenForReactions called');
  }).catch((error) => {
    console.error('Error setting game state:', error);
  });
}
