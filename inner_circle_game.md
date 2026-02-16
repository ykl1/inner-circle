# Inner Circle — Game Design Document

## 🎯 Core Concept

**Inner Circle** is a social party game where players pitch themselves to join an exclusive group (startup team, rap crew, roommates, etc.) while sabotaging each other with hidden flaws.

The game features a **Growing Recruitment Mechanic**:

* Each round, one player is selected to join the “Inner Circle”
* Winners become judges in future rounds
* This mirrors real-world shifting group dynamics and social power

The game ends when the group reaches its target size.

---

## 👥 Player Structure

* **Total Players:** 4–12

* **Founder (The Crown):**

  * Randomly assigned at game start
  * Acts as the initial judge
  * **Does NOT receive cards**
  * Has a **permanent Gold Crown icon**
  * Vote acts as **automatic tie-breaker** for the entire game

* **Candidates:** All non-founder players attempting to join the Inner Circle

---

## 🧮 Game Constraints

* **Group Capacity:** Set by Founder (example: 4-person startup team)

* **Number of Rounds:**
  `Group Capacity - 1`

* **Survival Constraint:**
  `Total Players ≥ Group Capacity + 1`
  This ensures the final round always has at least 2 candidates competing.

---

## 🃏 Card System

### Card Types

* **Green Cards (Strengths)** — Positive traits
* **Red Cards (Flaws)** — Negative traits used for sabotage

### Starting Hand Per Candidate

* 4 Green Cards
* 2 Red Cards

### Per Round Card Flow

| Stage            | Cards                             |
| ---------------- | --------------------------------- |
| Start of Round   | 4 Green, 2 Red                    |
| Used             | 2 Green (Flex) + 1 Red (Sabotage) |
| End of Round     | 2 Green, 1 Red                    |
| Replenish Draw   | +2 Green, +1 Red                  |
| Next Round Start | 4 Green, 2 Red                    |

---

## 🔁 Round Gameplay Loop

### 1️⃣ Preparation

Each candidate receives:

* 4 Green cards
* 2 Red cards

---

### 2️⃣ The Flex (Choose Strengths)

* Players select **2 Green Cards** to represent their strengths
* UI locks selection and transitions to sabotage phase

---

### 3️⃣ The Blind Sabotage

* Each candidate is randomly assigned a **Target**
* They see the **2 Green cards** the target selected
* They choose **1 Red card** from their own hand to give to the target
* Sabotager identity remains **anonymous**

Each player now has:

* 2 self-chosen Greens
* 1 Red given by another player

---

### 4️⃣ The Pitch Phase

* Candidates pitch in **random order**
* Everyone sees the active pitcher’s **3-card hand**

**Player UI includes:**

* Main View → Active pitcher's cards
* Toggle Button → “View My Hand” for preparing their own pitch

Only the active pitcher can press **“Finish Pitch”** to move to the next player.
The Founder also has an "override" button to be able to move to the next player to pitch.

---

### 5️⃣ Selection Phase (Judging)

**Judges = Founder + all previously selected winners**

* Judges vote for one candidate
* Persistent UI note:
  **“Founder (Crown) breaks ties automatically.”**

**Tie Logic:**

* If tied, the candidate voted for by the Founder wins instantly
* No extra voting round

---

### 6️⃣ Round Results

* **Round Results** is a dedicated phase with its own screen
* Shows the round winner and vote counts for all candidates
* **Founder only** can press **"Proceed"** to advance to the next round (or Game Over)

---

### 7️⃣ Integration & Replenishment

* Winner joins the **Inner Circle (Judges)**
* Winner’s cards are discarded
* Remaining candidates:

  * Keep unused cards (2 Green, 1 Red)
  * Draw 2 Green + 1 Red
  * Return to 4 Green / 2 Red

Repeat round loop until capacity reached.

---

## 🏁 Game End

When **Group Capacity** is reached:

### 🏆 Winners Screen

* Displays full Inner Circle roster
* Themed based on chosen category

### 😭 Loser’s Lounge

Players not selected see a playful rejection screen, themed by category:

* Startup → “The startup pivoted without you”
* Rap Group → “They left you on read”

Tone is humorous, not punishing.

---

## 🎭 Category System

Game content is split into:

### Core Cards (MVP)

* **In-memory deck:** 25 Green (strengths), 15 Red (flaws) — placeholder text (e.g. "Green Trait #1", "Red Flaw #1") in `server/src/cards.js`
* Universal traits; same deck used for all categories

### Category Packs (MVP)

* **Cosmetic only** for MVP: category sets theme and loser message
* Implemented categories:

| Category    | Id          | Loser Message                        |
| ----------- | ----------- | ------------------------------------ |
| Startup Team| `startup`   | "The startup pivoted without you"    |
| Rap Group   | `rap-group` | "They left you on read"              |

* Additional categories (Roommates, Church Small Group, U.S. Cabinet, etc.) are design targets for future content; not yet in code.

---

## 📱 UX Flow

### Phase 1: Pre-Game Lobby

**Founder:**

* Creates room → gets 4-character room code
* Selects Category
* Selects Group Capacity
* Crown icon shown on avatar
* Can **Leave room** (clears session and exits)

**Candidates:**

* Join via code (room code normalized to uppercase)
* Duplicate names (case-insensitive) are rejected: **"Name already taken in this room"**
* Wait for game start
* Can **Leave room** (clears session and exits)

---

### Phase 2: Role Assignment & Flex

* Founder revealed as Judge
* Candidates receive cards
* UI shows 4 Greens → choose 2
* Status changes to “Waiting for Sabotage”

---

### Phase 3: Sabotage UI

* Screen shows:
  **“Sabotage your rival!”**
* Displays target’s chosen Greens
* Player selects 1 Red to give
* After all submit → final 3-card hand revealed

---

### Phase 4: Pitching UI

* Random candidate highlighted
* Everyone sees pitcher's 3 cards
* Toggle: “View My Hand”
* Only active pitcher can advance turn

---

### Phase 5: Voting UI

* Judges see candidate carousel
* Tooltip: Founder breaks ties
* Votes cast simultaneously
* Tie resolved automatically

---

### Phase 6: Round Results UI

* All players see round winner and vote counts
* Only Founder sees **Proceed** button to go to next round or Game Over

---

### Phase 7: End Screens & Session Persistence

**End Screens**

* Winners screen shows final Inner Circle
* Losers see category-themed rejection screen

**Session persistence & rejoin**

* After joining or creating a room, **room code + player name** are stored in `localStorage`
* On refresh or reconnect (e.g. after switching apps on mobile), the client **rejoins by name**; server migrates the player’s socket ID and keeps all state (hand, votes, phase)
* **Reconnecting** shows a brief "Reconnecting..." then "Syncing..." overlay while state is fetched
* If the game ended while away, the user sees "The game has ended while you were away." and session is cleared
* **Leave room** clears the stored session and reloads the app

---

## 🏗 Technical Stack

**Frontend**

* React (Vite)
* Tailwind CSS (mobile-first)

**Backend**

* Node.js + Express
* Serves static frontend from `server/public` (single deploy)

**Real-Time Layer**

* Socket.io (stateful game server, server-authoritative)

**Data (MVP)**

* **In-memory only:** no database for MVP
* Card definitions and category packs live in code (`server/src/cards.js`)
* Game state (rooms, hands, votes) in memory on the server

**State Management**

* React Context API for global game state on client
* Server emits personalized `room_state_update` per player (player view)

**Client screens (by phase)**

* Join → `JoinScreen` (create / join by code)
* LOBBY → `LobbyScreen`
* FLEX_SELECTION → `FlexScreen`
* SABOTAGE → `SabotageScreen`
* PITCHING → `PitchScreen`
* VOTING → `VotingScreen`
* ROUND_RESULTS → `RoundResultsScreen`
* GAME_OVER → `GameOverScreen`

**Deployment**

* **Primary:** AWS EC2 (e.g. t3.micro) + PM2 — Express serves both API and static frontend on one port (e.g. 3001). Auto-deploy via GitHub Actions. See [DEPLOY.md](./DEPLOY.md).
* Frontend can alternatively be deployed to Vercel with backend on EC2.

---

## 🚫 Non-Goals (For MVP)

* No animations beyond basic transitions
* No voice chat
* No AI-generated cards
* No matchmaking — room-code only
* No database — card definitions and game state are in-memory

---

## 🚀 MVP Milestones

| # | Milestone                         | Status |
|---|-----------------------------------|--------|
| 1 | Lobby + Room System              | ✅ Done |
| 2 | Card Deal + Flex Selection       | ✅ Done |
| 3 | Sabotage System                  | ✅ Done |
| 4 | Pitch Turn System                | ✅ Done |
| 5 | Voting + Tie Logic               | ✅ Done |
| 6 | Round Results + Proceed          | ✅ Done |
| 7 | Round Loop + Card Replenishment  | ✅ Done |
| 8 | End Screens (Winners / Losers)   | ✅ Done |
| 9 | Session persistence & rejoin     | ✅ Done |
|10 | Leave room                       | ✅ Done |

**Implementation notes**

* **Pitch advance:** Only current pitcher or Founder can advance; `finish_pitch` uses `expectedIndex` for idempotency to avoid race conditions.
* **Server API:** `GET /health`, `GET /api/categories`; all game actions go through Socket.io events.
* **Empty rooms:** Disconnected rooms are eligible for cleanup after 60 seconds if no players are connected.
