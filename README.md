# Game of Judgement

A polished, real-time multiplayer implementation of **Judgement** (also known as *Oh Hell*, *Oh Pshaw*, *Kachuful*, *Nomination Whist*) — a trick-taking card game where you score by **predicting exactly** how many hands you'll win each round.

🎮 **Play now:** [gameofjudgement.com](https://gameofjudgement.com)

Built with vanilla JavaScript and Firebase Realtime Database. No build step, no framework — just static files served from GitHub Pages.

---

## ✨ Features

### Gameplay
- **Real-time multiplayer** — instant state sync across all players via Firebase Realtime Database
- **Lobby system** — create or join with a shareable, case-insensitive 6-character code (or a direct join URL)
- **Tabbed onboarding** — Create / Join tabs, name entry, and a 10-avatar picker ([DiceBear](https://dicebear.com) Adventurer)
- **Random + rotating dealer** — starting dealer is random for fairness; dealer rotates clockwise each round (🃏)
- **Turn-based bidding** with the **anti-sum rule** — the last bidder can't make total bids equal total hands, guaranteeing someone fails
- **Trick play** — follow-suit enforcement (illegal cards are disabled), trump resolution, hand-winner leads next
- **Rotating trump** each round (♠️ → ♥️ → ♦️ → ♣️)
- **Configurable rounds** — host picks the starting card count; cards decrease by one each round down to zero

### Scoring
Classic scoring (the active ruleset):
- **Exact bid:** +20 points
- **Under bid:** 0 points
- **Over bid:** points equal to hands actually won

> Alternative scoring presets (High Stakes / Aggressive / Casual) are scaffolded in `js/config.js` but not yet wired into gameplay — see [Roadmap](#-roadmap).

### Scoreboards & rankings
- **Live scoreboard** during play (player, hands bid, hands made, trump)
- **Detailed scorecard modal** — round-by-round bids, results, and points
- **End-game rankings** — animated modal with medals (🥇🥈🥉) and a winner callout

### Players & hosting
- **Host controls** (lobby creator only):
  - **Kick from lobby** — remove a player before the game starts
  - **Manage Players (in-game)** — modal to remove a player mid-game; the existing leave-handling pipeline advances turns / reassigns the dealer so the round never stalls
  - **Reset to Lobby** — send everyone back to the lobby, keeping the group together
  - **New Game** — end the current game for everyone
- **Leave Game** (any player) — exit while the game continues for the rest
- **Reconnection** — Firebase presence (`onDisconnect`, `beforeunload`, `sendBeacon`, Page Visibility) tracks online/offline status with a grace period
- **Auto-rejoin** — a resume banner restores your session after a refresh or accidental disconnect (via `localStorage`)

### Polish
- **Glass-morphism UI** — frosted gradients, blur, layered shadows; a circular green-felt table
- **Sound effects** — dealing, playing, bidding, trick/round/game completion, lobby & start cues (toggleable)
- **"Your turn" voice** — optional spoken turn prompt (toggleable)
- **Larger-text mode** — accessibility UI-scale toggle
- **Emoji reactions** — a 7-emoji reaction bar broadcast to the table in real time
- **Responsive + iOS fixes** — works across desktop and mobile browsers
- **Options modal** — sound, voice, and text-size settings in one place
- **SEO & sharing** — Open Graph / Twitter cards, JSON-LD structured data, canonical URL, `robots.txt`, `sitemap.xml`, full favicon set
- **Analytics** — Google Analytics 4 event tracking

---

## 🎮 How to Play

1. **Register** — pick a name and avatar; **Create Lobby** or **Join** with a code.
2. **Lobby** — share the code; the host picks the starting card count and starts (2+ players).
3. **Deal** — the dealer deals; everyone gets cards equal to the round number.
4. **Bid** — clockwise from the player after the dealer, predict how many hands you'll win. The last bidder is bound by the **anti-sum rule**.
5. **Play** — lead any card; others must **follow suit** if able. Highest trump wins, else highest lead suit. Winner leads next.
6. **Score** — exact = +20, under = 0, over = hands won. Repeat with one fewer card and the next trump.
7. **Win** — when cards reach zero, highest total score takes it. 🥇

### Rules reference

**Follow-suit** — if a lead suit is set and you hold it, you must play it (other cards are disabled). No lead suit → play anything. Leading → play anything.

**Anti-sum rule** — the last player to bid may not choose a value that makes total bids equal the total hands in the round. *Example:* 4 players × 5 cards = 5 hands; if bids so far are 2 + 1 + 1, the last player cannot bid 1.

**Hand resolution** — highest trump wins; with no trump, highest card of the lead suit wins; off-suit cards can't win. Winner leads the next hand.

**Card values (high → low)** — A(14) · K(13) · Q(12) · J(11) · 10 … 2.

---

## 🚀 Run Locally

**Prerequisites:** any static file server (Python works out of the box) and a modern browser. The Firebase config is already included in `js/config.js`.

```bash
# from the project root
python -m http.server 8000
# then open http://localhost:8000
```

Share the lobby code or full URL to play with others (the Firebase backend is shared/live).

---

## 📁 Project Structure

```
GameOfJudgement/
├── index.html              # App shell: register / lobby / game screens + modals
├── credits.html            # Credits page
├── css/
│   ├── main.css            # Imports all CSS modules (active stylesheet)
│   ├── variables.css       # Design tokens (colors, radius, UI-scale)
│   ├── user-menu.css       # Top-right glass dropdown menu
│   ├── options-modal.css   # Options + Manage Players modals
│   ├── lobby.css · table.css · cards.css · bidding.css
│   ├── scoreboard.css · in-game-scoreboard.css · game.css · game-over.css
│   ├── register.css · forms.css · reconnect.css
│   ├── background.css · animations.css · responsive.css · ios-fixes.css · base.css
│   └── (20 modules total)
├── js/
│   ├── config.js           # Firebase init + scoring presets
│   ├── state.js            # Global state + Firebase presence/reconnection
│   ├── utils.js            # Deck, colors, screen helpers
│   ├── validation.js       # Input validation
│   ├── sounds.js           # Sound effects + "your turn" voice
│   ├── tabs.js             # Register tabs + how-to-play timeline
│   ├── register.js         # Registration, avatar picker, lobby creation
│   ├── lobby.js            # Lobby sync, game init, player-left handling, kick
│   ├── ui.js               # All DOM rendering (table, cards, scoreboard, seats)
│   ├── game.js             # Core logic: deal, bid, play, resolve, score
│   ├── scorecard.js        # Scorecard modal + final rankings
│   ├── reactions.js        # Emoji reaction bar (real-time)
│   ├── userMenu.js         # User dropdown, Options + Manage Players modals
│   ├── analytics.js        # Google Analytics 4 events
│   └── init.js             # Bootstrap + auto-rejoin
├── assets/                 # Icons, favicons, OG image, sounds/ (8 mp3s)
├── styles.css              # Legacy monolithic stylesheet (kept, not loaded)
├── CNAME                   # Custom domain (gameofjudgement.com)
├── robots.txt · sitemap.xml
└── README.md
```

Roughly **6,000 lines of JavaScript** across 15 modules and **5,000 lines of CSS** across 20 modules. Current app version: **1.3.0** (see `APP_VERSION` in `js/state.js`).

---

## 🏗️ Architecture

### Tech stack
- **Frontend:** Vanilla JavaScript (ES6+), HTML5, modular CSS — no framework, no bundler
- **Backend:** Firebase Realtime Database (`firebase-app-compat` / `firebase-database-compat` 10.13.1)
- **Hosting:** GitHub Pages with a custom domain
- **Fonts:** Google Fonts (Poppins, JetBrains Mono)

### Load order
Scripts load in dependency order in `index.html`:
`analytics → config → state → utils → validation → sounds → tabs → register → lobby → ui → game → scorecard → reactions → userMenu → init`

### Firebase data model
```
lobbies/{lobbyId}/
  creatorId                        # the host (lobby creator)
  players/{playerId}/              # id, name, avatar, joinedAt, status, lastSeen
  game/                            # players[], round, cardsPerRound, dealerId,
                                   # currentBidder, currentPlayer, hands, trick,
                                   # leadSuit, trump, bids, tricksWon, scores,
                                   # roundHistory, status
  reactions/                       # broadcast emoji reactions
  rematch/                         # signals players into a fresh lobby
```

### Presence & player removal
- **Presence:** `onDisconnect()` plus `beforeunload` + `navigator.sendBeacon()` + the Page Visibility API keep each player's `status` (`online`/`offline`) current.
- **Player removal is one pipeline:** whether a player **leaves voluntarily** or is **kicked by the host**, their node is removed from `players/`. Every client's `listenForPlayers` listener diffs the roster and, during an active game, runs `handlePlayerLeft()` (advance turn / reassign dealer / clean up bids+tricks, guarded so only the dealer-or-creator writes) and `checkGameViability()`. Kicked players are ejected back to the register screen by `listenForKick()`.

---

## 🗺️ Roadmap

Ideas not yet built (or scaffolded but inactive):
- **Activate scoring presets** — wire the High Stakes / Aggressive / Casual rulesets in `config.js` into game + lobby (a `customScoring` branch explores this)
- **Spectator mode**, **in-game text chat**, **AI opponents** for solo play
- **Per-player stats & game history**, **tournaments / multi-game series**
- **Firebase Auth**, lobby expiry/auto-cleanup, host kick **ban list**, profanity filter on names

---

## 🙌 Credits

- **Author:** Dinesh Khandelwal
- **Avatars:** [DiceBear](https://dicebear.com) (Adventurer)
- **Fonts:** [Poppins](https://fonts.google.com/specimen/Poppins) · [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono)
- Game based on the traditional **Judgement / Oh Hell** trick-taking card game.

See [`credits.html`](credits.html) for the in-app credits.

---

## 📄 License

MIT License — free to use, modify, and distribute.

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

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
```

---

**Built with ❤️ by Dinesh Khandelwal**
