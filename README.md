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
3. **Sabotage**: Each candidate gets 6 points to move a rival's dials
4. **Pitch**: Candidates take turns presenting their (possibly sabotaged) dials
5. **Voting**: Judge picks one candidate
6. **Game Over**: Winner, losers, and Judge see results + Sabotage Map

## Project Structure

```
pick-me/
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
│       ├── cards.js        # Card definitions
│       ├── socketHandlers.js
│       └── utils.js
└── inner_circle_game.md    # Legacy spec (renamed from Inner Circle)
```

## MVP Features

- [x] Room creation and joining
- [x] Judge (host) starts game
- [x] Self-positioning dials (3 cards per candidate)
- [x] Sabotage (6 points to move target's dials)
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
