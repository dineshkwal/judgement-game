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
  gameComplete: null,
  lobbyButton: null,
  startGame: null
};

// Sound settings
let soundEnabled = true;
let voiceEnabled = false; // Voice "Your Turn" - OFF by default

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
  
  // Preload lobby button sound (create/join lobby)
  sounds.lobbyButton = new Audio('assets/sounds/create-join-lobby.mp3');
  sounds.lobbyButton.preload = 'auto';
  
  // Preload start game sound
  sounds.startGame = new Audio('assets/sounds/start-game.mp3');
  sounds.startGame.preload = 'auto';
  
  // Load sound preference from localStorage
  const savedPref = localStorage.getItem('soundEnabled');
  if (savedPref !== null) {
    soundEnabled = savedPref === 'true';
  }
  
  // Load voice preference from localStorage (default OFF)
  const savedVoicePref = localStorage.getItem('voiceEnabled');
  if (savedVoicePref !== null) {
    voiceEnabled = savedVoicePref === 'true';
  }
  
  debugLog('Sounds initialized, enabled:', soundEnabled, 'voice:', voiceEnabled);
}

/**
 * Play a sound effect
 * @param {string} soundName - Name of the sound to play
 * @param {number} volume - Volume level (0-1), default 1.0
 */
function playSound(soundName, volume = 1.0) {
  if (!soundEnabled) return;
  
  const sound = sounds[soundName];
  if (sound) {
    // Clone the audio to allow overlapping sounds
    const soundClone = sound.cloneNode();
    soundClone.volume = volume;
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
  playSound('cardPlay', 0.25); // Softer volume for frequent sound
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
  playSound('roundComplete', 0.25);
}

/**
 * Play game complete sound (when game ends)
 */
function playGameCompleteSound() {
  playSound('gameComplete');
}

/**
 * Play lobby button sound (create/join lobby)
 */
function playLobbyButtonSound() {
  playSound('lobbyButton');
}

/**
 * Play start game sound
 */
function playStartGameSound() {
  playSound('startGame');
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

/**
 * Check if voice is enabled
 * @returns {boolean}
 */
function isVoiceEnabled() {
  return voiceEnabled;
}

/**
 * Set voice enabled state
 * @param {boolean} enabled
 */
function setVoiceEnabled(enabled) {
  voiceEnabled = enabled;
  localStorage.setItem('voiceEnabled', voiceEnabled);
}

/**
 * Speak "Your turn" using Web Speech API
 * Uses a soft female voice at slower speed
 * Only speaks if voice notifications are enabled
 */
function speakYourTurn() {
  if (!voiceEnabled) return;
  
  // Check if Speech Synthesis is available
  if (!('speechSynthesis' in window)) {
    debugLog('Speech Synthesis not available');
    return;
  }
  
  // Cancel any ongoing speech
  speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance('Your turn');
  utterance.volume = 0.4;  // Soft/gentle volume (0-1)
  utterance.rate = 0.85;   // Slower speed for gentle feel
  utterance.pitch = 1.1;   // Slightly higher pitch for softer tone
  
  // Try to find a female English voice
  const voices = speechSynthesis.getVoices();
  
  // Priority: Female voice > Any English voice > Default
  const femaleVoice = voices.find(v => 
    v.lang.startsWith('en') && 
    (v.name.toLowerCase().includes('female') || 
     v.name.toLowerCase().includes('samantha') ||  // macOS
     v.name.toLowerCase().includes('zira') ||      // Windows
     v.name.toLowerCase().includes('hazel') ||     // Windows UK
     v.name.toLowerCase().includes('susan') ||     // Windows UK
     v.name.toLowerCase().includes('google us english female') || // Chrome
     v.name.toLowerCase().includes('google uk english female'))   // Chrome
  );
  
  const englishVoice = voices.find(v => v.lang.startsWith('en'));
  
  if (femaleVoice) {
    utterance.voice = femaleVoice;
    debugLog('Using female voice:', femaleVoice.name);
  } else if (englishVoice) {
    utterance.voice = englishVoice;
    debugLog('Using English voice:', englishVoice.name);
  }
  
  speechSynthesis.speak(utterance);
  debugLog('Speaking: Your turn (soft female voice)');
}
