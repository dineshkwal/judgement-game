/* ---------- LOBBY SYNC ---------- */
function listenForPlayers(){
  db.ref(`lobbies/${storage.lobbyId}/players`).on('value', (snapshot) => {
    const data = snapshot.val();
    storage.players = data ? Object.values(data) : [];
    storage.players.sort((a,b) => a.joinedAt - b.joinedAt);
    refreshLobby();
  });
  
  // Also listen for game start
  storage.gameRef = db.ref(`lobbies/${storage.lobbyId}/game`);
  storage.gameRef.on('value', (snapshot) => {
    const gameData = snapshot.val();
    if(gameData && document.getElementById('game').classList.contains('active') === false){
      // Game started, switch to game screen
      showScreen('game');
    }
    if(gameData){
      // Preserve local flags before overwriting
      const wasResolving = storage.trickResolving;
      const prevCurrentPlayer = storage.currentPlayer;
      
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
      
      Object.assign(storage, gameData);
      
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
      
      // Reset cardPlaying flag when state updates from Firebase
      // This ensures flag doesn't get stuck if network fails
      // Clear if it's not my turn OR if trick is empty (new trick starting)
      if(gameData.currentPlayer !== storage.myId || !gameData.trick || gameData.trick.length === 0) {
        storage.cardPlaying = false;
      }
      
      // Restore local flag only if trick is still in progress
      // If trick just completed or is empty, don't restore flag
      if(wasResolving && gameData.trick && gameData.trick.length > 0 && !trickJustCompleted) {
        storage.trickResolving = true;
      } else if(!gameData.trick || gameData.trick.length === 0) {
        // Trick cleared - resolution complete, clear cardPlaying for everyone
        storage.trickResolving = false;
        storage.cardPlaying = false;
      }
      
      renderScoreboard();
      renderTable();
      renderMyHand();
      renderCurrentTrick();
      updateRoundInfo();
      updateUI();
      
      // If trick just completed and we haven't started resolving yet, trigger resolution
      if(trickJustCompleted && !storage.trickResolving && !wasResolving){
        storage.trickResolving = true;
        setTimeout(() => {
          if(typeof resolveTrick === 'function'){
            resolveTrick();
          }
        }, 1000);
      }
      
      if(gameData.status === 'ended') endGame();
    }
  });
}

function updateLobbyInfo(){
  const lobbyInfo = document.getElementById('lobbyInfo');
  const shareUrl = `${window.location.origin}${window.location.pathname}?lobby=${storage.lobbyId}`;
  lobbyInfo.innerHTML = `
    <strong>Lobby ID:</strong> ${storage.lobbyId}<br>
    <strong>Share link:</strong> <input id="lobbyLinkInput" type="text" value="${shareUrl}" readonly 
      style="width:100%;margin-top:0.3rem;cursor:pointer;" title="Click to copy">
    <span id="copyMessage" style="color:var(--accent);font-size:0.9rem;margin-left:0.5rem;display:none;">✓ Link copied!</span>
  `;
  
  // Add click handler for copy functionality
  const input = document.getElementById('lobbyLinkInput');
  input.onclick = function(e){
    e.preventDefault();
    this.select();
    navigator.clipboard.writeText(this.value);
    const msg = document.getElementById('copyMessage');
    msg.style.display = 'inline';
    setTimeout(() => {
      msg.style.display = 'none';
    }, 2000);
  };
  
  // Prevent context menu on right-click
  input.oncontextmenu = function(e){
    e.preventDefault();
    return false;
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

  const hostSelContainer = document.getElementById('hostSelectContainer');
  const hostSel = document.getElementById('hostSelect');
  const roundSelContainer = document.getElementById('roundSelectContainer');
  const roundSel = document.getElementById('roundSelect');
  const startBtn = document.getElementById('startBtn');
  if(storage.players.length >= 2){
    hostSelContainer.style.display = 'block';
    roundSelContainer.style.display = 'block';
    startBtn.style.display = 'inline-block';
    
    // Populate host selector
    hostSel.innerHTML = '';
    storage.players.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name + (p.id === storage.myId ? ' (You)' : '');
      hostSel.appendChild(opt);
    });
    
    // Populate round selector (1 to maxCardsPerPlayer)
    const N = storage.players.length;
    const maxCardsPerPlayer = Math.floor(52 / N);
    roundSel.innerHTML = '';
    for(let i = 1; i <= maxCardsPerPlayer; i++){
      const cards = maxCardsPerPlayer - i + 1;
      const opt = document.createElement('option');
      opt.value = cards;
      opt.textContent = `${cards} cards`;
      if(i === 1) opt.selected = true; // Default to maximum cards
      roundSel.appendChild(opt);
    }
  } else {
    hostSelContainer.style.display = 'none';
    roundSelContainer.style.display = 'none';
    startBtn.style.display = 'none';
  }
}

function leaveLobby(){
  if(storage.myId && storage.lobbyId) {
    db.ref(`lobbies/${storage.lobbyId}/players`).child(storage.myId).remove();
  }
  storage.myId = null;
  storage.lobbyId = null;
  localStorage.removeItem('myPlayerInfo');
  document.getElementById('userInfo').classList.remove('active');
  window.history.replaceState({}, document.title, window.location.pathname);
  showScreen('register');
}

function startGame(){
  const hostId = document.getElementById('hostSelect').value;
  const startingCards = parseInt(document.getElementById('roundSelect').value);
  if(!hostId) return alert('Pick a host');
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
    trump: suits[0], 
    status: 'waiting_deal',
    bids: {},
    tricksWon: {},
    scores: scores,
    roundHistory: [],  // Initialize round history
    currentBidder: null,
    currentPlayer: null
  };
  storage.gameRef.set(initialState).then(() => {
    showScreen('game');
  });
}
