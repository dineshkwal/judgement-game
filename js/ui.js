/* ---------- UI UPDATES ---------- */
function updateUI(){
  // Don't update UI if waiting for reconnection - the modal handles everything
  if(storage.waitingForReconnect) return;
  
  const dealBtn = document.getElementById('dealBtn');
  const biddingUI = document.getElementById('biddingUI');
  
  // Update round info
  updateRoundInfo();
  
  // Update top bar labels
  updateTopBarLabels();
  
  // Show player name
  const myPlayer = storage.players.find(p => p.id === storage.myId);
  if(myPlayer){
    document.getElementById('playerName').textContent = `You: ${myPlayer.name}`;
  }
  
  // Show deal button only to dealer when waiting for deal
  if(storage.status === 'waiting_deal'){
    hideCenterMessage(); // Clear any lingering messages
    dealBtn.style.display = (storage.dealerId === storage.myId) ? 'inline-block' : 'none';
    biddingUI.classList.remove('active');
    
    // Show consistent center message
    if(storage.dealerId === storage.myId) {
      showCenterMessage('Click Deal Cards to start the round', 0);
    } else {
      const dealerName = storage.players.find(p => p.id === storage.dealerId)?.name || 'dealer';
      showCenterMessage(`Waiting for ${dealerName} to deal cards...`, 0);
    }
  }
  // Show bidding UI during bidding phase
  else if(storage.status === 'bidding'){
    dealBtn.style.display = 'none';
    if(storage.currentBidder === storage.myId){
      biddingUI.classList.add('active');
      updateBiddingUI();
      showCenterMessage('Your turn to bid!', 0); // Persistent until next action
    } else {
      biddingUI.classList.remove('active');
      const bidderName = storage.players.find(p => p.id === storage.currentBidder)?.name || 'Player';
      showCenterMessage(`Waiting for ${bidderName} to bid...`, 0); // Persistent
    }
  }
  // Playing phase
  else if(storage.status === 'playing'){
    dealBtn.style.display = 'none';
    biddingUI.classList.remove('active');
    
    debugLog('DEBUG updateUI playing phase:', {
      showingWinnerMessage: storage.showingWinnerMessage,
      trickResolving: storage.trickResolving,
      trickJustCleared: storage.trickJustCleared,
      currentPlayer: storage.currentPlayer,
      myId: storage.myId,
      trickLength: storage.trick?.length
    });
    
    // Don't overwrite timed messages (like "X won the hand!" or "Round complete!")
    const centerMsg = document.getElementById('centerMsg');
    if(centerMsg && centerMsg.isTimedMessage){
      debugLog('DEBUG: Skipping updateUI - timed message is showing');
      return;
    }
    
    // If trick just cleared, skip THIS update but clear flag and retry after brief delay
    // This prevents showing stale currentPlayer values before Firebase fully syncs
    // The flag is cleared here so the retry will show the correct message
    if(storage.trickJustCleared){
      debugLog('DEBUG: Skipping updateUI - trick just cleared, will retry after sync delay');
      storage.trickJustCleared = false; // Clear the flag BEFORE returning
      hideCenterMessage(); // Clear any lingering message
      // Schedule another updateUI() call after 100ms to let Firebase sync complete
      setTimeout(() => {
        debugLog('DEBUG: Retry updateUI after trickJustCleared delay');
        updateUI();
      }, 100);
      return;
    }
    
    // Check if round is ending (all hands empty) - don't show turn messages
    const allHandsEmpty = storage.hands && Object.values(storage.hands).every(h => !h || h.length === 0);
    if(allHandsEmpty){
      debugLog('DEBUG: Skipping updateUI - round ending, all hands empty');
      return;
    }
    
    // Check if round is ending (no current player means all cards played)
    if(!storage.currentPlayer){
      hideCenterMessage();
    } else if(isMyTurn()){
      debugLog('DEBUG: Showing "Your turn to play"');
      showCenterMessage('Your turn – play a card', 0); // Persistent
    } else {
      const currentPlayerName = storage.players.find(p => p.id === storage.currentPlayer)?.name || 'Player';
      debugLog('DEBUG: Showing "Waiting for ' + currentPlayerName + '"');
      showCenterMessage(`Waiting for ${currentPlayerName} to play...`, 0); // Persistent
    }
  }
}

function updateRoundInfo(){
  // No-op: Trump info is now displayed in the scoreboard header
  // This function is kept for backward compatibility with existing calls
  return;
}

function showCenterMessage(text, duration = 2000){
  const centerMsg = document.getElementById('centerMsg');
  centerMsg.textContent = text;
  centerMsg.classList.add('show');
  // Clear any existing timeout
  if(centerMsg.hideTimeout) clearTimeout(centerMsg.hideTimeout);
  // Store whether this is a timed message
  centerMsg.isTimedMessage = (duration > 0);
  // If duration is 0, message stays persistent
  if(duration > 0){
    centerMsg.hideTimeout = setTimeout(() => {
      centerMsg.classList.remove('show');
      centerMsg.isTimedMessage = false;
      // Clear the showingWinnerMessage flag when the winner message timeout completes
      if(storage && storage.showingWinnerMessage){
        storage.showingWinnerMessage = false;
        debugLog('DEBUG: Cleared showingWinnerMessage after message timeout');
      }
    }, duration);
  } else {
    centerMsg.isTimedMessage = false;
  }
}

function hideCenterMessage(){
  const centerMsg = document.getElementById('centerMsg');
  if(centerMsg.hideTimeout) clearTimeout(centerMsg.hideTimeout);
  centerMsg.classList.remove('show');
}

/**
 * Show a bid popup on a player's avatar
 * @param {string} playerId - The player's ID
 * @param {number} bidValue - The bid value
 */
function showBidPopup(playerId, bidValue) {
  console.log('showBidPopup called:', playerId, bidValue);
  
  const seat = document.querySelector(`.seat[data-player-id="${playerId}"]`);
  console.log('Found seat:', seat);
  
  if (!seat) {
    console.warn('Seat not found for player:', playerId);
    return;
  }
  
  // Remove any existing bid popup on this seat
  const existingPopup = seat.querySelector('.bid-popup');
  if (existingPopup) {
    console.log('Removing existing popup');
    existingPopup.remove();
  }
  
  // Create new bid popup with emoji enhancement
  const popup = document.createElement('div');
  popup.className = 'bid-popup';
  
  // Add emoji and text
  const emoji = document.createElement('span');
  emoji.className = 'bid-emoji';
  emoji.textContent = '🎯';
  
  const text = document.createElement('span');
  text.className = 'bid-text';
  text.textContent = `I bid ${bidValue}`;
  
  popup.appendChild(emoji);
  popup.appendChild(text);
  
  console.log('Created popup element:', popup);
  
  // Add to seat
  seat.appendChild(popup);
  console.log('Popup appended to seat');
  
  // Remove popup after animation completes (2.5 seconds)
  setTimeout(() => {
    popup.remove();
    console.log('Popup removed after timeout');
  }, 2500);
}

function renderScoreboard(){
  const sb = document.getElementById('scoreboard');
  
  // Get round and card information
  const round = storage.round || 1;
  const cardsPerRound = storage.cardsPerRound || 0;
  const trump = storage.trump || '♠';
  const cardsThisRound = cardsPerRound - round + 1;
  
  // Determine suit color class
  const suitClass = (trump === '♠' || trump === '♣') ? 'suit-black' : 'suit-red';
  
  // Map suit symbols to names
  const suitNames = {
    '♠': 'Spade',
    '♥': 'Heart',
    '♦': 'Diamond',
    '♣': 'Club'
  };
  const trumpName = suitNames[trump] || 'Spade';
  
  // Determine plural/singular for cards
  const cardLabel = cardsThisRound === 1 ? 'CARD' : 'CARDS';
  
  // Add enhanced round info header with vertical stack design
  let html = `<div class="scoreboard-header">
    <div class="round-info">ROUND ${round}<span class="round-divider"></span>${cardsThisRound > 0 ? cardsThisRound : 0} ${cardLabel}</div>
    <div class="trump-info">
      <span>TRUMP</span>
      <span class="trump-suit ${suitClass}">${trump}</span>
      <span>${trumpName.toUpperCase()}</span>
    </div>
  </div>`;
  
  html += '<table><thead><tr><th>Player</th><th>Hands Bid</th><th>Hands Win</th></tr></thead><tbody>';
  
  storage.players.forEach(p => {
    const bid = storage.bids[p.id] !== undefined ? storage.bids[p.id] : '–';
    const won = storage.tricksWon[p.id] || 0;
    const isActive = p.id === storage.currentBidder ? ' class="active-turn"' : '';
    const isDealer = p.id === storage.dealerId;
    const dealerBadge = isDealer ? '<span class="dealer-badge">DEALER</span>' : '';
    html += `<tr${isActive}><td><span>${p.name}</span>${dealerBadge}</td><td>${bid}</td><td>${won}</td></tr>`;
  });
  
  html += '</tbody></table>';
  
  // Add emoji reaction bar
  html += `
    <div class="emoji-reaction-bar">
      <button class="emoji-btn" onclick="sendReaction('👍', this)" title="Thumbs up">👍</button>
      <button class="emoji-btn" onclick="sendReaction('🔥', this)" title="Fire">🔥</button>
      <button class="emoji-btn" onclick="sendReaction('😂', this)" title="Laughing">😂</button>
      <button class="emoji-btn" onclick="sendReaction('😮', this)" title="Wow">😮</button>
      <button class="emoji-btn" onclick="sendReaction('❤️', this)" title="Heart">❤️</button>
      <button class="emoji-btn" onclick="sendReaction('👏', this)" title="Clap">👏</button>
      <button class="emoji-btn" onclick="sendReaction('💩', this)" title="Poo">💩</button>
    </div>
  `;
  
  sb.innerHTML = html;
  
  // Show scorecard button when game is active
  const scorecardBtn = document.getElementById('scorecardBtn');
  if (scorecardBtn) {
    scorecardBtn.style.display = 'flex';
  }
  
  // Update top bar score label
  updateTopBarLabels();
}

function renderTable(){
  const table = document.getElementById('table');
  
  // Preserve the existing currentTrick div content before clearing table
  let existingTrickDiv = document.getElementById('currentTrick');
  const trickHTML = existingTrickDiv ? existingTrickDiv.innerHTML : '';
  
  table.innerHTML = '';
  const N = storage.players.length;
  storage.players.forEach((p, i) => {
    const angle = (i / N) * 2 * Math.PI - Math.PI / 2;
    const radius = 42; // Increased from 38 to push all players closer to edge
    const x = 50 + radius * Math.cos(angle);
    const y = 50 + radius * Math.sin(angle);
    const seat = document.createElement('div');
    seat.className = 'seat';
    seat.setAttribute('data-player-id', p.id);
    
    // Highlight current player's turn ONLY during active trick play
    // Not during dealing (waiting_deal), bidding, or after game ends
    if(storage.currentPlayer && p.id === storage.currentPlayer && storage.status === 'playing') {
      seat.classList.add('active-turn');
    }
    
    seat.style.left = x + '%';
    seat.style.top = y + '%';
    
    // Add mini card indicator (hidden by default)
    const miniCard = document.createElement('div');
    miniCard.className = 'mini-card';
    miniCard.setAttribute('data-mini-card', p.id);
    
    // Position mini card above the avatar (centered horizontally, offset vertically)
    miniCard.style.left = '50%';
    miniCard.style.top = '-28px'; // Position above avatar with slight overlap
    miniCard.style.transform = 'translateX(-50%)';
    
    // Add avatar image with fallback
    const img = document.createElement('img');
    img.src = getValidAvatar(p.avatar, p.name);
    img.alt = p.name;
    
    // Handle image loading errors with fallback
    img.onerror = function() {
      this.src = `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(p.name)}&backgroundColor=4caf50`;
    };
    
    // Add name div
    const nameDiv = document.createElement('div');
    nameDiv.className = 'name';
    nameDiv.textContent = p.name;
    
    // Append all elements
    seat.appendChild(miniCard);
    seat.appendChild(img);
    seat.appendChild(nameDiv);
    table.appendChild(seat);
  });
  
  // Create trick div and restore its content
  const trickDiv = document.createElement('div');
  trickDiv.id = 'currentTrick';
  trickDiv.className = 'trick';
  trickDiv.innerHTML = trickHTML;
  table.appendChild(trickDiv);
  
  // Update mini cards based on current trick
  updateMiniCards();
}

function renderMyHand(){
  const handDiv = document.getElementById('myHand');
  handDiv.innerHTML = '';
  const myCards = storage.hands[storage.myId] || [];
  
  // Cards should be disabled during bidding phase
  const isBidding = storage.status === 'bidding';
  
  // Cards should be disabled when trick is being resolved
  const trickResolving = storage.trickResolving;
  
  // Check if it's my turn - also check cardPlaying flag and trick resolving
  const myTurn = isMyTurn() && !storage.cardPlaying && !isBidding && !trickResolving;
  
  // Determine which cards are playable based on follow-suit rules
  const playableCards = myTurn ? getPlayableCards(myCards) : [];
  
  myCards.forEach(c => {
    const isPlayable = playableCards.includes(c);
    const el = document.createElement('div');
    el.className = `card ${suitColor(c.suit)}`;
    
    // Add trump class if this card is trump suit
    if (storage.trump && c.suit === storage.trump) {
      el.classList.add('trump');
    }
    
    // Gray out cards if bidding, not my turn, card is unplayable due to follow-suit, or card being played
    if(isBidding){
      el.style.opacity = '0.4';
      el.style.cursor = 'not-allowed';
      el.title = 'Wait for bidding to complete';
    } else if(trickResolving){
      el.style.opacity = '0.4';
      el.style.cursor = 'not-allowed';
      el.title = 'Trick being resolved...';
    } else if(!myTurn){
      el.style.opacity = '0.4';
      el.style.cursor = 'not-allowed';
      if(storage.cardPlaying){
        el.title = 'Card being played...';
      } else {
        el.title = 'Not your turn';
      }
    } else if(!isPlayable){
      el.style.opacity = '0.4';
      el.style.cursor = 'not-allowed';
      el.title = 'Cannot play this card - must follow suit';
    }
    
    const cardLabel = c.rank + c.suit;
    el.innerHTML = `
      <span class="card-corner top-left">${cardLabel}</span>
      <span class="card-corner top-right">${cardLabel}</span>
      <span class="card-center">${c.suit}</span>
      <span class="card-corner bottom-left">${cardLabel}</span>
      <span class="card-corner bottom-right">${cardLabel}</span>
    `;
    
    // Only allow clicking playable cards on my turn (not during bidding or trick resolution)
    if(myTurn && isPlayable && !isBidding && !trickResolving){
      el.onclick = () => playCard(c, el);
    } else {
      el.onclick = () => {
        if(isBidding){
          // Silent - just don't allow click during bidding
          return;
        } else if(trickResolving){
          // Silent - just don't allow click during trick resolution
          return;
        } else if(!myTurn){
          // Silent - just don't allow click when not player's turn
          return;
        } else if(!isPlayable){
          alert('You must follow the lead suit if you have it!');
        }
      };
    }
    
    handDiv.appendChild(el);
  });
  
  // Adjust alignment based on whether scrolling is needed
  adjustHandAlignment();
}

// Adjust hand alignment based on overflow
function adjustHandAlignment() {
  const handDiv = document.getElementById('myHand');
  
  // Small delay to ensure cards are fully rendered
  setTimeout(() => {
    const needsScroll = handDiv.scrollWidth > handDiv.clientWidth;
    
    if (needsScroll) {
      handDiv.style.justifyContent = 'flex-start';
    } else {
      handDiv.style.justifyContent = 'center';
    }
  }, 50);
}

// Determine which cards can be legally played
function getPlayableCards(myCards){
  // If it's not my turn or no cards, return empty
  if(!isMyTurn() || !myCards || myCards.length === 0){
    return [];
  }
  
  // If no lead suit yet (I'm leading), can play any card
  if(!storage.leadSuit){
    return myCards;
  }
  
  // Check if I have any cards of the lead suit
  const leadSuitCards = myCards.filter(c => c.suit === storage.leadSuit);
  
  // If I have lead suit cards, I MUST play one of them
  if(leadSuitCards.length > 0){
    return leadSuitCards;
  }
  
  // If I don't have lead suit, I can play any card (trump or discard)
  return myCards;
}

function renderCurrentTrick(){
  const div = document.getElementById('currentTrick');
  if(!div) return;
  div.innerHTML = '';
  storage.trick.forEach((t, index) => {
    const el = document.createElement('div');
    el.className = `card ${suitColor(t.card.suit)}`;
    const cardLabel = t.card.rank + t.card.suit;
    el.innerHTML = `
      <span class="card-corner top-left">${cardLabel}</span>
      <span class="card-corner top-right">${cardLabel}</span>
      <span class="card-center">${t.card.suit}</span>
      <span class="card-corner bottom-left">${cardLabel}</span>
      <span class="card-corner bottom-right">${cardLabel}</span>
    `;
    
    // Re-apply winner class if this card is marked as winner
    if(storage.winningCardIndex !== undefined && storage.winningCardIndex === index) {
      el.classList.add('winner');
    }
    
    div.appendChild(el);
  });
  
  // Update mini cards to show who played what
  updateMiniCards();
}

function updateMiniCards(){
  // Hide all mini cards first
  const allMiniCards = document.querySelectorAll('.mini-card');
  allMiniCards.forEach(mc => {
    mc.classList.remove('show', 'spades', 'clubs', 'hearts', 'diamonds');
    mc.innerHTML = '';
  });
  
  // Show mini cards for players who have played in current trick
  if(storage.trick && storage.trick.length > 0){
    storage.trick.forEach(t => {
      const miniCard = document.querySelector(`[data-mini-card="${t.playerId}"]`);
      if(miniCard){
        const suit = t.card.suit;
        const rank = t.card.rank;
        const suitClass = getSuitClass(suit);
        
        miniCard.className = `mini-card ${suitClass} show`;
        miniCard.innerHTML = `
          <div class="mini-rank">${rank}</div>
          <div class="mini-suit">${suit}</div>
        `;
      }
    });
  }
}

function getSuitClass(suit){
  if(suit === '♠') return 'spades';
  if(suit === '♥') return 'hearts';
  if(suit === '♦') return 'diamonds';
  if(suit === '♣') return 'clubs';
  return '';
}

/* ---------- TOP BAR LABELS ---------- */
function updateTopBarLabels() {
  // Update player name label
  const myNameLabel = document.getElementById('myNameLabel');
  const myPlayer = storage.players?.find(p => p.id === storage.myId);
  if (myNameLabel && myPlayer) {
    myNameLabel.textContent = myPlayer.name;
  }
  
  // Update score label
  const myScoreLabel = document.getElementById('myScoreLabel');
  if (myScoreLabel && storage.scores && storage.myId) {
    const myScore = storage.scores[storage.myId] || 0;
    myScoreLabel.textContent = myScore.toString();
  }
}
