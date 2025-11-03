# Game of Judgement - Online Multiplayer Card Game

A polished, real-time multiplayer implementation of the Judgement (Oh Hell) card game with Firebase Realtime Database, featuring a modern UI, player reconnection system, and comprehensive game state management.

## ✨ Features

### Core Gameplay
- **Real-Time Multiplayer**: Instant synchronization using Firebase Realtime Database
- **Smart Lobby System**: Create or join games with shareable 6-character lobby codes (case-insensitive)
- **Random Dealer Selection**: Starting dealer randomly chosen each game for fairness
- **Turn-Based Bidding**: Players bid on hands with anti-sum rule enforcement
- **Trump System**: Rotating trump suits across rounds
- **Hand-Taking Logic**: Classic trick-taking mechanics with lead suit and trump rules
- **Automatic Dealer Rotation**: Dealer rotates clockwise each round (indicated with 🃏)
- **Live Scoreboard**: Real-time tracking of Player, Hands Bid, and Hands Made
- **Game Scoreboard**: Detailed round-by-round breakdown accessible via scoreboard icon
- **Configurable Rounds**: Choose starting number of cards (1-26 based on player count)

### Player Experience
- **Reconnection System**: Firebase Presence-based disconnection detection
  - Automatic reconnection when players return
  - 120-second grace period with countdown timer
  - Modal with "Dismiss" and "Continue Without Player" options
  - Only shown during active gameplay (not in lobby)
- **Auto-Rejoin**: Players can return to their game after accidental disconnect or page refresh
- **Avatar Selection**: 10 unique avatars with horizontal scrollable picker and navigation arrows
- **Personalized Messages**: Shows actual player names instead of generic "dealer" text

### Scoring System
- **Correct Bid**: 20 points + actual hands made
- **Under Bid**: 0 points (failed to make bid)
- **Over Bid**: Points equal to actual hands made (no bonus)
- **Winner Determination**: Highest total score at game end

### UI/UX Design
- **Modern Design**: Glass-morphism effects with backdrop blur and gradient backgrounds
- **Responsive Layout**: Works seamlessly on desktop and mobile browsers
- **Clean Card Design**: Large, readable cards (90px × 130px) with 4-corner labels
- **Smart Card Display**: Horizontal scrollable hand with smooth overflow
- **Circular Table Layout**: Players arranged around realistic green felt table
- **Fixed Top Bar**: Game info, round status, and user menu always accessible
- **Visual Feedback**: Hover effects, active turn indicators, and smooth animations
- **End Game Rankings**: Beautiful modal with medals (🥇🥈🥉) and congratulations
- **Footer**: "Made with ❤️" on registration and lobby screens with heartbeat animation

## 📁 Project Structure

```
GameOfJudgement/
├── index.html              # Main HTML structure (196 lines)
├── styles.css              # Complete CSS styling (2,426 lines)
├── assets/
│   └── score-icon.svg      # Scoreboard button icon
├── js/
│   ├── config.js           # Firebase configuration (13 lines)
│   ├── state.js            # Global state + Firebase Presence system (320 lines)
│   ├── utils.js            # Helper functions (deck, colors, screens) (23 lines)
│   ├── register.js         # Player registration and lobby creation (46 lines)
│   ├── lobby.js            # Lobby management and game initialization (357 lines)
│   ├── ui.js               # All UI rendering functions (430 lines)
│   ├── game.js             # Core game logic (deal, bid, play, score) (536 lines)
│   ├── scorecard.js        # Scorecard modal and rankings (186 lines)
│   ├── userMenu.js         # User dropdown menu handlers (36 lines)
│   └── init.js             # App initialization and auto-rejoin (225 lines)
├── README.md               # This file (192 lines)
└── CNAME                   # Custom domain configuration
```

**Total: 4,986 lines of code** (excluding README)

## 🚀 Setup & Installation

### Prerequisites
- Python 3.x (for local testing with HTTP server)
- Modern web browser (Chrome, Firefox, Edge, Safari recommended)
- Firebase project (configuration already included)

### Running Locally

1. Clone or download this repository
2. Open terminal in project directory
3. Start Python HTTP server:
   ```bash
   python -m http.server 8000
   ```
4. Open browser to: `http://localhost:8000`
5. Share the lobby code or full URL with friends to join your game

### Firebase Configuration

The project uses Firebase Realtime Database with the following structure:
```
lobbies/
  {lobbyId}/
    players/
      {playerId}/
        - id, name, avatar, joinedAt, lastSeen, status
    game/
      - hostId, dealerId, currentBidder, currentPlayer
      - players, round, cardsPerRound, status
      - hands, trick, leadSuit, trump
      - bids, tricksWon, scores
```

**Firebase Presence System:**
- `status`: 'online' or 'offline' for each player
- `onDisconnect()`: Automatic status updates when connection lost
- `beforeunload`: Catches tab close, back button, navigation
- Real-time monitoring with 120-second reconnection grace period

Configuration is in `js/config.js` (already configured for this project).

## 🎮 How to Play

### Starting a Game
1. **Enter Details**: Type your name and select an avatar from the picker
2. **Create/Join Lobby**: Click "Create Lobby" or enter existing lobby code
3. **Share Code**: Share the 6-character code or copy the full URL
4. **Wait for Players**: Minimum 2 players required to start
5. **Configure Game**: Select starting number of cards (default is maximum)
6. **Start Game**: Host clicks "START GAME" (dealer chosen randomly)

### Gameplay Flow
1. **Deal Phase**: 
   - Dealer clicks "Deal Cards" to distribute cards to all players
   - Each player receives cards equal to current round number
   
2. **Bidding Phase**: 
   - Players bid clockwise starting from the player after dealer
   - Bid represents how many hands you think you'll win
   - **Anti-Sum Rule**: Last bidder cannot make total bids equal total hands
   - Invalid bids are disabled automatically
   
3. **Playing Phase**: 
   - First player leads with any card
   - **Follow-Suit Rule**: Must play lead suit if you have it
   - Cards you cannot legally play are grayed out and disabled
   - Highest trump wins; if no trump, highest lead suit wins
   - Hand winner leads the next hand
   - Continue until all cards played
   
4. **Scoring**: 
   - **Made exact bid**: 20 + bid value (e.g., bid 3, made 3 = 23 points)
   - **Under bid**: 0 points (bid 3, made 2 = 0 points)
   - **Over bid**: Only actual hands made (bid 3, made 4 = 4 points)
   - Scores accumulate across rounds
   
5. **Next Round**: 
   - Dealer rotates clockwise (🃏 indicator)
   - Cards decrease by one per round
   - Trump suit rotates (♠️ → ♥️ → ♦️ → ♣️)
   
6. **End Game**: 
   - Game ends when cards reach zero
   - Beautiful modal displays final rankings
   - Top 3 players get medals (🥇🥈🥉)
   - Winner gets special congratulations message

### Scoreboard & Stats
- **Round Scoreboard**: Click scoreboard icon to view current standings
- **Live Updates**: Hands Bid and Hands Made update in real-time
- **Historical Data**: See all previous rounds' bids and results
- **Final Rankings**: Automatic display with sorted positions at game end

### User Menu Features
- **Avatar Display**: Click your avatar in top-right corner
- **Leave Game**: Exit current lobby (doesn't end game for others)
- **New Game**: Reset everything and return to registration

## 📖 Game Rules

### Follow-Suit Rule
When a lead suit has been played in a hand:
- **Have lead suit**: You MUST play a card of the lead suit (other cards grayed out)
- **No lead suit**: You can play any card (trump to win, or discard)
- **Leading a hand**: You can play any card from your hand (no restrictions)

### Anti-Sum Rule
The last player to bid cannot choose a value that makes the total bids equal the total hands available in that round. This ensures at least one player must fail their bid, adding strategic depth.

**Example:** 4 players, 5 cards each = 5 total hands
- Player 1 bids: 2
- Player 2 bids: 1  
- Player 3 bids: 1
- Player 4 (last) cannot bid: 1 (because 2+1+1+1=5)
- Player 4 can bid: 0, 2, 3, 4, or 5

### Hand Resolution Priority
1. **Trump suit** beats all other suits (highest trump wins)
2. **Lead suit** beats off-suits if no trump played (highest lead suit wins)
3. **Off-suit cards** cannot win (even if higher value)
4. **Hand winner** leads the next hand

### Card Values (High to Low)
- Ace (A) = 14 (highest)
- King (K) = 13
- Queen (Q) = 12
- Jack (J) = 11
- 10-2 = Face value

### Strategic Tips
- **Bid conservatively** early in the round (exact bids are hard!)
- **Track trump cards** played to assess winning chances
- **Lead with low cards** when you've made your bid
- **Watch the anti-sum rule** when bidding last
- **Remember dealer rotates** - your position changes each round

## 🔧 Technical Architecture

### Firebase Presence System
**Problem Solved:** Previous heartbeat-based system had false positives (modal after every card play)

**Current Implementation:**
- `onDisconnect()`: Firebase native presence detection
- `beforeunload`: Catches tab close, navigation, back button
- `navigator.sendBeacon()`: Synchronous status updates on page unload
- Page Visibility API: Handles tab switching
- Status field: 'online' / 'offline' for each player
- Real-time monitoring: Only during active gameplay (not lobby)
- 120-second grace period: Countdown with dismiss/remove options

**Benefits:**
- Event-driven (no polling)
- No false positives
- Battery efficient
- Native Firebase reliability

### Code Architecture
**Modular Design** following separation of concerns:
```
Configuration (config.js)
    ↓
State Management (state.js) + Firebase Presence
    ↓
Utilities (utils.js) → Helper functions
    ↓
Registration (register.js) → Player onboarding
    ↓
Lobby (lobby.js) → Game setup & Firebase listeners
    ↓
UI Layer (ui.js) → Rendering & display
    ↓
Game Logic (game.js) → Core mechanics
    ↓
Scorecard (scorecard.js) → Rankings & history
    ↓
User Menu (userMenu.js) → Navigation
    ↓
Initialization (init.js) → App bootstrap & auto-rejoin
```

### Key Components

**state.js** (320 lines)
- Global storage object with game state
- Firebase Presence system (setupPresence, stopPresence)
- Reconnection modal management
- Player connection monitoring
- Auto-reconnect detection

**game.js** (536 lines)
- Deal cards logic with shuffling
- Bidding system with anti-sum validation
- Play card mechanics with follow-suit enforcement
- Hand winner determination
- Score calculation and round progression

**lobby.js** (357 lines)
- Firebase listeners for players and game state
- Lobby management (create, join, leave)
- Random dealer selection
- Game initialization
- Case-insensitive lobby code handling

**ui.js** (430 lines)
- Dynamic DOM updates
- Seat positioning around circular table
- Card rendering and animation
- Scoreboard display
- Turn indicators and messages

**init.js** (225 lines)
- App initialization on load
- Auto-rejoin logic using localStorage
- URL parameter parsing for direct joins
- Player session restoration

## 🎨 UI/UX Highlights

### Visual Design
- **Glass-morphism**: `backdrop-filter: blur()` with rgba backgrounds
- **Gradients**: Smooth color transitions throughout
- **Shadows**: Multi-layer box-shadows for depth
- **Animations**: Smooth transitions, hover effects, heartbeat, float
- **Responsive**: Mobile-first with media queries

### User Experience
- **Smart Card Disabling**: Invalid plays grayed out automatically
- **Active Turn Indicator**: Gold glow with pulsing animation
- **Horizontal Scrolling**: Smooth card hand with custom scrollbar
- **Avatar Picker**: Horizontal scroll with navigation arrows
- **Copy Link Button**: One-click lobby sharing with feedback
- **Modal System**: Non-blocking overlays for scorecard and reconnection
- **Footer**: Consistent branding with heartbeat animation

### Accessibility
- Keyboard-focusable elements
- High contrast text and borders
- Clear visual feedback on interactions
- Readable font sizes (16px+ base)
- Color-blind friendly (not relying solely on color)

## 🐛 Recent Bug Fixes & Improvements

### Major Fixes
✅ **Firebase Presence System** - Replaced heartbeat polling to eliminate false positive disconnections  
✅ **Case-Insensitive Lobbies** - Uppercase normalization for all lobby codes  
✅ **Bidding Bug** - Fixed Firebase empty object normalization causing single-player bidding  
✅ **Scorecard Reset** - Proper null checks prevent stale data between rounds  
✅ **Card Disabling** - Fixed cards staying disabled after winning a hand  
✅ **User Menu Dropdown** - Restructured HTML to prevent double-toggle issues  
✅ **Reconnection Modal** - Only shows during active game (not lobby), auto-hides on reconnect  

### UX Enhancements
✅ **Removed "Select Starting Player"** - Random dealer selection for fairness  
✅ **Terminology Update** - Changed "trick" to "hand" in user-facing text  
✅ **Simplified Scoreboard** - Removed confusing score column from live view  
✅ **End Game Modal** - No more alerts, beautiful rankings with medals  
✅ **Lobby Styling** - Consistent glass-morphism design across all screens  
✅ **Footer Visibility** - Unified footer on register and lobby screens  
✅ **Personalized Messages** - Shows actual player names instead of "dealer"  
✅ **Game Header** - Conditional display when single player waiting  

### Code Quality
✅ **Removed Debug Logs** - Cleaned up console statements  
✅ **Modular Architecture** - Maintained clean separation of concerns  
✅ **Firebase Handling** - Proper null checks and error handling  
✅ **Comment Cleanup** - Removed outdated TODOs and debug comments  

## 📝 Development Notes

### Project Evolution
This project started as a monolithic 918-line HTML file and was refactored into a modular architecture with 10 JavaScript files totaling ~2,200 lines. The restructuring significantly improved:
- **Maintainability**: Easy to locate and fix bugs
- **Debuggability**: Clear stack traces and isolated concerns
- **Scalability**: Easy to add new features
- **Collaboration**: Multiple developers can work simultaneously

### Performance Considerations
- Firebase listeners efficiently scoped to minimize data transfer
- Card shuffling uses Fisher-Yates algorithm (O(n))
- DOM updates batched where possible
- Event listeners properly cleaned up to prevent memory leaks

### Browser Compatibility
Tested and working on:
- ✅ Chrome 90+ (desktop & mobile)
- ✅ Firefox 88+ (desktop & mobile)
- ✅ Safari 14+ (desktop & mobile)
- ✅ Edge 90+

## 🚀 Future Enhancements

### Planned Features
- [ ] **Sound Effects**: Card dealing, bidding, winning sounds
- [ ] **Animations**: Card flip, fly-to-center, trick collection
- [ ] **Game Statistics**: Personal win/loss record, average scores
- [ ] **Game History**: Review past games with full play-by-play
- [ ] **Spectator Mode**: Watch live games without participating
- [ ] **Chat System**: In-game text chat between players
- [ ] **Custom Avatars**: Upload personal images or use Gravatar
- [ ] **Tournaments**: Multi-game series with leaderboards
- [ ] **AI Players**: Computer opponents for solo practice
- [ ] **Rule Variants**: Different scoring systems and gameplay modes

### Deployment Options
- **Firebase Hosting**: Single command deployment (`firebase deploy`)
- **Netlify**: Drag-and-drop with automatic SSL
- **Vercel**: Git integration with preview deployments
- **GitHub Pages**: Free hosting with custom domain support

### Security Improvements
- [ ] Firebase Authentication (Google, Email/Password)
- [ ] Rate limiting on lobby creation
- [ ] Game room expiration (auto-cleanup after 24h)
- [ ] Profanity filter for player names
- [ ] Kick/ban functionality for lobby hosts

## ❓ Known Issues

All major issues resolved! 🎉

Minor polish opportunities:
- Loading state during initial Firebase connection
- Network error handling UI
- Offline mode detection
- Game pause/resume functionality

## 📚 Resources & Credits

### Technologies Used
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Backend**: Firebase Realtime Database
- **Avatars**: [Dicebear Avatars API](https://dicebear.com/) (Adventurer style)
- **Icons**: Custom SVG (scorecard icon)
- **Fonts**: Google Fonts (Poppins)

### Game Rules
Based on the traditional **Judgement** (also known as **Oh Hell**, **Oh Pshaw**, **Nomination Whist**) card game. Rules adapted from standard trick-taking card game conventions with anti-sum bidding rule.

### Inspiration
This project was built to explore:
- Real-time multiplayer game synchronization
- Firebase Presence and connection state management  
- Modular JavaScript architecture
- Glass-morphism UI design
- Responsive game layouts

## 📄 License

MIT License - free to use, modify, and distribute.

```
Copyright (c) 2025 Game of Judgement

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs via GitHub Issues
- Submit pull requests for bug fixes
- Propose new features or enhancements
- Improve documentation
- Share your game experiences

---

**Built with ❤️ for card game enthusiasts**

*Last Updated: November 2025*