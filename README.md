# Judgement - Online Multiplayer Card Game

A minimalist, intuitive online multiplayer implementation of the Judgement card game using Firebase Realtime Database.

## Features

### Core Gameplay
- **Online Multiplayer**: Real-time synchronization using Firebase Realtime Database
- **Lobby System**: Create or join games with shareable 6-character lobby IDs
- **Turn-Based Bidding**: Players bid on hands with anti-sum rule enforcement
- **Trump System**: Rotating trump suits across rounds
- **Hand-Taking**: Classic card game mechanics with lead suit and trump logic
- **Dealer Rotation**: Dealer rotates clockwise each round (indicated with 🃏)
- **Round Scoreboard**: Live tracking of Player, Hands Bid, and Hands Made
- **Full Scorecard**: Detailed round-by-round breakdown accessible via 📊 button

### Scoring System
- **Correct Bid**: 20 points + actual hands made
- **Under Bid**: 0 points (failed to make bid)
- **Over Bid**: Points equal to actual hands made (no bonus)

### UI/UX
- **Minimalist Design**: Clean, dark green felt table theme
- **10 Unique Avatars**: Dicebear API integration for player identification
- **Large Cards**: 70px × 100px cards with 4-corner labels for visibility when stacked
- **Horizontal Card Stacking**: Hand area shows cards with partial overlap (-30px margin)
- **Circular Player Layout**: Players arranged around table
- **User Info Display**: Fixed top-right avatar/name with dropdown menu
- **End Game Scorecard**: Beautiful rankings modal with medals (🥇🥈🥉) and winner congratulations
- **Responsive**: Works on desktop and mobile browsers

## Project Structure

```
Judgement_AgentMode/
├── index.html              # Main HTML structure (124 lines)
├── styles.css              # All CSS styling (529 lines)
├── js/
│   ├── config.js           # Firebase configuration
│   ├── state.js            # Global storage object
│   ├── utils.js            # Helper functions (deck, colors, screens)
│   ├── register.js         # Player registration and lobby join/create
│   ├── lobby.js            # Lobby management and Firebase listeners (223 lines)
│   ├── ui.js               # All UI rendering functions (236 lines)
│   ├── game.js             # Game logic (deal, bid, play, score) (364 lines)
│   ├── scorecard.js        # Scorecard modal and final rankings (168 lines)
│   ├── userMenu.js         # User dropdown menu handlers (40 lines)
│   └── init.js             # Initialization and event listeners
└── README.md               # This file
```

## Setup

### Prerequisites
- Python 3.x (for local testing with HTTP server)
- Modern web browser (Chrome, Firefox, Edge, Safari)
- Firebase project (configuration included)

### Running Locally

1. Open terminal in project directory
2. Start Python HTTP server:
   ```bash
   python -m http.server 8080
   ```
3. Open browser to: `http://localhost:8080`

### Firebase Configuration

The project uses Firebase Realtime Database with the following structure:
```
lobbies/
  {lobbyId}/
    players/
      {playerId}/
        - id, name, avatar, joinedAt
    game/
      - hostId, dealerId, currentBidder, currentPlayer
      - players, round, cardsPerRound, status
      - hands, trick, leadSuit, trump
      - bids, tricksWon, scores
```

Configuration is in `js/config.js` (already set up for this project).

## How to Play

### Starting a Game
1. Enter your name and select an avatar
2. Click "Join Game" to create a new lobby
3. Share the lobby link with friends (or send them the 6-character code)
4. Select who should start as the first player (host)
5. Click "Start Game"

### Gameplay
1. **Deal Phase**: Dealer clicks "Deal Cards" to distribute cards
2. **Bidding Phase**: Players take turns bidding (starting clockwise from dealer)
   - Last bidder cannot make total bids equal total hands (anti-sum rule)
3. **Playing Phase**: Players play cards in turn
   - First player of each hand leads any card
   - **Follow-Suit Rule**: Must play lead suit if you have it
   - Cards that cannot be legally played are grayed out and disabled
   - Hand winner leads next hand
   - Trump beats lead suit, lead suit beats off-suit
4. **Scoring**: 
   - Correct bid: 20 points + hands made
   - Under bid (made fewer than bid): 0 points
   - Over bid (made more than bid): points equal to hands made
5. **Next Round**: Dealer rotates, cards decrease by one per round
6. **End Game**: Beautiful scorecard displays rankings with medals for top 3 players

### Scorecard
- **Round Scoreboard**: Shows Hands Bid and Hands Made for current round (no score column)
- **Full Scorecard**: Click 📊 button to view detailed round-by-round breakdown
- **End Game Rankings**: Automatic display at game end with winner congratulations and medals

### User Menu
- Click avatar in top-right to access dropdown
- **Leave Game**: Exit current lobby
- **New Game**: Reset and start fresh

## Game Rules

### Follow-Suit Rule
When a lead suit has been played in a hand:
- **Have lead suit cards**: You MUST play a card of the lead suit (grayed out cards cannot be played)
- **No lead suit cards**: You can play any card (trump to win, or discard)
- **Leading a hand**: You can play any card from your hand

### Anti-Sum Rule
The last player to bid cannot choose a value that makes the total bids equal the total hands available in that round. This ensures someone must fail their bid.

### Hand Resolution
- Trump suit cards beat all other suits
- Among trump cards or lead suit cards, highest value wins
- Off-suit cards (not trump, not lead suit) cannot win
- Hand winner leads the next hand

### Card Values
A=1, 2-10=face value, J=11, Q=12, K=13

## Recent Improvements

### Bug Fixes
- ✅ **Bidding Bug**: Fixed issue where only one player would bid in round 2+ (Firebase empty object normalization)
- ✅ **Scorecard Reset**: Fixed scorecard not resetting between rounds (explicit null checks)
- ✅ **Card Disabling Bug**: Fixed cards staying disabled after winning a hand (cardPlaying flag clearing)
- ✅ **User Menu Dropdown**: Fixed dropdown not appearing (restructured HTML to prevent double-toggle)

### UI/UX Enhancements
- ✅ **Terminology Update**: Changed "trick" to "hand" throughout user-facing text
- ✅ **Simplified Scoreboard**: Removed Score column from round scoreboard (only shows Hands Bid/Made)
- ✅ **End Game Experience**: No more annoying alerts - beautiful modal with rankings instead
- ✅ **Medal System**: Top 3 players get 🥇🥈🥉 with gradient backgrounds

### Code Quality
- ✅ **Removed Debug Logs**: Cleaned up console.log statements
- ✅ **Code Organization**: Maintained clean modular architecture
- ✅ **Firebase Handling**: Proper null handling for empty objects

## Future Enhancements

- [ ] Visual turn indicator on table
- [ ] Sound effects and animations
- [ ] Game history and statistics
- [ ] Deploy to internet hosting (Firebase Hosting, Netlify, or Vercel)
- [ ] Multiple concurrent game rooms
- [ ] Spectator mode

## Known Issues

All major issues resolved! 🎉

## Development Notes

This project was recently restructured from a monolithic 918-line HTML file into modular JavaScript files for better maintainability and debugging. The modular architecture follows separation of concerns:
- Configuration → State → Utilities → Registration → Lobby → UI → Game Logic → User Menu → Initialization

## Credits

- **Card Game**: Traditional Judgement/Oh Hell rules
- **Avatars**: [Dicebear Avatars API](https://dicebear.com/)
- **Backend**: [Firebase Realtime Database](https://firebase.google.com/)
- **Design**: Minimalist green felt table aesthetic

## License

MIT License - feel free to use, modify, and distribute.

---

**Note**: This is an educational project demonstrating real-time multiplayer game implementation with Firebase. For production use, consider adding authentication, game room limits, and proper error handling.
