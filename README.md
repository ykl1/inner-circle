# Inner Circle

A real-time multiplayer party game where players pitch themselves to join an exclusive group while sabotaging each other with hidden flaws.

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

### Playing the Game

1. Open http://localhost:5173 in multiple browser tabs/windows
2. First player creates a room and becomes the Founder
3. Other players join using the 4-character room code
4. Founder configures game settings and starts when ready

## Game Flow

1. **Lobby**: Players join, Founder sets category and group capacity
2. **Flex Phase**: Candidates choose 2 green (strength) cards
3. **Sabotage Phase**: Each candidate gives 1 red (flaw) card to a random target
4. **Pitch Phase**: Candidates take turns presenting their 3-card hand
5. **Voting Phase**: Judges vote for one candidate (Founder breaks ties)
6. **Round Results**: Winner joins the Inner Circle (becomes a judge)
7. **Repeat** until group capacity is reached
8. **Game Over**: Winners and Losers screens displayed

## Project Structure

```
inner-circle/
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
└── inner_circle_game.md    # Full game specification
```

## MVP Features

- [x] Room creation and joining
- [x] Founder controls (category, capacity)
- [x] Card dealing (4 green, 2 red per candidate)
- [x] Flex selection (2 greens)
- [x] Blind sabotage system
- [x] Turn-based pitching
- [x] Voting with automatic tie-break
- [x] Multi-round progression
- [x] Winners/Losers end screens
- [x] Session persistence (survives browser refresh)
- [x] Leave room functionality

## Deployment

See [DEPLOY.md](./DEPLOY.md) for full deployment guide.

**Quick overview:**
- **Frontend**: Vercel (auto-deploys on git push)
- **Backend**: AWS EC2 t3.micro + PM2 (auto-deploys via GitHub Actions)

```bash
git push  # Deploys both frontend and backend automatically
```
