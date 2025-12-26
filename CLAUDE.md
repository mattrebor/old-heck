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

The application uses a multi-phase round system with auto-save at each step:

1. **Bidding Phase** (`currentPhase: "bidding"`)

   - Sub-phase: `biddingPhase: "blind-declaration-and-entry"` - Players declare blind bids (optional)
   - Sub-phase: `biddingPhase: "regular-bid-entry"` - Regular bidding in rotation order
   - **Auto-save**: Bids save with 500ms debounce after each entry
   - **Auto-scroll**: Page scrolls to top when transitioning to results phase
   - **Critical Rule**: Total bids cannot equal tricks available

2. **Results Phase** (`currentPhase: "results"`)

   - Players mark whether they made their bid (Met/Missed)
   - **Auto-save**: Results save with 500ms debounce after each entry
   - **Auto-scroll**: Page scrolls to top when transitioning to score review or next round
   - Manual completion - user must click "Complete Round" button

3. **Score Review Phase** (`currentPhase: "score-review"`) - _After Round 2+ only_

   - Shows score breakdown with point deltas on mobile
   - Manual "Start Next Round" button to continue
   - **Auto-scroll**: Page scrolls to top when starting next round
   - **Round 1 Exception**: Skips review, auto-starts round 2

4. **Round Completion** (`currentPhase: "completed"`)
   - Round moves to `completedRounds[]` array
   - `inProgressRound` cleared from Firestore
   - Either starts score review, auto-starts next round, or marks game complete

### Game State Persistence

Games persist to Firestore with the following structure:

```typescript
Game {
  id: string                    // 8-character alphanumeric
  setup: GameSetup              // Immutable after creation
  rounds: Round[]               // Completed rounds
  inProgressRound?: Round       // Current round being played
  currentPhase?: "bidding" | "results" | "score-review" | "completed"
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

**Quick Rematch**: After game completion, clicking "🎮 New Game with Same Settings" navigates to `/` with `location.state.setup` containing previous game settings. GameSetupPage detects this and pre-fills the form.

### UX Enhancements

**Auto-Scroll on Phase Transitions**

Uses `window.scrollTo({ top: 0, behavior: 'smooth' })` at key transition points:

- Bidding → Results
- Results → Score Review (round 2+)
- Results → Next Round (auto-start after round 1)
- Score Review → Next Round
- Game Complete

Prevents users from having to manually scroll up after completing phases (especially important on mobile).

**Real-Time Change Animations (View-Only Page)**

GameViewPage tracks previous round/phase state using `useRef` and detects changes:

```typescript
const prevRoundRef = useRef<Round | null>(null);
const prevPhaseRef = useRef<string | null>(null);
const [changedBids, setChangedBids] = useState<Set<number>>(new Set());
const [changedResults, setChangedResults] = useState<Set<number>>(new Set());
const [phaseChanged, setPhaseChanged] = useState(false);
```

On Firestore update (via `onSnapshot`):

- Compare current vs previous values
- Set animation state for changed items
- Apply Tailwind classes: `animate-pulse ring-4 ring-yellow-400`
- Clear animation after 2 seconds using `setTimeout`

Provides visual feedback to spectators when:

- A player's bid is entered (yellow pulse)
- A player's result is recorded (yellow pulse)
- Game phase changes (blue pulse)

**Quick Rematch Flow**

1. User completes game → sees "🎮 New Game with Same Settings" button
2. Click button → `navigate("/", { state: { setup } })`
3. GameSetupPage reads `location.state?.setup` and pre-fills:
   - `setDecks(prefillSetup?.decks ?? 1)`
   - `setPlayers(prefillSetup?.players ?? ["Player 1", "Player 2"])`
   - `setFirstPlayerIndex(prefillSetup?.firstPlayerIndex ?? 0)`
4. User can review/edit before clicking "Start Game"

**Game Settings Edit**

Before any bids are entered (round 1, bidding phase, all bids = -1):

- "✏️ Edit Setup" button appears
- Opens modal dialog to edit players, decks, first player
- Creates new round with updated settings
- All changes saved to Firestore

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
const firstBidderIndex =
  (gameSetup.firstPlayerIndex + (roundNumber - 1)) % gameSetup.players.length;
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
│   ├── bid/          # Bidding phase sub-components (reduce complexity)
│   ├── results/      # Results phase sub-components (reduce complexity)
│   ├── view/         # View-only page sub-components (reduce complexity)
│   └── *.tsx         # Top-level components (orchestrators)
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
- **Reduce cyclomatic complexity**: Create sub-components in subdirectories if main component exceeds ~200 lines
- **Composition over monoliths**: Break large components into focused sub-components with single responsibilities
- Make sure each component is easily testable
- create a hook in hook directory if there's some reuse. Do not create hook that are very complex in the component
- ensure that eslint is cleared
- ensure that the README.md is updated
- ensure all database changes are backwards compatible. If not possible, please notify and suggest and alternative.

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
  size = "md",
  showName = false,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
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
  const computed = state.map((x) => x * 2);

  // 5. Event handlers
  function handleClick() {
    // ...
  }

  // 6. Effects
  useEffect(() => {
    // ...
  }, [dependencies]);

  // 7. Render
  return <div>{/* JSX */}</div>;
}
```

**Component Composition Pattern:**

When a component exceeds ~200 lines or has high cyclomatic complexity, extract sub-components:

```typescript
// ❌ BAD: Monolithic component with inline rendering
export default function BidCollector({ round, onUpdate }: Props) {
  // 400+ lines of state, handlers, and complex conditional JSX
  return (
    <div>
      {biddingPhase === "blind" ? (
        <div className="...">
          {/* 100+ lines of blind bid UI */}
          {round.scores.map((ps, i) => (
            <div key={i}>{/* 50+ lines of player card UI */}</div>
          ))}
        </div>
      ) : (
        <div className="...">{/* 100+ lines of regular bid UI */}</div>
      )}
    </div>
  );
}

// ✅ GOOD: Orchestrator component using sub-components
export default function BidCollector({ round, onUpdate }: Props) {
  const [biddingPhase, setBiddingPhase] = useState("blind");

  function handleBidChange(index: number, bid: number) {
    onUpdate(index, bid, false);
  }

  if (biddingPhase === "blind") {
    return (
      <div>
        <BidTrackerCard tricksAvailable={10} totalBids={8} variant="blind" />
        {round.scores.map((ps, i) => (
          <BlindBidPlayerCard
            key={i}
            player={ps}
            index={i}
            onBidChange={handleBidChange}
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      <BidTrackerCard tricksAvailable={10} totalBids={8} variant="regular" />
      {round.scores.map((ps, i) => (
        <RegularBidPlayerRow
          key={i}
          player={ps}
          index={i}
          onBidChange={handleBidChange}
        />
      ))}
    </div>
  );
}
```

**Benefits of Composition:**

- **Reduced Complexity**: Each component has single responsibility
- **Easier Testing**: Test sub-components in isolation
- **Better Maintainability**: Changes to player card UI only affect one file
- **Reusability**: Sub-components can be used in multiple places
- **Readability**: Parent component shows high-level flow, sub-components handle details

**When to Create Sub-Components:**

- Component exceeds ~200 lines
- Multiple conditional rendering blocks (>3)
- Repeated UI patterns (player cards, form fields)
- Component does more than one thing (bidding + result entry)

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
function handleUpdateBid(index: number, bid: number) {}
function handleCompleteRound() {}

// ✗ Avoid generic names
function onBidUpdate() {} // Too vague
function update() {} // What does this update?
```

**Utility Functions:**

```typescript
// ✓ Descriptive verb-noun pairs
export function calculateMaxRounds(decks: number, players: number): number {}
export function debounce<T>(func: T, delay: number): (...args) => void {}

// ✗ Avoid abbreviations
export function calcRounds() {} // Too terse
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
    throw error; // Re-throw for caller to handle
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

- do not use javascript alert but use a toast component to communicate errors

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
import { describe, it, expect } from "vitest";
import { calculateScore } from "./scoring";

describe("calculateScore", () => {
  it("should return correct score for regular bid met", () => {
    expect(calculateScore(3, 3, false)).toBe(19);
  });

  it("should return correct score for blind bid missed", () => {
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

## Completed Recent Features

✅ Score review phase between rounds (after round 2+) with point deltas on mobile
✅ Auto-scroll to top on phase transitions for better mobile UX
✅ Real-time change animations on view-only page (pulse effects)
✅ Quick rematch with pre-filled setup page
✅ Edit game settings before any bids are entered
✅ Comprehensive test coverage for components and utilities
✅ **Component refactoring for reduced cyclomatic complexity**:

- BidCollector.tsx reduced from 424 to 206 lines (52% reduction)
- RoundEditor.tsx reduced from 91 to 31 lines (66% reduction)
- GameViewPage.tsx refactored to use ViewOnlyPlayerCard sub-component
- Created 6 focused sub-components in `components/bid/`, `components/results/`, and `components/view/`
- Each sub-component has single responsibility (easier testing and maintenance)

✅ **Consistent blind bid display across all components**:

- Inline badge display ("⚡ BLIND") next to bid text
- No extra vertical spacing for blind vs non-blind bids
- No duplicative text or "2X" notation - simple badge is sufficient

See `TODO.md` for future feature priorities.
