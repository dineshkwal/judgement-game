/* ---------- SCORECARD FUNCTIONS ---------- */

function toggleScorecard() {
  const overlay = document.getElementById('scorecardOverlay');
  if (!overlay) return;
  
  const isShowing = overlay.classList.contains('show');
  
  if (isShowing) {
    overlay.classList.remove('show');
    
    // If we came from game over screen via "View Full Scorecard", go back to game over
    if (window.scoreboardFromGameOver) {
      window.scoreboardFromGameOver = false;
      // Small delay to allow the overlay to close smoothly
      setTimeout(() => {
        const sortedPlayers = [...storage.players].sort((a, b) => 
          (storage.scores[b.id] || 0) - (storage.scores[a.id] || 0)
        );
        renderFinalScorecard(sortedPlayers);
      }, 100);
    }
  } else {
    // Track scorecard opened
    Analytics.trackScorecardOpened('game');
    
    renderScorecard();
    overlay.classList.add('show');
    // Remove game-over-screen class when showing regular scorecard
    overlay.classList.remove('game-over-screen');
  }
}

function renderScorecard() {
  const content = document.getElementById('scorecardContent');
  const lobbyCodeElement = document.getElementById('scorecardLobbyCode');
  const titleElement = document.getElementById('scorecardTitle');
  
  // Remove game-over-screen class to show close button
  const overlay = document.getElementById('scorecardOverlay');
  if (overlay) {
    overlay.classList.remove('game-over-screen');
  }
  
  // Ensure title is always visible
  if (titleElement) {
    titleElement.textContent = 'Game Scoreboard';
    titleElement.style.display = 'block';
    titleElement.style.visibility = 'visible';
  }
  
  // Update lobby code if available
  if (lobbyCodeElement && storage.lobbyId) {
    lobbyCodeElement.textContent = `Lobby: ${storage.lobbyId}`;
    lobbyCodeElement.style.display = 'block';
  }
  
  // Restore close button visibility (in case it was hidden by renderFinalScorecard)
  const closeBtn = document.getElementById('closeScorecard');
  if (closeBtn) {
    closeBtn.style.display = 'block';
  }
  
  // Always show scorecard, even if no rounds completed yet
  if (!storage.players || storage.players.length === 0) {
    content.innerHTML = '<p style="text-align:center; color:#666; font-size:1.1rem;">No game in progress.</p>';
    return;
  }
  
  // Build the scorecard table with rounds as rows, players as columns
  let html = '<table><thead><tr>';
  html += '<th>Round</th>';
  
  // Add column for each player
  storage.players.forEach(player => {
    html += `<th>${player.name}</th>`;
  });
  
  html += '</tr></thead><tbody>';
  
  // Determine how many rounds to show
  const totalRounds = storage.cardsPerRound || 1;
  
  // Add row for each round (1 to totalRounds)
  for (let roundNum = 1; roundNum <= totalRounds; roundNum++) {
    html += '<tr>';
    html += `<td>Round ${roundNum}</td>`;
    
    // Find this round's data in history
    const roundData = storage.roundHistory ? storage.roundHistory.find(r => r.round === roundNum) : null;
    
    // Add cell for each player
    storage.players.forEach(player => {
      if (roundData && roundData.players[player.id]) {
        const data = roundData.players[player.id];
        const pointsClass = data.points >= 0 ? 'score-positive' : 'score-negative';
        html += `<td>`;
        html += `<div style="margin-bottom:0.5rem; color: rgba(255,255,255,0.75); font-size:1.15rem; font-weight:500;">Bid: ${data.bid}</div>`;
        html += `<div style="margin-bottom:0.5rem; color: rgba(255,255,255,0.75); font-size:1.15rem; font-weight:500;">Won: ${data.won}</div>`;
        html += `<div class="${pointsClass}" style="font-size:1.35rem; font-weight:700;">Pts: ${data.points > 0 ? '+' : ''}${data.points}</div>`;
        html += `</td>`;
      } else {
        // Round not completed yet
        html += '<td style="color: rgba(255,255,255,0.4); font-weight:500; font-size:1.6rem;">–</td>';
      }
    });
    
    html += '</tr>';
  }
  
  // Add total score row at bottom
  html += '<tr>';
  html += '<td>Total Score</td>';
  storage.players.forEach(player => {
    const totalScore = storage.scores[player.id] || 0;
    const totalClass = totalScore >= 0 ? 'score-positive' : 'score-negative';
    html += `<td class="${totalClass}">${totalScore}</td>`;
  });
  html += '</tr>';
  
  html += '</tbody></table>';
  content.innerHTML = html;
}

function renderFinalScorecard(sortedPlayers) {
  debugLog('DEBUG: renderFinalScorecard called for player:', storage.myId);
  debugLog('DEBUG: sortedPlayers:', sortedPlayers);
  
  const content = document.getElementById('scorecardContent');
  const modal = document.getElementById('scorecardModal');
  
  if(!content || !modal) {
    debugLog('ERROR: scorecardContent or scorecardModal not found!');
    return;
  }
  
  // Winner info
  const winner = sortedPlayers[0];
  const winnerScore = storage.scores[winner.id] || 0;
  
  // Build final rankings HTML - Dark Elegant + Minimal Card Design
  let html = '<div class="game-over-container">';
  
  // Header accent line
  html += '<div class="game-over-accent-line"></div>';
  
  // Status text
  html += '<div class="game-over-status">Game Complete</div>';
  
  // Winner section - Card style with border
  html += '<div class="game-over-winner-section">';
  html += '<div class="game-over-winner-label">WINNER</div>';
  html += `<div class="game-over-winner-name">${winner.name.toUpperCase()}</div>`;
  html += `<div class="game-over-winner-score">${winnerScore} points</div>`;
  html += '</div>';
  
  // Separator
  html += '<div class="game-over-separator">';
  html += '<div class="separator-line"></div>';
  html += '<span class="separator-text">Final Rankings</span>';
  html += '<div class="separator-line"></div>';
  html += '</div>';
  
  // Rankings list
  html += '<div class="game-over-rankings">';
  
  sortedPlayers.forEach((player, index) => {
    const score = storage.scores[player.id] || 0;
    const isWinner = index === 0;
    const medalClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
    
    html += `<div class="rank-item ${isWinner ? 'winner' : ''}">`;
    html += `<div class="rank-medal ${medalClass}">${index + 1}</div>`;
    html += `<span class="rank-name">${player.name}</span>`;
    html += `<span class="rank-score">${score} pts</span>`;
    html += '</div>';
  });
  
  html += '</div>';
  
  // Action buttons
  html += '<div class="game-over-actions">';
  html += '<button class="game-over-btn primary" onclick="playAgain()">Play Again</button>';
  html += `<button class="game-over-btn secondary" onclick="Analytics.trackNewGameClicked(); window.location.href = window.location.origin + window.location.pathname">New Game</button>`;
  html += '</div>';
  
  // Footer links
  html += '<div class="game-over-links">';
  html += '<button class="game-over-link" onclick="shareGameResults()">Share</button>';
  html += '<button class="game-over-link" onclick="Analytics.trackViewFullScorecard(); renderScorecard(); window.scoreboardFromGameOver = true;">Scoreboard</button>';
  html += '</div>';
  
  html += '</div>';
  
  content.innerHTML = html;
  
  // Update modal header for game over screen
  const title = document.getElementById('scorecardTitle');
  const lobbyCode = document.getElementById('scorecardLobbyCode');
  
  if (title) {
    title.style.display = 'none'; // Hide "GAME SCOREBOARD" title
  }
  
  if (lobbyCode && storage.lobbyId) {
    lobbyCode.textContent = `Lobby: ${storage.lobbyId}`;
    lobbyCode.style.display = 'block';
    lobbyCode.style.fontSize = '0.9rem';
    lobbyCode.style.marginBottom = '0.5rem';
    lobbyCode.style.color = '#4caf50';
  }
  
  // Show the overlay
  const overlay = document.getElementById('scorecardOverlay');
  if(overlay) {
    debugLog('DEBUG: Showing scorecardOverlay');
    overlay.classList.add('show');
    // Add class to hide close button for game over screen
    overlay.classList.add('game-over-screen');
  } else {
    debugLog('ERROR: scorecardOverlay not found!');
  }
  
  debugLog('DEBUG: renderFinalScorecard completed successfully');
}

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  // Close scorecard button
  const closeBtn = document.getElementById('closeScorecard');
  if (closeBtn) {
    closeBtn.addEventListener('click', toggleScorecard);
  }
  
  // Close on overlay click (but not modal click)
  const overlay = document.getElementById('scorecardOverlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target.id === 'scorecardOverlay') {
        toggleScorecard();
      }
    });
  }
});

/* ---------- SHARE GAME RESULTS ---------- */
function shareGameResults() {
  // Get sorted players by score
  const sortedPlayers = [...storage.players].sort((a, b) => {
    const scoreA = storage.scores[a.id] || 0;
    const scoreB = storage.scores[b.id] || 0;
    return scoreB - scoreA;
  });
  
  const winner = sortedPlayers[0];
  const winnerScore = storage.scores[winner.id] || 0;
  
  // Create shareable text
  let shareText = '🎮 Game of Judgement - Results 🎮\n\n';
  shareText += '🏆 WINNER: ' + winner.name.toUpperCase() + ' 🏆\n';
  shareText += `Score: ${winnerScore} points\n\n`;
  shareText += '📊 Final Rankings:\n';
  shareText += '─────────────────\n';
  
  sortedPlayers.forEach((player, index) => {
    const score = storage.scores[player.id] || 0;
    let medal = '';
    if (index === 0) medal = '🥇';
    else if (index === 1) medal = '🥈';
    else if (index === 2) medal = '🥉';
    else medal = `${index + 1}.`;
    
    shareText += `${medal} ${player.name.padEnd(20)} ${score} pts\n`;
  });
  
  shareText += '─────────────────\n';
  shareText += `\nLobby: ${storage.lobbyId}\n`;
  shareText += `Total Rounds: ${storage.round}\n\n`;
  
  const gameUrl = window.location.origin + window.location.pathname;
  shareText += `🎴 Play now: ${gameUrl}\n`;
  
  // Track share attempt
  Analytics.trackShareResults(navigator.share ? 'native_share' : 'clipboard');
  
  // Try to use native share API first (mobile-friendly)
  if (navigator.share) {
    navigator.share({
      title: 'Game of Judgement - Results',
      text: shareText
    }).then(() => {
      debugLog('Share successful');
      showShareFeedback('Shared successfully! 🎉');
    }).catch((error) => {
      debugLog('Share failed:', error);
      // Fallback to clipboard
      copyToClipboard(shareText);
    });
  } else {
    // Fallback to clipboard copy
    copyToClipboard(shareText);
  }
}

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showShareFeedback('Results copied to clipboard! 📋');
    }).catch(err => {
      console.error('Failed to copy:', err);
      // Final fallback - show text in a textarea
      showTextFallback(text);
    });
  } else {
    // Older browsers fallback
    showTextFallback(text);
  }
}

function showTextFallback(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.top = '50%';
  textarea.style.left = '50%';
  textarea.style.transform = 'translate(-50%, -50%)';
  textarea.style.width = '80%';
  textarea.style.maxWidth = '600px';
  textarea.style.height = '400px';
  textarea.style.padding = '1rem';
  textarea.style.fontSize = '0.9rem';
  textarea.style.background = '#1a1a1a';
  textarea.style.color = '#fff';
  textarea.style.border = '2px solid var(--primary)';
  textarea.style.borderRadius = '10px';
  textarea.style.zIndex = '10001';
  textarea.readOnly = true;
  
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.background = 'rgba(0,0,0,0.8)';
  overlay.style.zIndex = '10000';
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.style.position = 'fixed';
  closeBtn.style.top = '50%';
  closeBtn.style.left = '50%';
  closeBtn.style.transform = 'translate(-50%, calc(200px + 2rem))';
  closeBtn.style.padding = '0.8rem 2rem';
  closeBtn.style.fontSize = '1rem';
  closeBtn.style.background = 'var(--primary)';
  closeBtn.style.color = '#fff';
  closeBtn.style.border = 'none';
  closeBtn.style.borderRadius = '8px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.zIndex = '10001';
  
  document.body.appendChild(overlay);
  document.body.appendChild(textarea);
  document.body.appendChild(closeBtn);
  
  textarea.select();
  
  const cleanup = () => {
    document.body.removeChild(overlay);
    document.body.removeChild(textarea);
    document.body.removeChild(closeBtn);
  };
  
  closeBtn.onclick = cleanup;
  overlay.onclick = cleanup;
  
  // Try to copy to clipboard
  try {
    document.execCommand('copy');
    showShareFeedback('Results copied! You can paste it anywhere 📋');
  } catch (err) {
    console.error('Copy failed:', err);
  }
}

function showShareFeedback(message) {
  const feedback = document.createElement('div');
  feedback.textContent = message;
  feedback.style.position = 'fixed';
  feedback.style.top = '20px';
  feedback.style.left = '50%';
  feedback.style.transform = 'translateX(-50%)';
  feedback.style.padding = '1rem 2rem';
  feedback.style.background = 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)';
  feedback.style.color = '#fff';
  feedback.style.borderRadius = '10px';
  feedback.style.fontSize = '1.1rem';
  feedback.style.fontWeight = '600';
  feedback.style.boxShadow = '0 4px 20px rgba(76, 175, 80, 0.5)';
  feedback.style.zIndex = '10002';
  feedback.style.animation = 'slideDown 0.4s ease-out';
  
  document.body.appendChild(feedback);
  
  setTimeout(() => {
    feedback.style.opacity = '0';
    feedback.style.transition = 'opacity 0.3s ease-out';
    setTimeout(() => {
      document.body.removeChild(feedback);
    }, 300);
  }, 3000);
}
