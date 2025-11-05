// Input validation utilities

/**
 * Validates player name
 * @param {string} name - The player name to validate
 * @returns {Object} {valid: boolean, error: string}
 */
function validatePlayerName(name) {
  const trimmedName = name.trim();
  
  // Check if empty
  if (!trimmedName) {
    return { valid: false, error: 'Player name is required' };
  }
  
  // Check minimum length
  if (trimmedName.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }
  
  // Check maximum length
  if (trimmedName.length > 20) {
    return { valid: false, error: 'Name must be 20 characters or less' };
  }
  
  // Check for valid characters (alphanumeric, spaces, hyphens, underscores)
  const validNamePattern = /^[a-zA-Z0-9\s_-]+$/;
  if (!validNamePattern.test(trimmedName)) {
    return { valid: false, error: 'Name can only contain letters, numbers, spaces, hyphens and underscores' };
  }
  
  // Check that name isn't just spaces/special chars
  const hasLetterOrNumber = /[a-zA-Z0-9]/.test(trimmedName);
  if (!hasLetterOrNumber) {
    return { valid: false, error: 'Name must contain at least one letter or number' };
  }
  
  return { valid: true, error: null };
}

/**
 * Validates lobby code
 * @param {string} code - The lobby code to validate
 * @returns {Object} {valid: boolean, error: string}
 */
function validateLobbyCode(code) {
  const trimmedCode = code.trim().toUpperCase();
  
  // Empty is not valid for joining
  if (!trimmedCode) {
    return { valid: false, error: 'Lobby code is required' };
  }
  
  // Check minimum length
  if (trimmedCode.length < 4) {
    return { valid: false, error: 'Lobby code must be at least 4 characters' };
  }
  
  // Check maximum length
  if (trimmedCode.length > 8) {
    return { valid: false, error: 'Lobby code must be 8 characters or less' };
  }
  
  // Check for valid characters (alphanumeric only, no special chars)
  const validCodePattern = /^[A-Z0-9]+$/;
  if (!validCodePattern.test(trimmedCode)) {
    return { valid: false, error: 'Lobby code can only contain letters and numbers' };
  }
  
  return { valid: true, error: null };
}

/**
 * Sanitizes a string for safe display and Firebase storage
 * Removes potentially dangerous characters while preserving readability
 * @param {string} input - The string to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeInput(input) {
  if (!input) return '';
  
  // Remove Firebase forbidden characters: . # $ / [ ]
  let sanitized = input.replace(/[.#$/\[\]]/g, '');
  
  // Remove any HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Collapse multiple spaces into one
  sanitized = sanitized.replace(/\s+/g, ' ');
  
  return sanitized;
}

/**
 * Real-time input formatting for lobby code field
 * Converts to uppercase and removes invalid characters as user types
 * @param {HTMLInputElement} input - The input element
 */
function formatLobbyCodeInput(input) {
  let value = input.value;
  // Remove any non-alphanumeric characters
  value = value.replace(/[^a-zA-Z0-9]/g, '');
  // Convert to uppercase
  value = value.toUpperCase();
  // Enforce max length of 8 characters
  if (value.length > 8) {
    value = value.substring(0, 8);
  }
  input.value = value;
  
  // Clear error state when user types
  clearInputError('lobbyCodeInput');
}

/**
 * Real-time input formatting for player name field
 * Removes invalid characters as user types
 * @param {HTMLInputElement} input - The input element
 */
function formatPlayerNameInput(input) {
  let value = input.value;
  // Remove invalid characters (keep alphanumeric, spaces, hyphens, underscores)
  value = value.replace(/[^a-zA-Z0-9\s_-]/g, '');
  // Limit consecutive spaces to one
  value = value.replace(/\s{2,}/g, ' ');
  input.value = value;
  
  // Clear error state when user types
  clearInputError('playerName');
}

/**
 * Shows an error message for an input field
 * @param {string} inputId - The ID of the input element (without 'Error' suffix)
 * @param {string} errorMessage - The error message to display
 */
function showInputError(inputId, errorMessage) {
  const input = document.getElementById(inputId);
  const errorElement = document.getElementById(inputId + 'Error');
  
  debugLog('showInputError called for:', inputId);
  debugLog('Input element found:', input !== null);
  debugLog('Error element ID:', inputId + 'Error');
  debugLog('Error element found:', errorElement !== null);
  
  if (input) {
    input.classList.add('error');
    debugLog('Added error class to input');
  }
  
  if (errorElement) {
    errorElement.textContent = errorMessage;
    errorElement.classList.add('active');
    debugLog('Error element classes after adding active:', errorElement.classList.toString());
    debugLog('Error element display style:', window.getComputedStyle(errorElement).display);
  } else {
    console.error('Error element not found for ID:', inputId + 'Error');
  }
  
  debugLog('Showing error for', inputId, ':', errorMessage);
}

/**
 * Clears the error state for an input field
 * @param {string} inputId - The ID of the input element (without 'Error' suffix)
 */
function clearInputError(inputId) {
  const input = document.getElementById(inputId);
  const errorElement = document.getElementById(inputId + 'Error');
  
  if (input) {
    input.classList.remove('error');
  }
  
  if (errorElement) {
    errorElement.classList.remove('active');
  }
}
