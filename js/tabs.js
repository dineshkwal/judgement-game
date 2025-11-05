// Tab switching functionality for registration screen

/**
 * Switch between Create and Join tabs
 * @param {string} tab - 'create' or 'join'
 */
function switchRegistrationTab(tab) {
  debugLog('Switching to tab:', tab);
  
  // Update tab buttons
  const createTabBtn = document.getElementById('createTab');
  const joinTabBtn = document.getElementById('joinTab');
  
  // Update tab content
  const createContent = document.getElementById('createTabContent');
  const joinContent = document.getElementById('joinTabContent');
  
  if (tab === 'create') {
    createTabBtn.classList.add('active');
    joinTabBtn.classList.remove('active');
    createContent.classList.add('active');
    joinContent.classList.remove('active');
    
    // Focus on name input in create tab
    setTimeout(() => {
      const nameInput = document.getElementById('playerNameCreate');
      if (nameInput) nameInput.focus();
    }, 100);
  } else if (tab === 'join') {
    createTabBtn.classList.remove('active');
    joinTabBtn.classList.add('active');
    createContent.classList.remove('active');
    joinContent.classList.add('active');
    
    // Focus on name input in join tab
    setTimeout(() => {
      const nameInput = document.getElementById('playerNameJoin');
      if (nameInput) nameInput.focus();
    }, 100);
  }
}

/**
 * Get selected avatar URL from a specific avatar grid
 * @param {string} gridId - ID of the avatar grid ('avatarGridCreate' or 'avatarGridJoin')
 * @returns {string|null} Avatar URL or null
 */
function getSelectedAvatarFromGrid(gridId) {
  const grid = document.getElementById(gridId);
  if (!grid) return null;
  
  const selected = grid.querySelector('.avatar-option.selected');
  return selected ? selected.dataset.avatar : null;
}
