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

### 6️⃣ Integration & Replenishment

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

### Core Cards

Universal traits usable in any category

### Category Packs

Themed decks tied to the group type

| Category           | In-Group Role | Pitch Goal        | Example Cards                                          |
| ------------------ | ------------- | ----------------- | ------------------------------------------------------ |
| Roommates          | Household     | Get on the lease  | G: Professional Chef / R: Pees in sink when drunk      |
| Startup            | Founders      | Become co-founder | G: Environmentally friendly / R: Mom must join company |
| Rap Group          | The Crew      | Get signed        | G: Knows Drake / R: Performance anxiety over 50 people |
| Church Small Group | Leader        | Join group        | G: Can lead worship / R: Past situationship in group   |
| U.S. Cabinet       | President     | Join cabinet      | G: Nobel Prize / R: Bad at English                     |

---

## 📱 UX Flow

### Phase 1: Pre-Game Lobby

**Founder:**

* Creates room → gets 4-character code
* Selects Category
* Selects Group Capacity
* Crown icon shown on avatar

**Candidates:**

* Join via code
* Wait for game start

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

### Phase 6: End Screens

* Winners screen shows final Inner Circle
* Losers see category-themed rejection screen

---

## 🏗 Technical Stack

**Frontend**

* React (Vite)
* Tailwind CSS (mobile-first)

**Backend**

* Node.js + Express

**Real-Time Layer**

* Socket.io (stateful game server)

**Database**

* Vercel Postgres (relational)
* Stores card definitions & category packs

**State Management**

* React Context API for global game state

**Deployment**

* Vercel

---

## 🚫 Non-Goals (For MVP)

* No animations beyond basic transitions
* No voice chat
* No AI-generated cards
* No matchmaking — room-code only

---

## 🚀 MVP Milestones

1. Lobby + Room System
2. Card Deal + Flex Selection
3. Sabotage System
4. Pitch Turn System
5. Voting + Tie Logic
6. Round Loop + Card Replenishment
7. End Screens
