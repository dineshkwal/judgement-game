/* ---------- GAME LOGIC ---------- */
function dealCards(){
  if(storage.dealerId !== storage.myId) return;
  
  // Clear any lingering messages from previous round
  hideCenterMessage();
  
  const N = storage.players.length;
  const cardsThisRound = storage.cardsPerRound - storage.round + 1;
  debugLog(`DEBUG dealCards: round=${storage.round}, cardsPerRound=${storage.cardsPerRound}, cardsThisRound=${cardsThisRound}`);
  debugLog(`DEBUG dealCards check: cardsThisRound <= 0? ${cardsThisRound <= 0}`);
  if(cardsThisRound <= 0) {
    debugLog('DEBUG: dealCards ending game because cardsThisRound <= 0');
    return endGame();
  }
  debugLog('DEBUG: dealCards proceeding with dealing', cardsThisRound, 'cards');

  storage.deck = makeDeck();
  const hands = {};
  storage.trump = suits[storage.round % suits.length];

  let idx = 0;
  for(let i = 0; i < cardsThisRound; i++){
    storage.players.forEach(p => {
      if(idx < 52){
        const card = storage.deck[idx++];
        if(!hands[p.id]) hands[p.id] = [];
        hands[p.id].push(card);
      }
    });
  }

  // Sort hands
  Object.keys(hands).forEach(id => {
    hands[id].sort((a,b) => {
      if(a.suit !== b.suit) return suits.indexOf(a.suit) - suits.indexOf(b.suit);
      return a.value - b.value;
    });
  });
  
  // Find player clockwise from dealer to start bidding
  const dealerIdx = storage.players.findIndex(p => p.id === storage.dealerId);
  const firstBidderIdx = (dealerIdx + 1) % storage.players.length;
  const firstBidder = storage.players[firstBidderIdx].id;

  storage.gameRef.update({
    hands: hands,
    trump: storage.trump,
    trick: [],
    leadSuit: null,
    bids: {},
    tricksWon: {},
    currentBidder: firstBidder,
    status: 'bidding'
  });
}

// Custom dropdown functionality
let selectedBidValue = 0;
let maxBidValue = 0;

function initCustomDropdown() {
  const dropdown = document.getElementById('customDropdown');
  const selected = document.getElementById('dropdownSelected');
  const options = document.getElementById('dropdownOptions');
  
  // Make dropdown focusable
  dropdown.setAttribute('tabindex', '0');
  
  // Toggle dropdown
  dropdown.addEventListener('click', function(e) {
    if (e.target.classList.contains('dropdown-option')) return;
    dropdown.classList.toggle('open');
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });
  
  // Handle option selection
  options.addEventListener('click', function(e) {
    if (e.target.classList.contains('dropdown-option') && !e.target.classList.contains('disabled')) {
      const value = e.target.dataset.value;
      selectedBidValue = parseInt(value);
      selected.textContent = value;
      
      // Update selected state
      options.querySelectorAll('.dropdown-option').forEach(opt => {
        opt.classList.remove('selected');
      });
      e.target.classList.add('selected');
      
      dropdown.classList.remove('open');
    }
  });
  
  // Keyboard navigation
  document.addEventListener('keydown', function(e) {
    // Only handle if bidding UI is active
    const biddingUI = document.getElementById('biddingUI');
    if (!biddingUI.classList.contains('active')) return;
    
    if (e.key === 'Escape') {
      dropdown.classList.remove('open');
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      dropdown.classList.toggle('open');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      // Check if option is disabled
      const allOptions = Array.from(options.querySelectorAll('.dropdown-option'));
      let newValue = selectedBidValue + 1;
      while (newValue <= maxBidValue) {
        const option = allOptions.find(opt => parseInt(opt.dataset.value) === newValue);
        if (option && !option.classList.contains('disabled')) {
          selectedBidValue = newValue;
          selected.textContent = newValue;
          updateSelectedOption();
          break;
        }
        newValue++;
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      // Check if option is disabled
      const allOptions = Array.from(options.querySelectorAll('.dropdown-option'));
      let newValue = selectedBidValue - 1;
      while (newValue >= 0) {
        const option = allOptions.find(opt => parseInt(opt.dataset.value) === newValue);
        if (option && !option.classList.contains('disabled')) {
          selectedBidValue = newValue;
          selected.textContent = newValue;
          updateSelectedOption();
          break;
        }
        newValue--;
      }
    }
  });
}

function updateSelectedOption() {
  const options = document.getElementById('dropdownOptions');
  options.querySelectorAll('.dropdown-option').forEach(opt => {
    opt.classList.remove('selected');
    if (parseInt(opt.dataset.value) === selectedBidValue) {
      opt.classList.add('selected');
    }
  });
}

function updateBiddingUI(){
  const cardsThisRound = storage.cardsPerRound - storage.round + 1;
  maxBidValue = cardsThisRound;
  const dropdownOptions = document.getElementById('dropdownOptions');
  const dropdownSelected = document.getElementById('dropdownSelected');
  const prompt = document.getElementById('biddingPrompt');
  
  // Populate dropdown options
  dropdownOptions.innerHTML = '';
  for(let i = 0; i <= cardsThisRound; i++){
    const optionDiv = document.createElement('div');
    optionDiv.className = 'dropdown-option';
    optionDiv.dataset.value = i;
    optionDiv.textContent = i;
    if (i === selectedBidValue) {
      optionDiv.classList.add('selected');
    }
    dropdownOptions.appendChild(optionDiv);
  }
  
  // Reset selected value
  selectedBidValue = 0;
  dropdownSelected.textContent = '0';
  
  // Check if this is the last bidder (anti-sum rule)
  const totalBids = Object.keys(storage.bids).length;
  const isLastBidder = (totalBids === storage.players.length - 1);
  
  if(isLastBidder){
    const currentSum = Object.values(storage.bids).reduce((a,b) => a+b, 0);
    const forbidden = cardsThisRound - currentSum;
    prompt.textContent = `Place your bid`;
    
    const options = dropdownOptions.querySelectorAll('.dropdown-option');
    options.forEach(opt => {
      if(parseInt(opt.dataset.value) === forbidden){
        opt.classList.add('disabled');
        opt.textContent = opt.dataset.value + ' ✗';
        opt.title = `Can't bid ${forbidden} (anti-sum rule)`;
      }
    });
  } else {
    prompt.textContent = `Place your bid`;
  }
}

function submitBid(){
  if(storage.waitingForReconnect) return; // Don't allow bids while waiting for reconnection
  if(storage.currentBidder !== storage.myId) return;
  
  const bid = selectedBidValue;
  const cardsThisRound = storage.cardsPerRound - storage.round + 1;
  
  // Validate anti-sum rule for last bidder
  const totalBids = Object.keys(storage.bids).length;
  const isLastBidder = (totalBids === storage.players.length - 1);
  
  if(isLastBidder){
    const currentSum = Object.values(storage.bids).reduce((a,b) => a+b, 0);
    if(currentSum + bid === cardsThisRound){
      return alert('Invalid bid! Total bids cannot equal total hands (anti-sum rule).');
    }
  }
  
  // Save bid
  const newBids = {...storage.bids};
  newBids[storage.myId] = bid;
  
  // Find next bidder
  const currentIdx = storage.players.findIndex(p => p.id === storage.currentBidder);
  const nextIdx = (currentIdx + 1) % storage.players.length;
  const nextBidder = storage.players[nextIdx].id;
  
  // Check if bidding is complete
  const allBidded = Object.keys(newBids).length === storage.players.length;
  
  // Find first player (clockwise from dealer) to start playing
  let firstPlayer = null;
  if(allBidded){
    const dealerIdx = storage.players.findIndex(p => p.id === storage.dealerId);
    const firstPlayerIdx = (dealerIdx + 1) % storage.players.length;
    firstPlayer = storage.players[firstPlayerIdx].id;
  }
  
  storage.gameRef.update({
    bids: newBids,
    currentBidder: allBidded ? null : nextBidder,
    currentPlayer: allBidded ? firstPlayer : null,
    status: allBidded ? 'playing' : 'bidding'
  });
}

function playCard(card, el){
  // Prevent playing while waiting for reconnection
  if(storage.waitingForReconnect) return;
  
  // Prevent double-playing due to race condition
  if(storage.cardPlaying) return;
  
  if(!isMyTurn()) return;
  if(storage.currentPlayer === null) return;
  
  // Set flag immediately to prevent double-clicks
  storage.cardPlaying = true;
  
  // Validate follow-suit rule
  const myCards = storage.hands[storage.myId] || [];
  if(storage.leadSuit){
    // Check if I have cards of the lead suit
    const leadSuitCards = myCards.filter(c => c.suit === storage.leadSuit);
    
    // If I have lead suit cards, I must play one
    if(leadSuitCards.length > 0 && card.suit !== storage.leadSuit){
      storage.cardPlaying = false;
      alert('You must follow the lead suit if you have it!');
      return;
    }
  }
  
  storage.hands[storage.myId] = storage.hands[storage.myId].filter(x => x !== card);
  el.remove();
  storage.trick.push({playerId: storage.myId, card});
  if(!storage.leadSuit) storage.leadSuit = card.suit;
  
  // Immediately gray out remaining cards since turn is over
  renderMyHand();
  
  // Check if trick is complete
  const trickComplete = storage.trick.length === storage.players.length;
  
  if(trickComplete){
    // Update Firebase - Firebase listener will detect trick completion and trigger resolveTrick
    storage.gameRef.update({ 
      hands: storage.hands, 
      trick: storage.trick, 
      leadSuit: storage.leadSuit,
      currentPlayer: null
    }).then(() => {
      // Don't clear cardPlaying here - it will be cleared when new trick starts
    }).catch((err) => {
      console.error('Firebase update failed:', err);
      storage.cardPlaying = false;
    });
  } else {
    const currentIdx = storage.players.findIndex(p => p.id === storage.myId);
    const nextIdx = (currentIdx + 1) % storage.players.length;
    const nextPlayer = storage.players[nextIdx].id;
    
    storage.gameRef.update({ 
      hands: storage.hands, 
      trick: storage.trick, 
      leadSuit: storage.leadSuit,
      currentPlayer: nextPlayer
    }).then(() => {
      storage.cardPlaying = false;
    }).catch((err) => {
      console.error('Firebase update failed:', err);
      storage.cardPlaying = false;
    });
  }
}


function isMyTurn(){
  return storage.currentPlayer === storage.myId;
}

function resolveTrick(){
  // Calculate winner (all clients do this for display)
  let winner = null;
  let bestVal = -1;
  let winningCardIndex = -1;
  storage.trick.forEach((t, index) => {
    let val = t.card.value;
    if(t.card.suit === storage.trump) val += 100;
    else if(t.card.suit !== storage.leadSuit) val = -100;
    if(val > bestVal){
      bestVal = val;
      winner = t.playerId;
      winningCardIndex = index;
    }
  });
  
  // Only dealer updates Firebase to avoid duplicate counting
  if(storage.dealerId === storage.myId) {
    if(!storage.tricksWon[winner]) storage.tricksWon[winner] = 0;
    storage.tricksWon[winner]++;
    
    storage.gameRef.update({ 
      tricksWon: storage.tricksWon
    });
  }

  const winnerName = storage.players.find(p => p.id === winner)?.name || 'Player';
  debugLog('DEBUG: resolveTrick showing winner message:', winnerName);
  showCenterMessage(`${winnerName} won the hand!`, 3000); // Show for 3 seconds
  
  // Set flag to prevent updateUI from changing message during winner display
  storage.showingWinnerMessage = true;
  debugLog('DEBUG: Set showingWinnerMessage = true');

  // Store winning card index so it persists across re-renders
  storage.winningCardIndex = winningCardIndex;
  
  // Highlight winning card with green glow
  const trickDiv = document.getElementById('currentTrick');
  if(trickDiv && winningCardIndex >= 0) {
    const cards = trickDiv.querySelectorAll('.card');
    if(cards[winningCardIndex]) {
      cards[winningCardIndex].classList.add('winner');
    }
  }

  setTimeout(() => {
    debugLog('DEBUG: resolveTrick 3s timeout fired');
    storage.trickResolving = false;
    debugLog('DEBUG: Set trickResolving = false (keeping showingWinnerMessage = true for now)');
    const allEmpty = Object.values(storage.hands).every(h => !h || h.length === 0);
    
    debugLog('DEBUG: After trick resolution - allEmpty:', allEmpty, 'dealerId:', storage.dealerId, 'myId:', storage.myId);
    
    // Only dealer updates Firebase
    if(storage.dealerId === storage.myId) {
      debugLog('DEBUG: I am dealer, updating Firebase...');
      if(allEmpty){
        debugLog('DEBUG: All hands empty - setting currentPlayer to null');
        // Update Firebase to signal trick is over and round is ending
        storage.gameRef.update({ 
          trick: [], 
          leadSuit: null,
          currentPlayer: null
        });
      } else {
        debugLog('DEBUG: Hands not empty - setting currentPlayer to winner:', winner);
        // Update Firebase to signal trick is over and next player leads
        storage.gameRef.update({ 
          trick: [], 
          leadSuit: null,
          currentPlayer: winner
        });
      }
    } else {
      debugLog('DEBUG: I am NOT dealer, waiting for dealer to update Firebase');
    }
    
    // Clear winning card index after animation completes
    storage.winningCardIndex = undefined;
    
    // All players clear local trick UI
    storage.trick = [];
    storage.leadSuit = null;
    // Note: currentPlayer is updated via Firebase sync, not locally
    renderCurrentTrick();
    renderMyHand();
    
    if(allEmpty){
      // Show round ending message and keep the flag set to prevent other messages
      showCenterMessage('Round complete!', 2000);
      // Keep showingWinnerMessage = true to protect the "Round complete!" message
      // It will be cleared by the message timeout in showCenterMessage()
      if(storage.dealerId === storage.myId) {
        setTimeout(nextRound, 2000);
      }
    }
    // Don't call updateUI() manually - the Firebase listener will call it
    // when currentPlayer actually updates, ensuring correct synchronization
  }, 2000);
}

function nextRound(){
  debugLog('DEBUG: nextRound() called by player:', storage.myId, 'dealerId:', storage.dealerId, 'isDealer:', storage.dealerId === storage.myId);
  if(storage.dealerId !== storage.myId) return;
  
  // Clear any lingering messages and flags from previous round
  hideCenterMessage();
  storage.showingWinnerMessage = false;
  storage.trickResolving = false;
  
  // Calculate scores for the completed round
  const roundData = {
    round: storage.round,
    players: {}
  };
  
  storage.players.forEach(p => {
    const bid = storage.bids[p.id] || 0;
    const won = storage.tricksWon[p.id] || 0;
    let points = 0;
    
    // New Scoring Rules:
    // - Correct judgement (bid === won): 20 points
    // - Made less than bid: 0 points
    // - Made more than bid: points = number of hands made
    if (bid === won) {
      points = 20;
    } else if (won < bid) {
      points = 0;
    } else {
      // won > bid
      points = won;
    }
    
    // Update total score
    storage.scores[p.id] = (storage.scores[p.id] || 0) + points;
    
    // Store round data
    roundData.players[p.id] = {
      bid: bid,
      won: won,
      points: points
    };
  });
  
  // Add to round history
  storage.roundHistory.push(roundData);
  
  // Move to next round
  storage.round++;
  const cardsNext = storage.cardsPerRound - storage.round + 1;
  debugLog(`DEBUG nextRound: round=${storage.round}, cardsPerRound=${storage.cardsPerRound}, cardsNext=${cardsNext}`);
  debugLog('DEBUG: Checking if should end game. cardsNext <= 0?', cardsNext <= 0);
  if(cardsNext <= 0){
    debugLog('DEBUG: YES - Ending game because cardsNext <= 0');
    // Update Firebase with final round data before ending
    storage.gameRef.update({ 
      scores: storage.scores,
      roundHistory: storage.roundHistory,
      status: 'ended'
    }).then(() => {
      endGame();
    });
    return;
  }
  debugLog('DEBUG: NO - Continuing to next round with', cardsNext, 'cards');
  
  const dealerIdx = storage.players.findIndex(p => p.id === storage.dealerId);
  const nextDealerIdx = (dealerIdx + 1) % storage.players.length;
  const nextDealer = storage.players[nextDealerIdx].id;
  
  // Calculate trump for next round (same calculation as in dealCards)
  const nextTrump = suits[storage.round % suits.length];
  
  storage.gameRef.update({ 
    round: storage.round,
    cardsPerRound: storage.cardsPerRound, // CRITICAL: Must persist this!
    dealerId: nextDealer,
    trump: nextTrump, // Update trump for next round
    status: 'waiting_deal',
    bids: {},
    tricksWon: {},
    hands: {},
    trick: [],
    leadSuit: null,
    currentBidder: null,
    currentPlayer: null,
    scores: storage.scores,
    roundHistory: storage.roundHistory
  });
}

function endGame(){
  debugLog('DEBUG: endGame() called');
  debugLog('DEBUG: storage state:', {
    round: storage.round,
    cardsPerRound: storage.cardsPerRound,
    status: storage.status,
    dealerId: storage.dealerId,
    myId: storage.myId,
    gameEnded: storage.gameEnded
  });
  if (DEBUG) console.trace('Stack trace:');
  
  // Prevent calling endGame multiple times for the same player
  if(storage.gameEnded) {
    debugLog('DEBUG: endGame already called for this player, skipping');
    return;
  }
  storage.gameEnded = true;
  
  // Track game completion
  const durationMinutes = storage.gameStartTime ? Math.round((Date.now() - storage.gameStartTime) / 60000) : 0;
  Analytics.trackGameCompleted(storage.lobbyId, storage.players.length, storage.round, durationMinutes);
  
  // Sort players by score (descending)
  const sortedPlayers = [...storage.players].sort((a, b) => {
    const scoreA = storage.scores[a.id] || 0;
    const scoreB = storage.scores[b.id] || 0;
    return scoreB - scoreA;
  });
  
  debugLog('DEBUG: Showing final scorecard to player:', storage.myId);
  
  // Show the scorecard with final results for ALL players
  renderFinalScorecard(sortedPlayers);
}

function resetGame(){
  if(storage.lobbyId){
    db.ref(`lobbies/${storage.lobbyId}`).remove();
  }
  storage.myId = null;
  storage.lobbyId = null;
  localStorage.removeItem('myPlayerInfo');
  document.getElementById('userInfo').classList.remove('active');
  window.history.replaceState({}, document.title, window.location.pathname);
  location.reload();
}
