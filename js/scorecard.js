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
  
  // Build final rankings HTML
  let html = '<div style="text-align:center; margin-bottom:2rem;">';
  html += '<h1 style="font-size:3rem; margin:0; color:var(--accent); text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">🎉 Game Over! 🎉</h1>';
  
  // Winner announcement
  const winner = sortedPlayers[0];
  const winnerScore = storage.scores[winner.id] || 0;
  html += `<h2 style="font-size:2rem; margin:1.5rem 0 0.5rem 0; color:#FFD700;">CONGRATULATIONS</h2>`;
  html += `<h2 style="font-size:2rem; margin:0.5rem 0 1rem 0; color:#7FFF7F; text-shadow: 0 0 20px rgba(127,255,127,0.8), 0 0 40px rgba(76,175,80,0.6), 2px 2px 4px rgba(0,0,0,0.5);">🏆 ${winner.name.toUpperCase()} 🏆</h2>`;
  html += `<p style="font-size:1.3rem; color:#888;">Winner with ${winnerScore} points</p>`;
  html += '</div>';
  
  // Rankings table
  html += '<div style="max-width:600px; margin:0 auto 2rem;">';
  html += '<h3 style="text-align:center; font-size:1.8rem; margin-bottom:1.5rem; color:#fff;">Final Rankings</h3>';
  html += '<table style="width:100%; border-collapse:separate; border-spacing:0 0.5rem;">';
  
  sortedPlayers.forEach((player, index) => {
    const score = storage.scores[player.id] || 0;
    let rankStyle = '';
    let rankEmoji = '';
    
    if (index === 0) {
      rankStyle = 'background:linear-gradient(135deg, #FFD700, #FFA500); color:#000; font-weight:bold;';
      rankEmoji = '🥇';
    } else if (index === 1) {
      rankStyle = 'background:linear-gradient(135deg, #C0C0C0, #808080); color:#000; font-weight:bold;';
      rankEmoji = '🥈';
    } else if (index === 2) {
      rankStyle = 'background:linear-gradient(135deg, #CD7F32, #8B4513); color:#fff; font-weight:bold;';
      rankEmoji = '🥉';
    } else {
      rankStyle = 'background:rgba(255,255,255,0.05);';
    }
    
    html += `<tr style="${rankStyle}">`;
    html += `<td style="padding:1rem 1.5rem; font-size:1.5rem; text-align:center; border-radius:10px 0 0 10px;">${rankEmoji || (index + 1)}</td>`;
    html += `<td style="padding:1rem 1.5rem; font-size:1.3rem;">${player.name}</td>`;
    html += `<td style="padding:1rem 1.5rem; font-size:1.3rem; text-align:right; border-radius:0 10px 10px 0; font-weight:bold;">${score} pts</td>`;
    html += '</tr>';
  });
  
  html += '</table>';
  html += '</div>';
  
  // Game summary button
  html += '<div style="text-align:center; margin-top:2rem;">';
  html += '<button onclick="renderScorecard(); window.scoreboardFromGameOver = true;" style="padding:1rem 2rem; font-size:1.2rem; background:var(--accent); color:white; border:none; border-radius:10px; cursor:pointer; margin-right:1rem;">View Full Scoreboard</button>';
  html += '<button onclick="window.location.href = window.location.origin + window.location.pathname" style="padding:1rem 2rem; font-size:1.2rem; background:#666; color:white; border:none; border-radius:10px; cursor:pointer;">New Game</button>';
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
    lobbyCode.style.fontSize = '1.2rem';
    lobbyCode.style.marginBottom = '1rem';
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
