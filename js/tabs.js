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
      
      // Update scroll buttons visibility for create tab
      updateAvatarScrollButtons('avatarGridCreate', 'avatarScrollLeftCreate', 'avatarScrollRightCreate');
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
      
      // Update scroll buttons visibility for join tab
      updateAvatarScrollButtons('avatarGridJoin', 'avatarScrollLeftJoin', 'avatarScrollRightJoin');
    }, 100);
  }
}

/**
 * Update avatar scroll button visibility
 * @param {string} gridId - Avatar grid ID
 * @param {string} leftBtnId - Left button ID
 * @param {string} rightBtnId - Right button ID
 */
function updateAvatarScrollButtons(gridId, leftBtnId, rightBtnId) {
  const grid = document.getElementById(gridId);
  const leftBtn = document.getElementById(leftBtnId);
  const rightBtn = document.getElementById(rightBtnId);
  
  if (!grid || !leftBtn || !rightBtn) return;
  
  const scrollLeft = grid.scrollLeft;
  const scrollWidth = grid.scrollWidth;
  const clientWidth = grid.clientWidth;
  
  debugLog('Updating scroll buttons for', gridId, '- scrollLeft:', scrollLeft, 'scrollWidth:', scrollWidth, 'clientWidth:', clientWidth);
  
  if (scrollLeft <= 0) {
    leftBtn.classList.add('hidden');
  } else {
    leftBtn.classList.remove('hidden');
  }
  
  if (scrollLeft + clientWidth >= scrollWidth - 1) {
    rightBtn.classList.add('hidden');
  } else {
    rightBtn.classList.remove('hidden');
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
