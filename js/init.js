/* ---------- INITIALIZATION ---------- */

// Avatar data with fun styles
const avatars = [
  { seed: 'Felix', name: 'Felix', bg: '4caf50' },
  { seed: 'Aneka', name: 'Aneka', bg: '2196f3' },
  { seed: 'Charlie', name: 'Charlie', bg: 'ff9800' },
  { seed: 'Lucy', name: 'Lucy', bg: 'e91e63' },
  { seed: 'Max', name: 'Max', bg: '9c27b0' },
  { seed: 'Sophie', name: 'Sophie', bg: '00bcd4' },
  { seed: 'Oscar', name: 'Oscar', bg: 'ff5722' },
  { seed: 'Emma', name: 'Emma', bg: 'cddc39' },
  { seed: 'Jack', name: 'Jack', bg: 'ff6f00' },
  { seed: 'Mia', name: 'Mia', bg: '8bc34a' },
  { seed: 'Luna', name: 'Luna', bg: '3f51b5' },
  { seed: 'Oliver', name: 'Oliver', bg: 'f44336' }
];

let selectedAvatar = avatars[0];

// Initialize app
window.addEventListener('DOMContentLoaded', () => {
  debugLog('DOM loaded, initializing...');
  
  // Check if player is rejoining an existing lobby
  const urlParams = new URLSearchParams(window.location.search);
  const joinLobbyId = urlParams.get('lobby');
  
  if(joinLobbyId) {
    // Normalize lobby ID to uppercase for case-insensitive matching
    const normalizedLobbyId = joinLobbyId.toUpperCase();
    
    // Try to rejoin with existing player data
    const savedPlayerInfo = localStorage.getItem('myPlayerInfo');
    const savedLobbyId = localStorage.getItem('lastLobbyId');
    const savedPlayerId = localStorage.getItem('lastPlayerId');
    
    if(savedPlayerInfo && savedLobbyId === normalizedLobbyId && savedPlayerId) {
      // Player is rejoining the same lobby - restore their session
      debugLog('Rejoining lobby with saved credentials');
      const playerInfo = JSON.parse(savedPlayerInfo);
      storage.myId = savedPlayerId;
      storage.lobbyId = normalizedLobbyId;
      
      // Check if player still exists in lobby
      db.ref(`lobbies/${normalizedLobbyId}/players/${savedPlayerId}`).once('value', (snapshot) => {
        if(snapshot.exists()) {
          // Player still in lobby - just update status and rejoin
          debugLog('Player found in lobby, rejoining...');
          db.ref(`lobbies/${normalizedLobbyId}/players/${savedPlayerId}`).update({
            lastSeen: Date.now(),
            status: 'online'
          });
          
          // Show user info
          document.getElementById('userInfoName').textContent = playerInfo.name;
          document.getElementById('userInfoAvatar').src = playerInfo.avatar;
          document.getElementById('userInfo').classList.add('active');
          
          // Check if game has started
          db.ref(`lobbies/${normalizedLobbyId}/game`).once('value', (gameSnapshot) => {
            if(gameSnapshot.exists()) {
              showScreen('game');
            } else {
              showScreen('lobby');
            }
            listenForPlayers();
            updateLobbyInfo();
            setupPresence(); // Start Firebase presence system
          });
          return;
        } else {
          // Player was removed - need to re-register
          debugLog('Player not found in lobby, showing registration');
          showScreen('register');
        }
      });
    } else {
      // No saved data or different lobby - show registration
      showScreen('register');
    }
  } else {
    showScreen('register');
  }
  
  // Initialize custom dropdown
  if (typeof initCustomDropdown === 'function') {
    initCustomDropdown();
  }
  
  // Adjust hand alignment on window resize
  window.addEventListener('resize', () => {
    if (typeof adjustHandAlignment === 'function') {
      adjustHandAlignment();
    }
  });
  
  // Add Enter key listener to player name input
  const playerNameInput = document.getElementById('playerName');
  if (playerNameInput) {
    debugLog('Adding Enter key listener to player name input');
    playerNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.keyCode === 13) {
        debugLog('Enter key pressed in name input');
        e.preventDefault();
        registerPlayer();
      }
    });
  } else {
    debugLog('Player name input not found');
  }
  
  // Small delay to ensure DOM is ready
  setTimeout(() => {
    // Generate avatar grid
    const avatarGrid = document.getElementById('avatarGrid');
    const avatarPreview = document.getElementById('avatarPreview');
    const avatarName = document.getElementById('avatarName');
    
    debugLog('Avatar grid element:', avatarGrid);
    debugLog('Avatar preview element:', avatarPreview);
    
    if (avatarGrid && avatarPreview && avatarName) {
      debugLog('Generating avatars...');
      avatars.forEach((avatar, index) => {
        const avatarBtn = document.createElement('button');
        avatarBtn.className = 'avatar-option' + (index === 0 ? ' selected' : '');
        avatarBtn.type = 'button';
        avatarBtn.onclick = () => selectAvatar(avatar, avatarBtn);
        
        const img = document.createElement('img');
        img.src = `https://api.dicebear.com/9.x/adventurer/svg?seed=${avatar.seed}&backgroundColor=${avatar.bg}`;
        img.alt = avatar.name;
        
        avatarBtn.appendChild(img);
        avatarGrid.appendChild(avatarBtn);
      });
      debugLog('Avatar grid populated with', avatars.length, 'avatars');
      
      // Setup navigation buttons
      setupAvatarScroll();
    } else {
      console.error('Could not find required elements');
    }
  }, 100);
});

function setupAvatarScroll() {
  const avatarGrid = document.getElementById('avatarGrid');
  const leftBtn = document.getElementById('avatarScrollLeft');
  const rightBtn = document.getElementById('avatarScrollRight');
  
  if (!avatarGrid || !leftBtn || !rightBtn) return;
  
  // Update button visibility based on scroll position
  function updateNavButtons() {
    const scrollLeft = avatarGrid.scrollLeft;
    const maxScroll = avatarGrid.scrollWidth - avatarGrid.clientWidth;
    
    leftBtn.classList.toggle('hidden', scrollLeft <= 0);
    rightBtn.classList.toggle('hidden', scrollLeft >= maxScroll - 1);
  }
  
  // Scroll left
  leftBtn.onclick = () => {
    avatarGrid.scrollBy({ left: -200, behavior: 'smooth' });
  };
  
  // Scroll right
  rightBtn.onclick = () => {
    avatarGrid.scrollBy({ left: 200, behavior: 'smooth' });
  };
  
  // Update buttons on scroll
  avatarGrid.addEventListener('scroll', updateNavButtons);
  
  // Initial button state
  updateNavButtons();
  
  // Add touch/mouse drag scrolling
  let isDown = false;
  let startX;
  let scrollLeftPos;
  
  avatarGrid.addEventListener('mousedown', (e) => {
    isDown = true;
    avatarGrid.style.cursor = 'grabbing';
    startX = e.pageX - avatarGrid.offsetLeft;
    scrollLeftPos = avatarGrid.scrollLeft;
  });
  
  avatarGrid.addEventListener('mouseleave', () => {
    isDown = false;
    avatarGrid.style.cursor = 'grab';
  });
  
  avatarGrid.addEventListener('mouseup', () => {
    isDown = false;
    avatarGrid.style.cursor = 'grab';
  });
  
  avatarGrid.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - avatarGrid.offsetLeft;
    const walk = (x - startX) * 1.5;
    avatarGrid.scrollLeft = scrollLeftPos - walk;
  });
  
  avatarGrid.style.cursor = 'grab';
}

function selectAvatar(avatar, buttonElement) {
  selectedAvatar = avatar;
  
  // Update preview
  const avatarPreview = document.getElementById('avatarPreview');
  const avatarName = document.getElementById('avatarName');
  
  if (avatarPreview && avatarName) {
    avatarPreview.src = `https://api.dicebear.com/9.x/adventurer/svg?seed=${avatar.seed}&backgroundColor=${avatar.bg}`;
    avatarName.textContent = avatar.name;
    
    // Add animation
    avatarPreview.style.animation = 'none';
    setTimeout(() => {
      avatarPreview.style.animation = 'avatarPop 0.4s ease';
    }, 10);
  }
  
  // Update selected state
  document.querySelectorAll('.avatar-option').forEach(btn => btn.classList.remove('selected'));
  if (buttonElement) {
    buttonElement.classList.add('selected');
  }
}

function getSelectedAvatarURL() {
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${selectedAvatar.seed}&backgroundColor=${selectedAvatar.bg}`;
}
