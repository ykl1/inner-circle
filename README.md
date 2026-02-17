# Pick Me

A real-time multiplayer party game where players pitch themselves as the perfect date while sabotaging each other's dials.

## Tech Stack

- **Frontend**: React (Vite) + Tailwind CSS
- **Backend**: Node.js + Express + Socket.io
- **State**: React Context API (client), In-memory (server)

## Quick Start

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Install all dependencies
npm install
npm run install:all
```

### Development

Run both server and client in development mode:

```bash
npm run dev
```

Or run them separately:

```bash
# Terminal 1 - Server (port 3001)
npm run dev:server

# Terminal 2 - Client (port 5173)
npm run dev:client
```

### Troubleshooting: Port 3001 already in use

If you see `EADDRINUSE: address already in use 0.0.0.0:3001`, a previous server process is still running. Free the port:

```bash
# Find and kill the process using port 3001 (macOS/Linux)
lsof -i :3001
kill <PID>   # use the PID from the first column
```

Or in one line: `kill $(lsof -t -i :3001)`

### Playing the Game

1. Open http://localhost:5173 in multiple browser tabs/windows
2. First player creates a room and becomes the Judge
3. Other players join using the 4-character room code
4. Judge starts when at least 3 players (1 Judge + 2 candidates) are in the room

## Game Flow

1. **Lobby**: Players join, Judge sees room code and starts when ready
2. **Self-Positioning**: Candidates set 3 dials (1–10) for their "date" profile
3. **Sabotage**: Each candidate gets 8 points to move a rival's dials
4. **Pitch**: Candidates take turns presenting their (possibly sabotaged) dials
5. **Voting**: Judge picks one candidate
6. **Game Over**: Winner, losers, and Judge see results + Sabotage Map

## Project Structure

```
pick-me/
├── official_dial_cards.csv  # Dial card pool (left_anchor, right_anchor, category)
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── screens/        # Phase-based screens
│   │   ├── context/        # React Context for state
│   │   └── hooks/          # Custom hooks (socket)
│   └── ...
├── server/                 # Node.js Backend
│   └── src/
│       ├── index.js        # Express + Socket.io entry
│       ├── gameState.js    # Game state machine
│       ├── cards.js        # Dial dealing from CSV
│       ├── socketHandlers.js
│       └── utils.js
└── inner_circle_game.md    # Legacy spec (renamed from Inner Circle)
```

## MVP Features

- [x] Room creation and joining
- [x] Judge (host) starts game
- [x] Self-positioning dials (3 cards per candidate)
- [x] Sabotage (8 points to move target's dials)
- [x] Turn-based pitching
- [x] Judge votes for one candidate
- [x] Game Over with Sabotage Map
- [x] Session persistence (survives browser refresh)
- [x] Leave room functionality

## Deployment

See [DEPLOY.md](./DEPLOY.md) for full deployment guide.

**Quick overview:**
- **Frontend**: Served from Express (single deploy)
- **Backend**: AWS EC2 t3.micro + PM2 (auto-deploys via GitHub Actions)

```bash
git push  # Deploys via GitHub Actions
```

## Dial card dealing (Build Your Date phase)

Dial cards are loaded from **`official_dial_cards.csv`** at the project root. The file has three columns: `left_anchor`, `right_anchor`, and `category`.

- **Where the data lives**: `official_dial_cards.csv` in the repo root. The server reads it when the Judge starts the game (start of the dealing phase).
- **1 card per category per hand**: Each of the 3 cards in a player’s hand is drawn from a different category when possible. No two cards in the same hand may share a category unless the pool forces a fallback.
- **Unique hands**: No two players in the same round receive the same set of three cards. Hand uniqueness is enforced by tracking a signature (sorted card ids) and swapping cards when a duplicate would occur.
- **Consumed card registry**: The full card pool is shuffled once per round. Once a card is dealt to any player, it is removed from the available pool for the rest of that round and cannot be dealt again.
- **Category exhaustion fallback**: If there are not enough remaining cards from unused categories to fill a hand, the server relaxes the category constraint for that player only and substitutes a card from the least-represented category already in their hand. This fallback is logged as a warning.
- **Spectrum labels**: The UI uses `left_anchor` as the label for dial position 1 (left end) and `right_anchor` as the label for position 10 (right end). The client receives a single `label` string in the form `"left_anchor ↔ right_anchor"` for each card.
