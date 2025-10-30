/* ---------- UI UPDATES ---------- */
function updateUI(){
  const dealBtn = document.getElementById('dealBtn');
  const biddingUI = document.getElementById('biddingUI');
  
  // Update round info
  updateRoundInfo();
  
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
      showCenterMessage('Waiting for dealer to deal cards...', 0);
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
    
    // Check if round is ending (no current player means all cards played)
    if(!storage.currentPlayer){
      hideCenterMessage();
    } else if(isMyTurn()){
      showCenterMessage('Your turn – play a card', 0); // Persistent
    } else {
      const currentPlayerName = storage.players.find(p => p.id === storage.currentPlayer)?.name || 'Player';
      showCenterMessage(`Waiting for ${currentPlayerName} to play...`, 0); // Persistent
    }
  }
}

function updateRoundInfo(){
  const round = storage.round || 1;
  const cardsPerRound = storage.cardsPerRound || 0;
  const trump = storage.trump || '♠';
  const cardsThisRound = cardsPerRound - round + 1;
  const roundInfoEl = document.getElementById('roundInfo');
  
  // Map suit symbols to names
  const suitNames = {
    '♠': 'Spades',
    '♥': 'Hearts',
    '♦': 'Diamonds',
    '♣': 'Clubs'
  };
  
  const trumpName = suitNames[trump] || 'Spades';
  
  console.log('DEBUG updateRoundInfo:', {round, cardsPerRound, trump, cardsThisRound});
  
  if(roundInfoEl) {
    roundInfoEl.innerHTML = `Round ${round} <span style="font-size: 1.8em; color: #ffd700; margin: 0 0.5rem;">${trump}</span> ${cardsThisRound > 0 ? cardsThisRound : 0} Cards <span style="font-size: 1.8em; color: #ffd700; margin: 0 0.5rem;">${trump}</span> ${trumpName}`;
    console.log('DEBUG roundInfo updated:', roundInfoEl.textContent);
  } else {
    console.log('DEBUG roundInfo element not found!');
  }
}

function showCenterMessage(text, duration = 2000){
  const centerMsg = document.getElementById('centerMsg');
  centerMsg.textContent = text;
  centerMsg.classList.add('show');
  // Clear any existing timeout
  if(centerMsg.hideTimeout) clearTimeout(centerMsg.hideTimeout);
  // If duration is 0, message stays persistent
  if(duration > 0){
    centerMsg.hideTimeout = setTimeout(() => {
      centerMsg.classList.remove('show');
    }, duration);
  }
}

function hideCenterMessage(){
  const centerMsg = document.getElementById('centerMsg');
  if(centerMsg.hideTimeout) clearTimeout(centerMsg.hideTimeout);
  centerMsg.classList.remove('show');
}

function renderScoreboard(){
  const sb = document.getElementById('scoreboard');
  let html = '<table><thead><tr><th>Player</th><th>Hands Bid</th><th>Hands Made</th></tr></thead><tbody>';
  
  storage.players.forEach(p => {
    const bid = storage.bids[p.id] !== undefined ? storage.bids[p.id] : '–';
    const won = storage.tricksWon[p.id] || 0;
    const isDealer = p.id === storage.dealerId ? ' 🃏' : '';
    const isActive = p.id === storage.currentBidder ? ' class="active-turn"' : '';
    html += `<tr${isActive}><td>${p.name}${isDealer}</td><td>${bid}</td><td>${won}</td></tr>`;
  });
  
  html += '</tbody></table>';
  sb.innerHTML = html;
  
  // Show scorecard button when game is active
  const scorecardBtn = document.getElementById('scorecardBtn');
  if (scorecardBtn) {
    scorecardBtn.style.display = 'block';
  }
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
    const radius = 38;
    const x = 50 + radius * Math.cos(angle);
    const y = 50 + radius * Math.sin(angle);
    const seat = document.createElement('div');
    seat.className = 'seat';
    
    // Highlight current player's turn
    if(storage.currentPlayer && p.id === storage.currentPlayer) {
      seat.classList.add('active-turn');
    }
    
    seat.style.left = x + '%';
    seat.style.top = y + '%';
    seat.innerHTML = `<img src="${p.avatar}" alt="${p.name}"><div class="name">${p.name}</div>`;
    table.appendChild(seat);
  });
  
  // Create trick div and restore its content
  const trickDiv = document.createElement('div');
  trickDiv.id = 'currentTrick';
  trickDiv.className = 'trick';
  trickDiv.innerHTML = trickHTML;
  table.appendChild(trickDiv);
  
  updateRoundInfo();
}

function renderMyHand(){
  const handDiv = document.getElementById('myHand');
  handDiv.innerHTML = '';
  const myCards = storage.hands[storage.myId] || [];
  
  // Check if it's my turn - also check cardPlaying flag
  const myTurn = isMyTurn() && !storage.cardPlaying;
  
  // Determine which cards are playable based on follow-suit rules
  const playableCards = myTurn ? getPlayableCards(myCards) : [];
  
  myCards.forEach(c => {
    const isPlayable = playableCards.includes(c);
    const el = document.createElement('div');
    el.className = `card ${suitColor(c.suit)}`;
    
    // Gray out cards if not my turn OR if card is unplayable due to follow-suit OR if card being played
    if(!myTurn){
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
    
    // Only allow clicking playable cards on my turn
    if(myTurn && isPlayable){
      el.onclick = () => playCard(c, el);
    } else {
      el.onclick = () => {
        if(!myTurn){
          // Silent - just don't allow click when not player's turn
          return;
        } else if(!isPlayable){
          alert('You must follow the lead suit if you have it!');
        }
      };
    }
    
    handDiv.appendChild(el);
  });
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
  storage.trick.forEach(t => {
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
    div.appendChild(el);
  });
}
