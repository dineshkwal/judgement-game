/* ---------- GLOBAL STATE ---------- */
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
