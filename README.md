# Judgement Card Game - Online Multiplayer

A minimalist, intuitive online multiplayer implementation of the Judgement card game using Firebase Realtime Database.

## Features

### Core Gameplay
- **Online Multiplayer**: Real-time synchronization using Firebase Realtime Database
- **Lobby System**: Create or join games with shareable 6-character lobby IDs
- **Turn-Based Bidding**: Players bid on tricks with anti-sum rule enforcement
- **Trump System**: Rotating trump suits across rounds
- **Trick-Taking**: Classic card game mechanics with lead suit and trump logic
- **Dealer Rotation**: Dealer rotates clockwise each round (indicated with 🃏)
- **Scoreboard**: Live tracking of Player, Bid, Won tricks, and Score

### UI/UX
- **Minimalist Design**: Clean, dark green felt table theme
- **10 Unique Avatars**: Dicebear API integration for player identification
- **Large Cards**: 70px × 100px cards with 4-corner labels for visibility when stacked
- **Horizontal Card Stacking**: Trick area shows cards with partial overlap (-30px margin)
- **Circular Player Layout**: Players arranged around table
- **User Info Display**: Fixed top-right avatar/name with dropdown menu
- **Responsive**: Works on desktop and mobile browsers

## Project Structure

```
Judgement_AgentMode/
├── index.html              # Main HTML structure (96 lines)
├── styles.css              # All CSS styling (350+ lines)
├── js/
│   ├── config.js           # Firebase configuration
│   ├── state.js            # Global storage object
│   ├── utils.js            # Helper functions (deck, colors, screens)
│   ├── register.js         # Player registration and lobby join/create
│   ├── lobby.js            # Lobby management and Firebase listeners
│   ├── ui.js               # All UI rendering functions
│   ├── game.js             # Game logic (deal, bid, play, score)
│   ├── userMenu.js         # User dropdown menu handlers
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
   - Last bidder cannot make total bids equal total tricks (anti-sum rule)
3. **Playing Phase**: Players play cards in turn
   - First player of each trick leads any card
   - **Follow-Suit Rule**: Must play lead suit if you have it
   - Cards that cannot be legally played are grayed out and disabled
   - Trick winner leads next trick
   - Trump beats lead suit, lead suit beats off-suit
4. **Scoring**: Currently tracks tricks won (full scoring system pending)
5. **Next Round**: Dealer rotates, cards decrease by one per round

### User Menu
- Click avatar in top-right to access dropdown
- **Leave Game**: Exit current lobby
- **New Game**: Reset and start fresh

## Game Rules

### Follow-Suit Rule
When a lead suit has been played in a trick:
- **Have lead suit cards**: You MUST play a card of the lead suit (grayed out cards cannot be played)
- **No lead suit cards**: You can play any card (trump to win, or discard)
- **Leading a trick**: You can play any card from your hand

### Anti-Sum Rule
The last player to bid cannot choose a value that makes the total bids equal the total tricks available in that round. This ensures someone must fail their bid.

### Trick Resolution
- Trump suit cards beat all other suits
- Among trump cards or lead suit cards, highest value wins
- Off-suit cards (not trump, not lead suit) cannot win
- Trick winner leads the next trick

### Card Values
A=1, 2-10=face value, J=11, Q=12, K=13

## Future Enhancements

- [ ] Full scoring system (10 + tricks if bid met, -abs(bid-won) if missed)
- [x] Follow-suit enforcement with visual indicators
- [ ] Visual turn indicator on table
- [ ] End game summary modal with final scores
- [ ] Remove debug console.logs
- [ ] Deploy to internet hosting (Firebase Hosting, Netlify, or GitHub Pages)
- [ ] Sound effects and animations
- [ ] Game history and statistics
- [ ] Multiple game rooms/lobbies

## Known Issues

- ~~**Trick Resolution Bug**: After all players play cards in a trick, the table sometimes doesn't clear visually~~ **FIXED**
  - Solution: Added manual UI refresh and preserved trick div across table re-renders

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
