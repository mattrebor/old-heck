# Old Heck - Card Game Scoring App

A React-based scoring application for the card game "Old Heck" (also known as "Oh Hell" or "Oh Heck"). Track scores across multiple rounds with automatic calculation based on tricks taken and bids met.

## Features

- **Game Setup**: Configure number of decks and players
- **Two-Phase Round Play**:
  - Phase 1: Collect bids from all players (including zero bids)
  - Phase 2: Simple radio buttons - "Made it" or "Missed it" for each player
- **Automatic Score Calculation**: Scores calculated using the Old Heck formula
  - Made bid: `(bid × bid) + 1` points
  - Missed bid: `-(bid × bid)` points
- **Running Totals**: View cumulative scores throughout the game
- **Game History**: Save completed games to Firebase and view later
- **Responsive Design**: Built with Tailwind CSS

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Firebase/Firestore** - Cloud database for game storage
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+
- Firebase project with Firestore enabled

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd old-heck
```

2. Install dependencies
```bash
npm install
```

3. Set up Firebase configuration
```bash
cp .env.example .env.local
```

4. Edit `.env.local` with your Firebase credentials:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

5. Start the development server
```bash
npm run dev
```

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore Database
3. Create a web app in your Firebase project
4. Copy the configuration values to `.env.local`

## Usage

### Starting a New Game

1. Navigate to the home page
2. Set the number of decks (default: 1)
3. Add or remove players (minimum 2)
4. Click "Start Game"

### Playing a Game

The app provides a seamless flow with automatic progression between rounds:

**Phase 1: Bidding** (Blue Interface)
1. Round starts automatically (first round begins immediately, subsequent rounds auto-start after completion)
2. Each player enters their bid (0 or more tricks they think they'll take)
3. **Important:** The total of all bids cannot equal the number of tricks available (the app enforces this rule)
4. Click "Start Round →" when all bids are entered correctly
5. Game automatically transitions to results phase

**Phase 2: Results** (Green Interface)
1. Play the round physically with cards
2. For each player, select "Made it" or "Missed it" using radio buttons
3. Scores are calculated automatically:
   - Made bid: `(bid × bid) + 1` points
   - Missed bid: `-(bid × bid)` points
4. Round auto-completes 1.5 seconds after all players are marked
5. Next round automatically starts (or you can click "Complete Round Now" to skip the delay)

**After All Rounds**
- View running totals throughout the game
- When max rounds are reached, click "Save Game" to finish
- Game data is saved to Firebase for later viewing

### Viewing Game History

- After saving, you'll be redirected to the game history page
- Navigate directly to `/game/{gameId}` to view any saved game
- Click "← Home" to start a new game

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/       # Reusable React components
│   ├── Header.tsx
│   ├── RoundEditor.tsx
│   └── Totals.tsx
├── pages/           # Route-level page components
│   ├── GameSetupPage.tsx
│   ├── GamePlayPage.tsx
│   └── GameHistoryPage.tsx
├── utils/           # Utility functions
│   └── rounds.ts
├── types.ts         # TypeScript type definitions
├── scoring.ts       # Game scoring logic
├── firebase.ts      # Firebase configuration
└── App.tsx          # Main app with routing
```

## Game Rules

Old Heck (Oh Hell) is a trick-taking card game where:
- **Rounds & Tricks:** Each round number equals the number of tricks available
  - Round 1: 1 trick available (1 card dealt per player)
  - Round 2: 2 tricks available (2 cards dealt per player)
  - And so on...
- **Bidding:** At the start of each round, players bid how many tricks they think they'll take
  - **Important Rule:** The total of all bids cannot equal the number of tricks available
  - This ensures at least one player will fail to make their bid
  - The last player to bid (often the dealer) must adjust their bid if needed
- **Playing:** Players play the round with actual cards to see who takes tricks
- **Scoring:** Based on your bid, regardless of how many tricks you actually took
  - Made your bid (took exactly what you bid): `(bid × bid) + 1` points
  - Missed your bid (took any other number): `-(bid × bid)` points
- **Example:** If you bid 3 tricks:
  - Make your bid: `(3 × 3) + 1 = +10` points ✓
  - Miss your bid: `-(3 × 3) = -9` points ✗
- The maximum number of rounds is based on: `(52 × decks) ÷ players`

## License

MIT
