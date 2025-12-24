/**
 * Sound Manager for Game of Judgement
 * Handles all game sound effects
 */

// Sound effects cache
const sounds = {
  cardDeal: null,
  bid: null,
  cardPlay: null,
  trickComplete: null,
  roundComplete: null,
  gameComplete: null
};

// Sound settings
let soundEnabled = true;

/**
 * Initialize sound effects - preload all sounds
 */
function initSounds() {
  // Preload card deal sound
  sounds.cardDeal = new Audio('assets/sounds/card-deal.mp3');
  sounds.cardDeal.preload = 'auto';
  
  // Preload bid sound
  sounds.bid = new Audio('assets/sounds/bid.mp3');
  sounds.bid.preload = 'auto';
  
  // Preload card play sound
  sounds.cardPlay = new Audio('assets/sounds/card-play.mp3');
  sounds.cardPlay.preload = 'auto';
  
  // Preload trick complete sound
  sounds.trickComplete = new Audio('assets/sounds/trick-complete.mp3');
  sounds.trickComplete.preload = 'auto';
  
  // Preload round complete sound
  sounds.roundComplete = new Audio('assets/sounds/round-complete.mp3');
  sounds.roundComplete.preload = 'auto';
  
  // Preload game complete sound
  sounds.gameComplete = new Audio('assets/sounds/game-complete.mp3');
  sounds.gameComplete.preload = 'auto';
  
  // Load sound preference from localStorage
  const savedPref = localStorage.getItem('soundEnabled');
  if (savedPref !== null) {
    soundEnabled = savedPref === 'true';
  }
  
  debugLog('Sounds initialized, enabled:', soundEnabled);
}

/**
 * Play a sound effect
 * @param {string} soundName - Name of the sound to play
 */
function playSound(soundName) {
  if (!soundEnabled) return;
  
  const sound = sounds[soundName];
  if (sound) {
    // Clone the audio to allow overlapping sounds
    const soundClone = sound.cloneNode();
    soundClone.volume = 1.0; // Full volume
    soundClone.play().catch(err => {
      // Ignore autoplay errors - browser may block until user interaction
      debugLog('Sound play failed (autoplay policy):', err.message);
    });
  }
}

/**
 * Play card deal sound (plays twice for emphasis)
 */
function playCardDealSound() {
  playSound('cardDeal');
  // Play second time after a short delay
  setTimeout(() => {
    playSound('cardDeal');
  }, 150);
}

/**
 * Play bid sound
 */
function playBidSound() {
  playSound('bid');
}

/**
 * Play card play sound (when card lands on table)
 */
function playCardPlaySound() {
  playSound('cardPlay');
}

/**
 * Play trick complete sound (when a trick is won)
 */
function playTrickCompleteSound() {
  playSound('trickComplete');
}

/**
 * Play round complete sound (when a round ends)
 */
function playRoundCompleteSound() {
  playSound('roundComplete');
}

/**
 * Play game complete sound (when game ends)
 */
function playGameCompleteSound() {
  playSound('gameComplete');
}

/**
 * Play card deal sound with delay (for dealing animation)
 * @param {number} cardIndex - Index of the card being dealt
 * @param {number} delayMs - Base delay between cards in milliseconds
 */
function playCardDealSoundDelayed(cardIndex, delayMs = 100) {
  setTimeout(() => {
    playCardDealSound();
  }, cardIndex * delayMs);
}

/**
 * Toggle sound on/off
 * @returns {boolean} New sound state
 */
function toggleSound() {
  soundEnabled = !soundEnabled;
  localStorage.setItem('soundEnabled', soundEnabled);
  debugLog('Sound toggled:', soundEnabled);
  return soundEnabled;
}

/**
 * Check if sound is enabled
 * @returns {boolean}
 */
function isSoundEnabled() {
  return soundEnabled;
}

/**
 * Set sound enabled state
 * @param {boolean} enabled
 */
function setSoundEnabled(enabled) {
  soundEnabled = enabled;
  localStorage.setItem('soundEnabled', soundEnabled);
}
