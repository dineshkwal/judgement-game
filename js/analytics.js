/**
 * Analytics Module
 * Handles Google Analytics 4 event tracking
 */

const Analytics = {
  /**
   * Track page view
   * @param {string} pageName - Name of the page/screen
   */
  trackPageView(pageName) {
    if (typeof gtag === 'function') {
      gtag('event', 'page_view', {
        page_title: pageName,
        page_location: window.location.href
      });
    }
  },

  /**
   * Track lobby creation
   * @param {string} lobbyCode - The generated lobby code
   * @param {number} rounds - Number of rounds selected
   */
  trackLobbyCreated(lobbyCode, rounds) {
    if (typeof gtag === 'function') {
      gtag('event', 'lobby_created', {
        lobby_code: lobbyCode,
        rounds: rounds,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Track lobby join
   * @param {string} lobbyCode - The joined lobby code
   * @param {number} playerCount - Number of players in lobby after join
   */
  trackLobbyJoined(lobbyCode, playerCount) {
    if (typeof gtag === 'function') {
      gtag('event', 'lobby_joined', {
        lobby_code: lobbyCode,
        player_count: playerCount,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Track game start
   * @param {string} lobbyCode - The lobby code
   * @param {number} playerCount - Number of players in game
   * @param {number} rounds - Number of rounds
   */
  trackGameStarted(lobbyCode, playerCount, rounds) {
    if (typeof gtag === 'function') {
      gtag('event', 'game_started', {
        lobby_code: lobbyCode,
        player_count: playerCount,
        rounds: rounds,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Track game completion
   * @param {string} lobbyCode - The lobby code
   * @param {number} playerCount - Number of players
   * @param {number} rounds - Number of rounds played
   * @param {number} durationMinutes - Game duration in minutes
   */
  trackGameCompleted(lobbyCode, playerCount, rounds, durationMinutes) {
    if (typeof gtag === 'function') {
      gtag('event', 'game_completed', {
        lobby_code: lobbyCode,
        player_count: playerCount,
        rounds: rounds,
        duration_minutes: durationMinutes,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Track game abandonment (player leaves before completion)
   * @param {string} lobbyCode - The lobby code
   * @param {number} roundNumber - Round when player left
   * @param {number} totalRounds - Total rounds in game
   */
  trackGameAbandoned(lobbyCode, roundNumber, totalRounds) {
    if (typeof gtag === 'function') {
      gtag('event', 'game_abandoned', {
        lobby_code: lobbyCode,
        round_number: roundNumber,
        total_rounds: totalRounds,
        completion_percentage: Math.round((roundNumber / totalRounds) * 100),
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Track custom scoring rule selection
   * @param {string} ruleName - Name of the scoring rule selected
   */
  trackScoringRuleSelected(ruleName) {
    if (typeof gtag === 'function') {
      gtag('event', 'scoring_rule_selected', {
        rule_name: ruleName,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Track avatar selection
   * @param {string} avatarStyle - Style of avatar (adventurer, notionists, lorelei)
   * @param {string} avatarName - Name of the avatar
   */
  trackAvatarSelected(avatarStyle, avatarName) {
    if (typeof gtag === 'function') {
      gtag('event', 'avatar_selected', {
        avatar_style: avatarStyle,
        avatar_name: avatarName,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Track errors
   * @param {string} errorType - Type of error
   * @param {string} errorMessage - Error message
   */
  trackError(errorType, errorMessage) {
    if (typeof gtag === 'function') {
      gtag('event', 'error_occurred', {
        error_type: errorType,
        error_message: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Track scorecard button click
   * @param {string} context - Where scorecard was opened from (game, lobby, etc.)
   */
  trackScorecardOpened(context) {
    if (typeof gtag === 'function') {
      gtag('event', 'scorecard_opened', {
        context: context,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Track user menu toggle
   */
  trackUserMenuOpened() {
    if (typeof gtag === 'function') {
      gtag('event', 'user_menu_opened', {
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Track emoji reaction sent
   * @param {string} emoji - The emoji that was sent
   */
  trackEmojiReaction(emoji) {
    if (typeof gtag === 'function') {
      gtag('event', 'emoji_reaction_sent', {
        emoji: emoji,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Track share button click from game over screen
   * @param {string} method - Share method used (native_share, clipboard)
   */
  trackShareResults(method) {
    if (typeof gtag === 'function') {
      gtag('event', 'share_results_clicked', {
        share_method: method,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Track view full scorecard button from game over screen
   */
  trackViewFullScorecard() {
    if (typeof gtag === 'function') {
      gtag('event', 'view_full_scorecard_clicked', {
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Track play again button from game over screen
   */
  trackPlayAgainClicked() {
    if (typeof gtag === 'function') {
      gtag('event', 'play_again_clicked', {
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Track new game button from game over screen
   */
  trackNewGameClicked() {
    if (typeof gtag === 'function') {
      gtag('event', 'new_game_clicked', {
        timestamp: new Date().toISOString()
      });
    }
  }
};
