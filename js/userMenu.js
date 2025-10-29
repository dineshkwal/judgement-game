/* ---------- USER MENU DROPDOWN ---------- */
function toggleUserMenu(){
  const menu = document.getElementById('userMenu');
  console.log('[toggleUserMenu] Called, menu:', menu, 'current classes:', menu?.className);
  menu.classList.toggle('show');
  console.log('[toggleUserMenu] After toggle, classes:', menu?.className);
}

function leaveGame(){
  if(!confirm('Leave this game?')) return;
  
  if(storage.lobbyId && storage.myId){
    db.ref(`lobbies/${storage.lobbyId}/players/${storage.myId}`).remove();
  }
  
  localStorage.removeItem('myPlayerInfo');
  storage.myId = null;
  storage.lobbyId = null;
  document.getElementById('userInfo').classList.remove('active');
  window.history.replaceState({}, document.title, window.location.pathname);
  location.reload();
}

function newGame(){
  if(!confirm('Start a new game? This will end the current game.')) return;
  resetGame();
}

// Close dropdown when clicking outside
window.addEventListener('click', function(event) {
  const userInfo = document.getElementById('userInfo');
  const userMenu = document.getElementById('userMenu');
  
  // If clicking outside userInfo entirely, close the menu
  if (userInfo && userMenu && !userInfo.contains(event.target)) {
    userMenu.classList.remove('show');
  }
});
