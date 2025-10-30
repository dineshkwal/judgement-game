/* ---------- GAME LOGIC ---------- */
function dealCards(){
  if(storage.dealerId !== storage.myId) return;
  
  // Clear any lingering messages from previous round
  hideCenterMessage();
  
  const N = storage.players.length;
  const cardsThisRound = storage.cardsPerRound - storage.round + 1;
  console.log(`DEBUG dealCards: round=${storage.round}, cardsPerRound=${storage.cardsPerRound}, cardsThisRound=${cardsThisRound}`);
  console.log(`DEBUG dealCards check: cardsThisRound <= 0? ${cardsThisRound <= 0}`);
  if(cardsThisRound <= 0) {
    console.log('DEBUG: dealCards ending game because cardsThisRound <= 0');
    return endGame();
  }
  console.log('DEBUG: dealCards proceeding with dealing', cardsThisRound, 'cards');

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

function updateBiddingUI(){
  const cardsThisRound = storage.cardsPerRound - storage.round + 1;
  const bidSelect = document.getElementById('bidSelect');
  const prompt = document.getElementById('biddingPrompt');
  
  bidSelect.innerHTML = '';
  for(let i = 0; i <= cardsThisRound; i++){
    bidSelect.innerHTML += `<option value="${i}">${i}</option>`;
  }
  
  // Check if this is the last bidder (anti-sum rule)
  const totalBids = Object.keys(storage.bids).length;
  const isLastBidder = (totalBids === storage.players.length - 1);
  
  if(isLastBidder){
    const currentSum = Object.values(storage.bids).reduce((a,b) => a+b, 0);
    const forbidden = cardsThisRound - currentSum;
    prompt.textContent = `Your bid (can't bid ${forbidden} – anti-sum rule):`;
    
    Array.from(bidSelect.options).forEach(opt => {
      if(parseInt(opt.value) === forbidden){
        opt.disabled = true;
        opt.textContent += ' ✗';
      }
    });
  } else {
    prompt.textContent = `How many hands will you win?`;
  }
}

function submitBid(){
  if(storage.currentBidder !== storage.myId) return;
  
  const bid = parseInt(document.getElementById('bidSelect').value);
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
      storage.cardPlaying = false;
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
  storage.trick.forEach(t => {
    let val = t.card.value;
    if(t.card.suit === storage.trump) val += 100;
    else if(t.card.suit !== storage.leadSuit) val = -100;
    if(val > bestVal){
      bestVal = val;
      winner = t.playerId;
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
  showCenterMessage(`${winnerName} won the hand!`, 2000); // Show for 2 seconds

  setTimeout(() => {
    storage.trickResolving = false;
    const allEmpty = Object.values(storage.hands).every(h => !h || h.length === 0);
    
    // Only dealer updates Firebase
    if(storage.dealerId === storage.myId) {
      if(allEmpty){
        // Update Firebase to signal trick is over and round is ending
        storage.gameRef.update({ 
          trick: [], 
          leadSuit: null,
          currentPlayer: null
        });
      } else {
        // Update Firebase to signal trick is over and next player leads
        storage.gameRef.update({ 
          trick: [], 
          leadSuit: null,
          currentPlayer: winner
        });
      }
    }
    
    // All players clear local trick UI
    storage.trick = [];
    storage.leadSuit = null;
    // Note: currentPlayer is updated via Firebase sync, not locally
    renderCurrentTrick();
    renderMyHand();
    
    if(allEmpty){
      // Show round ending message
      showCenterMessage('Round complete!', 2000);
      if(storage.dealerId === storage.myId) {
        setTimeout(nextRound, 2000);
      }
    } else {
      // Small delay to let trick clear message show, then update to new turn message
      setTimeout(() => {
        updateUI();
      }, 100);
    }
  }, 2000);
}

function nextRound(){
  console.log('DEBUG: nextRound() called by player:', storage.myId, 'dealerId:', storage.dealerId, 'isDealer:', storage.dealerId === storage.myId);
  if(storage.dealerId !== storage.myId) return;
  
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
  console.log(`DEBUG nextRound: round=${storage.round}, cardsPerRound=${storage.cardsPerRound}, cardsNext=${cardsNext}`);
  console.log('DEBUG: Checking if should end game. cardsNext <= 0?', cardsNext <= 0);
  if(cardsNext <= 0){
    console.log('DEBUG: YES - Ending game because cardsNext <= 0');
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
  console.log('DEBUG: NO - Continuing to next round with', cardsNext, 'cards');
  
  const dealerIdx = storage.players.findIndex(p => p.id === storage.dealerId);
  const nextDealerIdx = (dealerIdx + 1) % storage.players.length;
  const nextDealer = storage.players[nextDealerIdx].id;
  
  storage.gameRef.update({ 
    round: storage.round,
    cardsPerRound: storage.cardsPerRound, // CRITICAL: Must persist this!
    dealerId: nextDealer,
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
  console.log('DEBUG: endGame() called');
  console.log('DEBUG: storage state:', {
    round: storage.round,
    cardsPerRound: storage.cardsPerRound,
    status: storage.status,
    dealerId: storage.dealerId,
    myId: storage.myId
  });
  console.trace('Stack trace:');
  
  // Sort players by score (descending)
  const sortedPlayers = [...storage.players].sort((a, b) => {
    const scoreA = storage.scores[a.id] || 0;
    const scoreB = storage.scores[b.id] || 0;
    return scoreB - scoreA;
  });
  
  // Update status and show final scorecard
  storage.gameRef.update({ status: 'ended' });
  
  // Show the scorecard with final results
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
