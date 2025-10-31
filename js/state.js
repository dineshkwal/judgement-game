/* ---------- GLOBAL STATE ---------- */

// Debug flag - set to true for development, false for production
const DEBUG = false;

// Debug logging helper - only logs when DEBUG is true
function debugLog(...args) {
  if (DEBUG) {
    console.log(...args);
  }
}

const storage = {
  players: [],
  hostId: null,
  dealerId: null,
  currentBidder: null,
  round: 1,
  cardsPerRound: 0,
  deck: [],
  hands: {},
  trick: [],
  leadSuit: null,
  trump: null,
  bids: {},
  tricksWon: {},
  scores: {},
  roundHistory: [],  // Track each round: {round, players: {[id]: {bid, won, points}}}
  myId: null,
  lobbyId: null,
  gameRef: null,
  isHost: false,
  trickResolving: false,
  cardPlaying: false  // Flag to prevent double-playing cards
};

