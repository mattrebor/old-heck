# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Old Heck is a mobile-responsive React scoring application for the card game "Old Heck" (also known as "Oh Hell" or "Oh Heck"). Players track scores across multiple rounds with automatic calculation, real-time Firebase updates, and shareable view-only links.

## Development Commands

```bash
# Development
npm run dev              # Start Vite dev server

# Building
npm run build            # Type-check with tsc and build with Vite
npm run preview          # Preview production build locally

# Code Quality
npm run lint             # Run ESLint

# Testing
npm run test             # Run tests with Vitest
npm run test:ui          # Run tests with Vitest UI
npm run test:coverage    # Generate test coverage report
```

## Firebase Commands

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes

# Deploy to Firebase Hosting
npm run build
firebase deploy --only hosting

# Deploy everything (hosting, rules, indexes)
npm run build
firebase deploy
```

## Architecture & Key Concepts

### Game State Flow

The application uses a three-phase round system with auto-save at each step:

1. **Bidding Phase** (`currentPhase: "bidding"`)
   - Sub-phase: `biddingPhase: "blind-declaration-and-entry"` - Players declare blind bids (optional)
   - Sub-phase: `biddingPhase: "regular-bid-entry"` - Regular bidding in rotation order
   - **Auto-save**: Bids save with 500ms debounce after each entry
   - **Critical Rule**: Total bids cannot equal tricks available

2. **Results Phase** (`currentPhase: "results"`)
   - Players mark whether they made their bid (Met/Missed)
   - **Auto-save**: Results save with 500ms debounce after each entry
   - Manual completion - user must click "Complete Round" button

3. **Round Completion** (`currentPhase: "completed"`)
   - Round moves to `completedRounds[]` array
   - `inProgressRound` cleared from Firestore
   - Next round auto-starts if not at max rounds

### Game State Persistence

Games persist to Firestore with the following structure:

```typescript
Game {
  id: string                    // 8-character alphanumeric
  setup: GameSetup              // Immutable after creation
  rounds: Round[]               // Completed rounds
  inProgressRound?: Round       // Current round being played
  currentPhase?: "bidding" | "results" | "completed"
  biddingPhase?: "blind-declaration-and-entry" | "regular-bid-entry"
  status: "in_progress" | "completed"
  createdBy?: { uid, displayName, email }
}
```

**Important**: `setup` and `createdBy` are immutable per Firestore security rules. Use `updateGameRound()` which handles `undefined` → `deleteField()` conversion.

### Scoring Logic

The scoring formula is defined in `src/scoring.ts`:

```typescript
// Regular bid
met ? (bid × bid) + 10 : -(bid × bid)

// Blind bid (2x multiplier)
met ? 2 × ((bid × bid) + 10) : 2 × -(bid × bid)
```

**Edge case**: Bid of 0 met = +10 points, bid of 0 missed = 0 points

### Debounced Auto-Save Pattern

Bid and result updates use debounced saves (500ms) to reduce Firestore writes:

```typescript
const debouncedSaveRef = useRef(
  debounce(async (gameId, round, phase, biddingPhase?) => {
    await updateGameRound(gameId, {
      inProgressRound: round,
      currentPhase: phase,
      ...(phase === "bidding" && biddingPhase && { biddingPhase }),
    });
  }, 500)
);
```

Phase transitions save immediately (not debounced) for reliability.

### Authentication & Security

- **Google OAuth** via Firebase Auth
- **Firestore Rules**:
  - Anyone can READ games (enables view-only links)
  - Only authenticated users can CREATE games
  - Only game owner can UPDATE/DELETE their games
  - `createdBy`, `setup`, and `createdAt` are immutable
- See `FIRESTORE_RULES.md` for detailed security model

### Routing Structure

```
/ (home)                    → GameSetupPage (create new game)
/game/:gameId               → GamePlayPage (active game - owner view)
/game/:gameId/view          → GameViewPage (spectator view with real-time updates)
/my-games                   → MyGamesPage (user's game list)
```

**Note**: Games load from Firestore by ID. On initial game creation, navigate to `/game/:gameId` after `createGame()` returns the ID.

## Custom Tailwind Theme

The app uses a custom color palette themed around a card table aesthetic:

- `felt-*` - Green felt table colors (primary background)
- `bid-*` - Blue/purple for bidding phase
- `success-*` / `danger-*` - Score indicators
- `gold-*` - Winner highlighting
- `accent-*` - Purple accents for blind bids

Custom shadows: `shadow-card`, `shadow-card-hover`

Custom breakpoint: `xs:400px` (for very narrow screens)

## Mobile-First Considerations

- Mobile view shows **sorted leaderboard** (highest score first) with ranks
- Desktop view shows **horizontal table** with TOTAL and RANK rows
- Touch-friendly +/- buttons for bid entry (no keyboard required)
- Compact avatars with `flex-shrink-0` to prevent oval distortion
- Use `min-w-0` on text containers to allow proper text wrapping

## Common Patterns

### Player Avatar Colors

`PlayerAvatar` component generates consistent colors via `stringToColor()` hash function. Colors chosen to avoid conflicts with score indicators (no emerald green - uses lime instead).

### First Bidder Rotation

```typescript
const firstBidderIndex = (gameSetup.firstPlayerIndex + (roundNumber - 1)) % gameSetup.players.length;
```

First player is selected at game setup, then rotates each round.

### Player Rankings

Rankings calculated by sorting unique scores and finding index. Players with same score receive same rank.

## Testing

- Framework: Vitest with Happy DOM
- Test files: `*.test.ts` alongside source files
- Example: `src/utils/rounds.test.ts`

## Environment Variables

Required in `.env.local`:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

## Known Issues

- Node.js version warning: Project developed on 22.9.0, but Vite requires 20.19+ or 22.12+
- Bundle size warning: `index.js` exceeds 500KB (consider code-splitting for production)
- Dynamic import warning: `rounds.ts` imported both statically and dynamically

## TODO

See `TODO.md` for current feature priorities. High priority items include:
- Show score breakdown at top during blind bid phase
- Add intermediate step between rounds showing score changes
- Allow editing blind bids, bids, and results
