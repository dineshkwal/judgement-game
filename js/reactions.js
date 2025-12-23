/* ---------- EMOJI REACTIONS & QUICK CHAT ---------- */

/**
 * Toggle the reaction dropdown
 */
function toggleReactionDropdown(event) {
  event.stopPropagation();
  const dropdown = document.getElementById('reactionDropdown');
  const chatDropdown = document.getElementById('quickChatDropdown');
  
  // Close the other dropdown
  if (chatDropdown) chatDropdown.classList.remove('show');
  
  // Toggle this dropdown
  if (dropdown) dropdown.classList.toggle('show');
}

/**
 * Toggle the quick chat dropdown
 */
function toggleQuickChatDropdown(event) {
  event.stopPropagation();
  const dropdown = document.getElementById('quickChatDropdown');
  const reactionDropdown = document.getElementById('reactionDropdown');
  
  // Close the other dropdown
  if (reactionDropdown) reactionDropdown.classList.remove('show');
  
  // Toggle this dropdown
  if (dropdown) dropdown.classList.toggle('show');
}

/**
 * Close dropdowns when clicking outside
 */
function closeDropdowns(event) {
  if (!event.target.closest('.corner-btn') && !event.target.closest('.reaction-dropdown') && !event.target.closest('.quickchat-dropdown')) {
    const reactionDropdown = document.getElementById('reactionDropdown');
    const chatDropdown = document.getElementById('quickChatDropdown');
    if (reactionDropdown) reactionDropdown.classList.remove('show');
    if (chatDropdown) chatDropdown.classList.remove('show');
  }
}

// Add global click listener to close dropdowns
document.addEventListener('click', closeDropdowns);

/**
 * Send a quick chat message to other players
 * @param {string} message - The message to send
 * @param {HTMLElement} button - The button element that was clicked (optional)
 */
function sendQuickChat(message, button) {
  // Keep dropdown open - it will close when clicking outside or on button again
  
  // Remove focus from button
  if (button && button.blur) {
    button.blur();
  }
  
  if (!storage.lobbyId || !storage.myId) {
    debugLog('Cannot send quick chat: no lobby or player ID');
    return;
  }

  // Get player info
  const player = storage.players.find(p => p.id === storage.myId);
  if (!player) {
    debugLog('Cannot send quick chat: player not found');
    return;
  }

  // Create chat object
  const chat = {
    message: message,
    playerId: storage.myId,
    playerName: player.name,
    timestamp: Date.now(),
    type: 'quickchat'
  };

  console.log('Sending quick chat to Firebase:', chat);
  
  // Send to Firebase (using same reactions path for simplicity)
  db.ref(`lobbies/${storage.lobbyId}/reactions`).push(chat);
  
  debugLog('Quick chat sent:', message, 'by', player.name);
  
  // Add haptic feedback on mobile
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }
  
  // Show local feedback animation with message
  showQuickChatAnimation(message);
}

/**
 * Show a floating animation when user sends a quick chat
 * @param {string} message - The message to animate
 */
function showQuickChatAnimation(message) {
  const animDiv = document.createElement('div');
  animDiv.className = 'quickchat-float';
  animDiv.textContent = message;
  animDiv.style.cssText = `
    position: fixed;
    bottom: 25%;
    left: 50%;
    transform: translateX(-50%);
    font-size: 1.2rem;
    font-weight: 600;
    color: #7bed9f;
    background: rgba(0, 0, 0, 0.7);
    padding: 0.5rem 1rem;
    border-radius: 20px;
    z-index: 9999;
    pointer-events: none;
    animation: floatUp 1.5s ease-out forwards;
  `;
  
  document.body.appendChild(animDiv);
  
  // Remove after animation
  setTimeout(() => {
    animDiv.remove();
  }, 1500);
}

/**
 * Send an emoji reaction to other players
 * @param {string} emoji - The emoji character to send
 * @param {HTMLElement} button - The button element that was clicked (optional)
 */
function sendReaction(emoji, button) {
  // Keep dropdown open - it will close when clicking outside or on button again
  
  // Remove focus from button to prevent visual feedback remaining
  if (button && button.blur) {
    button.blur();
  }
  
  if (!storage.lobbyId || !storage.myId) {
    debugLog('Cannot send reaction: no lobby or player ID');
    return;
  }

  // Get player info
  const player = storage.players.find(p => p.id === storage.myId);
  if (!player) {
    debugLog('Cannot send reaction: player not found');
    return;
  }

  // Create reaction object
  const reaction = {
    emoji: emoji,
    playerId: storage.myId,
    playerName: player.name,
    timestamp: Date.now()
  };

  console.log('Sending reaction to Firebase:', reaction);
  console.log('Lobby ID:', storage.lobbyId);
  
  // Send to Firebase
  db.ref(`lobbies/${storage.lobbyId}/reactions`).push(reaction);
  
  // Track emoji reaction
  Analytics.trackEmojiReaction(emoji);
  
  debugLog('Reaction sent:', emoji, 'by', player.name);
  
  // Add haptic feedback on mobile
  if (navigator.vibrate) {
    navigator.vibrate(50); // Short vibration
  }
  
  // Show local feedback animation
  showReactionAnimation(emoji);
}

/**
 * Show a floating animation when user sends a reaction
 * @param {string} emoji - The emoji to animate
 */
function showReactionAnimation(emoji) {
  const animDiv = document.createElement('div');
  animDiv.className = 'reaction-float';
  animDiv.textContent = emoji;
  animDiv.style.cssText = `
    position: fixed;
    bottom: 20%;
    left: 50%;
    transform: translateX(-50%);
    font-size: 3rem;
    z-index: 9999;
    pointer-events: none;
    animation: floatUp 1s ease-out forwards;
  `;
  
  document.body.appendChild(animDiv);
  
  // Remove after animation
  setTimeout(() => {
    animDiv.remove();
  }, 1000);
}

// Track if listener is already set up
let reactionListenerActive = false;

/**
 * Listen for reactions from other players
 */
function listenForReactions() {
  if (!storage.lobbyId) {
    console.warn('listenForReactions called but no lobbyId');
    return;
  }
  
  // Prevent duplicate listeners
  if (reactionListenerActive) {
    console.log('Reaction listener already active');
    return;
  }
  
  console.log('Setting up reaction listener for lobby:', storage.lobbyId);
  reactionListenerActive = true;
  
  const reactionsRef = db.ref(`lobbies/${storage.lobbyId}/reactions`);
  
  // Listen for new reactions with error handling
  reactionsRef.on('child_added', (snapshot) => {
    const reaction = snapshot.val();
    console.log('Reaction received:', reaction);
    console.log('My ID:', storage.myId);
    console.log('Is my reaction?', reaction.playerId === storage.myId);
    
    // Don't show our own reactions (already shown locally)
    if (reaction.playerId === storage.myId) {
      console.log('Skipping own reaction');
      return;
    }
    
    console.log('Showing other player reaction');
    // Show reaction from other player
    showOtherPlayerReaction(reaction);
    
    // Clean up after animation completes (3 seconds to ensure everyone sees it)
    setTimeout(() => {
      console.log('Deleting reaction from Firebase');
      snapshot.ref.remove();
    }, 3000);
  });
}

/**
 * Show a reaction from another player
 * @param {Object} reaction - The reaction object
 */
function showOtherPlayerReaction(reaction) {
  console.log('Showing reaction from player:', reaction);
  
  // Find the player's seat element on the game table
  const seat = document.querySelector(`.seat[data-player-id="${reaction.playerId}"]`);
  
  if (!seat) {
    console.warn('Player seat not found for reaction:', reaction.playerId);
    console.log('Available seats:', document.querySelectorAll('.seat'));
    return;
  }
  
  // Get the game screen container (#game div)
  const gameScreen = document.getElementById('game');
  if (!gameScreen) {
    console.warn('Game screen not found');
    return;
  }
  
  console.log('Found seat and game screen, creating animation');
  
  // Calculate position relative to game screen
  const gameScreenRect = gameScreen.getBoundingClientRect();
  const seatRect = seat.getBoundingClientRect();
  
  // Check if this is a quick chat message or emoji
  const isQuickChat = reaction.type === 'quickchat';
  
  // Create element
  const element = document.createElement('div');
  element.className = isQuickChat ? 'quickchat-float-from-player' : 'emoji-float-from-player';
  element.textContent = isQuickChat ? reaction.message : reaction.emoji;
  
  // Position at player's avatar location with different styles
  if (isQuickChat) {
    element.style.cssText = `
      position: absolute;
      top: ${seatRect.top - gameScreenRect.top + 20}px;
      left: ${seatRect.left - gameScreenRect.left + 40}px;
      font-size: 0.9rem;
      font-weight: 600;
      color: #1a1a1a;
      background: linear-gradient(135deg, #ffd700 0%, #ffb900 100%);
      padding: 0.5rem 1rem;
      border-radius: 16px 16px 16px 4px;
      white-space: nowrap;
      z-index: 9999;
      pointer-events: none;
      animation: floatFromPlayer 2.5s ease-out forwards;
      box-shadow: 0 4px 20px rgba(255, 215, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3);
      border: 2px solid rgba(255, 255, 255, 0.3);
      text-shadow: none;
    `;
  } else {
    element.style.cssText = `
      position: absolute;
      top: ${seatRect.top - gameScreenRect.top + 30}px;
      left: ${seatRect.left - gameScreenRect.left + 30}px;
      font-size: 2.5rem;
      z-index: 9999;
      pointer-events: none;
      animation: floatFromPlayer 2s ease-out forwards;
    `;
  }
  
  gameScreen.appendChild(element);
  
  // Remove after animation completes
  const duration = isQuickChat ? 2500 : 2000;
  setTimeout(() => element.remove(), duration);
}

/**
 * Clean up old reactions from Firebase (called periodically)
 */
function cleanupOldReactions() {
  if (!storage.lobbyId) return;
  
  const cutoffTime = Date.now() - 5000; // 5 seconds ago
  const reactionsRef = db.ref(`lobbies/${storage.lobbyId}/reactions`);
  
  reactionsRef.once('value', (snapshot) => {
    snapshot.forEach((child) => {
      const reaction = child.val();
      if (reaction.timestamp < cutoffTime) {
        child.ref.remove();
      }
    });
  });
}

// Cleanup old reactions every 10 seconds
setInterval(cleanupOldReactions, 10000);
