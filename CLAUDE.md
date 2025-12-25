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

## Code Standards & Conventions

### File Organization

```
src/
├── components/       # Reusable UI components
├── pages/           # Route-level page components
├── contexts/        # React Context providers
├── utils/           # Pure utility functions
├── test/            # Test setup and global test utilities
├── types.ts         # Centralized TypeScript type definitions
├── firebase.ts      # Firebase config and helper functions
├── scoring.ts       # Game scoring logic
└── App.tsx          # Main app with routing
```

**Rules:**
- Test files co-located with source: `ComponentName.test.tsx`
- One component per file (exception: small helper components)
- Pages import components, not vice versa
- Utils must be pure functions (no side effects)

### TypeScript Conventions

**Type Imports:**
```typescript
// ✓ Use 'type' keyword for type-only imports
import type { Game, Round } from "../types";
import type { Timestamp } from "firebase/firestore";

// ✗ Avoid importing types without 'type' keyword
import { Game, Round } from "../types";
```

**Type Definitions:**
```typescript
// ✓ Export types with 'export type'
export type GameSetup = {
  players: string[];
  decks: number;
};

// ✓ Use union types for enums (not TypeScript enums)
export type GameStatus = "in_progress" | "completed";

// ✓ Mark optional fields with ?
export type Game = {
  id?: string;
  updatedAt?: Timestamp;
};
```

**Component Props:**
```typescript
// ✓ Define props inline with TypeScript object type
export default function PlayerAvatar({
  name,
  size = 'md',
  showName = false
}: {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}) {
  // ...
}

// ✓ Explicit types for useState
const [phase, setPhase] = useState<"bidding" | "results">("bidding");
```

### Naming Conventions

- **PascalCase**: Components, types, React context names
  - `PlayerAvatar`, `GameSetup`, `AuthContext`
- **camelCase**: Functions, variables, parameters
  - `createGame`, `totalBids`, `onUpdate`
- **File names**: Match export name
  - `PlayerAvatar.tsx` exports `PlayerAvatar`
  - `rounds.ts` exports `calculateMaxRounds`, `createRound`, etc.

### Import Organization

Organize imports in this order:

```typescript
// 1. External libraries (React, Firebase, etc.)
import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";

// 2. Type imports (with 'type' keyword)
import type { Game, Round } from "../types";

// 3. Local imports (relative paths)
import PlayerAvatar from "./PlayerAvatar";
import { debounce } from "../utils/debounce";
```

### React Patterns

**Component Structure:**
```typescript
// 1. Helper functions (not exported, used internally)
function getInitials(name: string): string {
  // ...
}

// 2. Component (default export)
export default function ComponentName({ prop1, prop2 }: Props) {
  // 3. Hooks first (useState, useEffect, useRef, etc.)
  const [state, setState] = useState<Type>(initialValue);
  const ref = useRef<Type>(initialValue);

  // 4. Derived values
  const computed = state.map(x => x * 2);

  // 5. Event handlers
  function handleClick() {
    // ...
  }

  // 6. Effects
  useEffect(() => {
    // ...
  }, [dependencies]);

  // 7. Render
  return (
    <div>{/* JSX */}</div>
  );
}
```

**Hooks Usage:**
- Always specify types for `useState` when not inferrable
- Use `useRef` for mutable values that don't trigger re-renders (e.g., debounced functions)
- Keep `useEffect` dependencies exhaustive (follow ESLint rules)
- Prefer derived state over `useEffect` when possible

**Exports:**
- Components and pages: **default export**
- Utility functions: **named exports**
- Firebase helpers: **named exports**
- Types: **named exports** with `export type`

### Function Conventions

**Exported Functions (firebase.ts, utils/):**
```typescript
/**
 * JSDoc comment describing what the function does
 * @param gameId - Description of parameter
 * @returns Description of return value
 */
export async function createGame(
  setup: GameSetup,
  createdBy?: UserInfo
): Promise<string> {
  // ...
}
```

**Component Event Handlers:**
```typescript
// ✓ Prefix with 'handle'
function handleUpdateBid(index: number, bid: number) { }
function handleCompleteRound() { }

// ✗ Avoid generic names
function onBidUpdate() { }  // Too vague
function update() { }       // What does this update?
```

**Utility Functions:**
```typescript
// ✓ Descriptive verb-noun pairs
export function calculateMaxRounds(decks: number, players: number): number { }
export function debounce<T>(func: T, delay: number): (...args) => void { }

// ✗ Avoid abbreviations
export function calcRounds() { }  // Too terse
```

### Error Handling

**Async Functions:**
```typescript
// ✓ Try/catch for user-facing operations
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;  // Re-throw for caller to handle
  }
}
```

**Component Error Handling:**
```typescript
// ✓ Handle errors in components, show user-friendly messages
try {
  await createGame(setup);
  navigate(`/game/${gameId}`);
} catch (error) {
  console.error("Failed to create game:", error);
  setError("Failed to create game. Please try again.");
}
```

**Console Logging:**
- Use `console.log` for development debugging only
- Use `console.error` for errors (searchable in production)
- Remove debug `console.log` before committing

### Styling Conventions

**Tailwind Usage:**
```typescript
// ✓ Use template literals for conditional classes
<div className={`p-4 rounded-lg ${
  isActive ? "bg-blue-500" : "bg-gray-200"
}`}>

// ✓ Use custom theme colors
<div className="bg-felt-500 text-bid-700">

// ✓ Inline styles only for dynamic values
<div style={{ backgroundColor: stringToColor(name) }}>

// ✗ Avoid inline styles for static values
<div style={{ padding: "16px" }}>  // Use className="p-4" instead
```

**Responsive Design:**
```typescript
// ✓ Mobile-first approach (default → md: → lg:)
<div className="flex-col md:flex-row">

// ✓ Use custom breakpoint for very narrow screens
<div className="text-sm xs:text-base">

// ✓ Hide/show based on screen size
<div className="md:hidden">Mobile menu</div>
<div className="hidden md:block">Desktop nav</div>
```

**Utility Classes:**
- Prefer Tailwind utilities over custom CSS
- Use `flex-shrink-0` to prevent squashing of avatars/icons
- Use `min-w-0` on text containers to allow proper wrapping
- Use `gap-*` instead of margin between flex children

### State Management

**Local State (useState):**
- Component-specific UI state (expanded, loading, error)
- Form inputs and validation

**Firestore (realtime):**
- Game state (rounds, scores, phase)
- User game list
- Auto-sync via `onSnapshot`

**Context (AuthContext):**
- User authentication state
- Shared across entire app
- No other global state needed

**Refs (useRef):**
- Debounced save functions (don't trigger re-renders)
- DOM references (rare - mostly use controlled components)

### Testing Conventions

**Test Files:**
- Co-locate with source: `scoring.test.ts` next to `scoring.ts`
- Use descriptive test names: `"should calculate score correctly for blind bid"`

**Test Structure:**
```typescript
import { describe, it, expect } from 'vitest';
import { calculateScore } from './scoring';

describe('calculateScore', () => {
  it('should return correct score for regular bid met', () => {
    expect(calculateScore(3, 3, false)).toBe(19);
  });

  it('should return correct score for blind bid missed', () => {
    expect(calculateScore(3, 2, true)).toBe(-18);
  });
});
```

### Comments & Documentation

**When to Comment:**
- ✓ Complex business logic (scoring formulas, bid validation rules)
- ✓ Non-obvious React patterns (why using useRef vs useState)
- ✓ Firestore security constraints (immutable fields)
- ✓ JSDoc for exported functions

**When NOT to Comment:**
- ✗ Self-explanatory code (`// Increment counter` before `count++`)
- ✗ Repeating type information
- ✗ Commented-out code (remove it, use git history)

### Git Conventions

**Commit Messages:**
```
Brief summary in imperative mood (50 chars or less)

- Detailed bullet points explaining what changed
- Focus on "what" and "why", not "how"
- Reference issues/PRs if applicable

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Branch Strategy:**
- `main` - Production-ready code
- Feature branches for new work (optional for solo projects)

## TODO

See `TODO.md` for current feature priorities. High priority items include:
- Show score breakdown at top during blind bid phase
- Add intermediate step between rounds showing score changes
- Allow editing blind bids, bids, and results
