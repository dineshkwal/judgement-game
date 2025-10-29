/* ---------- REGISTER ---------- */
function registerPlayer(){
  const name = document.getElementById('playerName').value.trim();
  const avatar = document.getElementById('avatarSelect').value;
  if(!name) return alert('Enter a name');
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const player = {id, name, avatar, joinedAt: Date.now()};
  storage.myId = id;
  
  // Store player info in localStorage for persistence
  localStorage.setItem('myPlayerInfo', JSON.stringify({name, avatar}));
  
  // Show user info in top right
  document.getElementById('userInfoName').textContent = name;
  document.getElementById('userInfoAvatar').src = avatar;
  document.getElementById('userInfo').classList.add('active');
  
  // Check if joining existing lobby
  const urlParams = new URLSearchParams(window.location.search);
  const joinLobbyId = urlParams.get('lobby');
  
  if(joinLobbyId){
    // Join existing lobby
    storage.lobbyId = joinLobbyId;
    db.ref(`lobbies/${joinLobbyId}/players`).child(id).set(player).then(()=>{
      showScreen('lobby');
      listenForPlayers();
      updateLobbyInfo();
    }).catch(err => alert('Error joining lobby: ' + err.message));
  } else {
    // Create new lobby
    const lobbyId = Math.random().toString(36).substr(2, 6).toUpperCase();
    storage.lobbyId = lobbyId;
    db.ref(`lobbies/${lobbyId}/players`).child(id).set(player).then(()=>{
      showScreen('lobby');
      listenForPlayers();
      updateLobbyInfo();
    }).catch(err => alert('Error creating lobby: ' + err.message));
  }
}
