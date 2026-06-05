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
  // Fisher-Yates shuffle for true randomness
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

function suitColor(s){
  return ['♠','♣'].includes(s) ? 'spades' : 'hearts';
}

/**
 * Generate a lobby code from an unambiguous alphabet.
 * Excludes look-alike characters (I, L, O, 0, 1) so codes are easy to read
 * aloud and type. Uppercase to match the case-insensitive join flow.
 */
function generateLobbyCode(length = 6) {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return code;
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
