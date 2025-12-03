/* ---------- FIREBASE CONFIG ---------- */
const firebaseConfig = {
  apiKey: "AIzaSyC3-j38Zol7jqdPaCxr8gQ6eyqyfBmJiv4",
  authDomain: "judgement-game-ef741.firebaseapp.com",
  databaseURL: "https://judgement-game-ef741-default-rtdb.firebaseio.com",
  projectId: "judgement-game-ef741",
  storageBucket: "judgement-game-ef741.firebasestorage.app",
  messagingSenderId: "518151609641",
  appId: "1:518151609641:web:339ef9c79ce4ac98f22b38"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/* ---------- SCORING RULES ---------- */
const SCORING_RULES = {
  classic: {
    id: 'classic',
    name: '🎯 Classic',
    description: 'Balanced scoring - rewards accuracy',
    rules: {
      exact: { base: 20, multiplier: 0, bonus: 0 },
      under: { base: 0, multiplier: 0, penalty: 0 },
      over: { base: 0, multiplier: 1, bonus: 0 } // tricks made
    },
    calculate: function(bid, made) {
      if (bid === made) return 20;
      if (made < bid) return 0;
      return made; // over: return tricks made
    },
    preview: [
      'Exact bid: +20 points',
      'Under bid: 0 points',
      'Over bid: +[tricks made]'
    ]
  },
  highStakes: {
    id: 'highStakes',
    name: '💎 High Stakes',
    description: 'Big rewards for exact bids, risky gameplay',
    rules: {
      exact: { base: 0, multiplier: 10, bonus: 0 },
      under: { base: 0, multiplier: 0, penalty: 0 },
      over: { base: 0, multiplier: 1, bonus: 0 }
    },
    calculate: function(bid, made) {
      if (bid === made) return bid * 10;
      if (made < bid) return 0;
      return bid; // over: return bid value
    },
    preview: [
      'Exact bid: +[bid × 10] points',
      'Under bid: 0 points',
      'Over bid: +[bid] points'
    ]
  },
  aggressive: {
    id: 'aggressive',
    name: '⚡ Aggressive',
    description: 'Penalties for failing, high risk/reward',
    rules: {
      exact: { base: 10, multiplier: 10, bonus: 0 },
      under: { base: 0, multiplier: 0, penalty: 5 },
      over: { base: 0, multiplier: 1, bonus: 0 }
    },
    calculate: function(bid, made) {
      if (bid === made) return bid * 10 + 10;
      if (made < bid) return -(bid - made) * 5; // penalty
      return bid; // over: return bid value
    },
    preview: [
      'Exact bid: +[bid × 10 + 10]',
      'Under bid: -[difference × 5]',
      'Over bid: +[bid] points'
    ]
  },
  casual: {
    id: 'casual',
    name: '🎲 Casual',
    description: 'Forgiving scoring, good for beginners',
    rules: {
      exact: { base: 15, multiplier: 5, bonus: 0 },
      under: { base: 0, multiplier: 3, bonus: 0 },
      over: { base: 0, multiplier: 1, bonus: 0 }
    },
    calculate: function(bid, made) {
      if (bid === made) return bid * 5 + 15;
      const diff = Math.abs(bid - made);
      if (diff === 1) return made * 3; // within 1
      return made; // off by 2+
    },
    preview: [
      'Exact bid: +[bid × 5 + 15]',
      'Within 1: +[tricks × 3]',
      'Off by 2+: +[tricks] points'
    ]
  }
};

