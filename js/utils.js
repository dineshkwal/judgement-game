/* ---------- HELPERS ---------- */
const suits = ['♠','♥','♦','♣'];
const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

function makeDeck(){
  const d = [];
  for(const s of suits) {
    for(const r of ranks) {
      // Value: 2=2, 3=3, ..., 10=10, J=11, Q=12, K=13, A=14
      d.push({suit:s, rank:r, value: ranks.indexOf(r)+2});
    }
  }
  return d.sort(()=>Math.random()-.5);
}

function suitColor(s){ 
  return ['♠','♣'].includes(s) ? 'spades' : 'hearts'; 
}

function showScreen(id){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

/**
 * Get a valid avatar URL with fallback
 * @param {string} avatarUrl - The avatar URL from player data
 * @param {string} playerName - Player name for generating fallback
 * @returns {string} Valid avatar URL
 */
function getValidAvatar(avatarUrl, playerName) {
  if (avatarUrl && avatarUrl.startsWith('http')) {
    return avatarUrl;
  }
  // Generate fallback avatar based on player name
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(playerName)}&backgroundColor=4caf50`;
}
