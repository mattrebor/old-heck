# Old Heck - Card Game Scoring App

A modern, mobile-responsive scoring application for the card game "Old Heck" (also known as "Oh Hell" or "Oh Heck"). Track scores across multiple rounds with automatic calculation, real-time updates, and shareable view-only links.

## Features

### Game Management
- **Google Authentication**: Secure sign-in to create and manage your games
- **Auto-Save with Debouncing**: Bids automatically save 500ms after entry; phase transitions save immediately
- **My Games**: View all your created games with status indicators (in progress/completed)
- **Delete Games**: Remove unwanted games from your list with confirmation
- **View-Only Links**: Share live game progress with spectators
- **Real-Time Change Animations**: Spectators see visual pulse effects when bids/results are entered or phase changes
- **End Game Early**: Option to finish games prematurely if needed
- **Resume Anytime**: Refresh the page at any point and resume exactly where you left off
- **Quick Rematch**: "New Game with Same Settings" button pre-fills setup page for fast game creation
- **Auto-Scroll**: Page automatically scrolls to top when transitioning between game phases

### Game Setup
- **Flexible Configuration**: Set number of decks and add unlimited players
- **First Player Selection**: Choose which player starts bidding in round 1 (rotates each round)
- **Player Avatars**: Each player gets a unique colored avatar with initials for easy identification
- **Editable Setup**: Modify players, decks, and first bidder before any bids are entered
- **Responsive Design**: Optimized for both desktop and mobile devices

### Game Flow with Score Review

**Phase 1: Blind Bid Declaration** (Purple Interface)
- Players can optionally bid blind (without seeing cards) for **DOUBLE points**
- Visual indicators for blind bidders throughout the game
- Automatic progression to regular bidding

**Phase 2: Regular Bidding** (Blue Interface)
- Each player enters their bid (0 or more tricks)
- **Touch-Friendly Controls**: +/- buttons for easy bid entry without keyboard
- **Real-time validation**: Total bids cannot equal tricks available (game rule enforcement)
- **Visual Indicators**: 🎯 First bidder, 👉 Current bidder, ✓ Bid complete
- Color-coded feedback: Red for over/under bids, Yellow for equal (not allowed)
- **Auto-save**: Bids save automatically as you enter them (500ms debounce)
- Automatic progression to results phase

**Phase 3: Results** (Green Interface)
- Simple "Made it" or "Missed it" selection for each player
- **Auto-save**: Results save automatically as you enter them (500ms debounce)
- Manual completion required - click "Complete Round" button to proceed

**Score Review Phase** (After Round 2+)
- Intermediate step between rounds showing score breakdown
- **Point Deltas on Mobile**: Shows how many points each player gained/lost in the latest round (+/- indicators)
- Manual "Start Next Round" button to continue when ready
- Gives players time to review progress before next round
- **Note**: Round 1 auto-starts round 2 without review (no previous scores to compare)

### Scoring System
- **Regular Bids**:
  - Made bid: `(bid × bid) + 10` points
  - Missed bid: `-(bid × bid)` points
- **Blind Bids** (2x multiplier):
  - Made bid: `2 × ((bid × bid) + 10)` points
  - Missed bid: `2 × (-(bid × bid))` points
- **Running Totals**: Expandable score breakdown by round with player rankings
- **Player Rankings**: Shows rank (#1, #2, etc.) based on total score; ties handled correctly
- **Player Avatars**: Color-coded circles with initials for quick identification

### Mobile Optimization
- **Hamburger menu** for navigation on small screens
- **Touch-friendly bid entry** with large +/- buttons (no keyboard required)
- **Compact avatars** that scale appropriately for narrow widths
- **Aligned player layouts** with consistent badge spacing
- **Responsive card titles** that scale for narrow displays
- **Horizontal scrolling** for many players in score breakdown
- **Leaderboard sorting** on mobile - players ranked by score (leader at top)
- **Optimized spacing** prevents text overlap on mobile devices

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Firebase/Firestore** - Cloud database with real-time updates
- **Firebase Authentication** - Google OAuth
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first styling with custom theme

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+
- Firebase project with Firestore and Authentication enabled

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

1. **Create a Firebase project** at [console.firebase.google.com](https://console.firebase.google.com)

2. **Enable Authentication**:
   - Go to Authentication → Sign-in method
   - Enable Google sign-in provider

3. **Enable Firestore Database**:
   - Go to Firestore Database
   - Create database in production mode

4. **Deploy Firestore Rules** (for security):
   ```bash
   firebase login
   firebase deploy --only firestore:rules
   ```
   See [FIRESTORE_RULES.md](./FIRESTORE_RULES.md) for details.

5. **Deploy Firestore Indexes** (required for "My Games" page):
   ```bash
   firebase deploy --only firestore:indexes
   ```
   See [FIRESTORE_SETUP.md](./FIRESTORE_SETUP.md) for details.

6. **Create a web app** in your Firebase project settings

7. **Copy the configuration** values to `.env.local`

### Firebase Hosting Setup

To deploy your app to Firebase Hosting:

1. **Initialize Firebase in your project** (if not already done):
   ```bash
   firebase init
   ```
   - Select "Hosting" when prompted
   - Choose your existing Firebase project
   - Set build directory: `dist`
   - Configure as single-page app: `Yes`
   - Don't overwrite existing files

2. **Build the production bundle**:
   ```bash
   npm run build
   ```

3. **Deploy to Firebase Hosting**:
   ```bash
   firebase deploy --only hosting
   ```

4. **Deploy everything at once** (hosting, rules, and indexes):
   ```bash
   npm run build
   firebase deploy
   ```

5. **View your live app**:
   - Firebase will provide a URL like: `https://your-project.web.app`
   - Set this as your production URL

**Environment Variables for Production:**

Create a `.env.production` file with your Firebase config:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

**Important**: For production, add your hosting domain to:
- **Firebase Authentication** → Settings → Authorized domains
- **Google OAuth** → Authorized redirect URIs (in Google Cloud Console)

**GitHub Actions (Optional):**

The project includes automated deployment workflows:
- **Pull Requests**: Auto-deploys preview channels for testing
- **Main Branch**: Auto-deploys to production on merge

Workflows are in `.github/workflows/`. Ensure you have:
- `FIREBASE_SERVICE_ACCOUNT` secret set in GitHub repo settings
- Firebase project properly configured

## Usage

### Authentication

**Sign In:**
1. Navigate to the home page
2. Click "Sign in with Google" to authenticate
3. Once signed in, you can create and manage games

**Sign Out:**
- Click the "🚪 Sign Out" button in the header navigation
- Available on both desktop and mobile menu
- Logs you out and returns you to the home page

### Starting a New Game

1. Click "🎮 New Game" in the header
2. Set the number of decks (default: 1)
3. Add or edit player names (minimum 2)
4. Choose which player starts first (rotates each round)
5. Player avatars update automatically as you type
6. Click "🎮 Start Game"
7. Game is created and saved to the cloud instantly

### Playing a Game

The app provides a seamless flow with automatic progression between phases:

**Phase 1: Blind Bid Declaration** (Purple Interface)

1. Choose if any players want to bid blind (without seeing cards)
2. Check "Blind Bid?" for players bidding blind
3. Blind bidders enter their bids immediately
4. Click "Continue to Regular Bidding →"
5. **Benefit**: Blind bids earn **DOUBLE points** (2x multiplier)

**Phase 2: Regular Bidding** (Blue Interface)

1. Remaining players (non-blind) enter their bids in order
2. Use **+/- buttons** for touch-friendly bid entry (or type numbers)
3. Watch for visual indicators:
   - **🎯 Blue badge**: First player to bid this round
   - **👉 Green badge**: Current player's turn to bid
   - **✓ Gray badge**: Player has completed their bid
4. Watch the real-time bid tracker:
   - **Red badge "⚠ Over!"**: Total bids exceed tricks (someone will definitely fail)
   - **Red badge "⚠ Under!"**: Total bids under tricks (someone will definitely fail)
   - **Yellow badge "⚠ Equal!"**: Not allowed per game rules (adjust bids)
5. **Bids auto-save** as you enter them (500ms after last change)
6. All bids must be entered correctly before proceeding
7. Click "Start Round →" when ready
8. Game automatically saves and transitions to results phase

**Phase 3: Results** (Green Interface)

1. Play the round physically with cards
2. For each player, click "✅ Made it" or "❌ Missed it"
3. **Results auto-save** as you enter them (500ms after last change)
4. Scores calculate automatically (2x for blind bids)
5. Review scores and click "**Complete Round**" button to proceed
6. After round 1: Next round starts automatically (no score review)
7. After round 2+: Proceed to score review phase

**Score Review Phase** (After Round 2+)

1. View completed round summary with celebration message
2. Review score breakdown showing all players' current standings
3. **Mobile**: See point deltas (+/- indicators) showing how many points each player gained/lost
   - Green (+X) for positive scores
   - Red (-X) for negative scores
   - Shows next to each player's total score in leaderboard
4. **Desktop**: Standard score table (no deltas)
5. Click "**▶️ Start Next Round**" button when ready to continue
6. Game automatically saves and starts the next round
7. Repeat until max rounds reached

**Auto-Save Throughout**
- **Bid entries**: Auto-save 500ms after last change (debounced for efficiency)
- **Result entries**: Auto-save 500ms after marking Made it/Missed it
- **Phase transitions**: Save immediately when moving between phases
- **Bidding sub-phase**: Tracks whether you're in blind or regular bidding phase
- **Browser refreshes**: Resume exactly where you left off, including partial bids and results
- **No manual save**: Everything persists automatically to Firestore
- **Visual feedback**: "💾 Saving..." indicator shows when syncing to cloud

### Sharing and Viewing

**View-Only Links**
- Click "👁️ Open View" to see the spectator view
- Click "📋 Copy" to share the link with others
- Anyone with the link can watch live updates (no authentication required)
- View-only mode shows current round and all completed rounds
- **Real-Time Change Animations**:
  - Yellow pulse ring when a player's bid is entered
  - Yellow pulse ring when a player's result is recorded
  - Blue pulse ring when game phase changes (Bidding → Results)
  - Animations last 2 seconds and automatically clear
  - Helps spectators see exactly when updates happen without refreshing

**My Games Page**
- Click "📋 My Games" in the header to see all your games
- Games show status: "▶ In Progress" or "✓ Completed"
- Click games to resume playing or view final scores
- **Delete unwanted games** with the 🗑️ button (requires confirmation)
- Most recent games appear first (sorted by last update)

**End Game Early**
- Click "⏹ End Game Early" button in game info section
- Confirm in the dialog
- Game is marked as completed with current scores
- Clears any in-progress round
- Useful for time-limited sessions

**Quick Rematch**
- After completing a game, click "🎮 New Game with Same Settings"
- Navigates to setup page with all previous settings pre-filled:
  - Same players (in same order)
  - Same number of decks
  - Same first player selection
- Review and edit any settings before starting if desired
- Click "🎮 Start Game" to begin the new game
- Perfect for playing multiple games back-to-back

### Mobile Experience

**Navigation**
- Desktop: Side-by-side navigation buttons
- Mobile (<640px): Hamburger menu (☰) with dropdown
- Very narrow screens (<400px): Extra compact layout

**Player Display**
- Collapsed view: Shows colored avatars with initials and scores
- Expanded view: Shows full player names with avatars
- Horizontal scrolling for games with 8+ players

**Score Breakdown**
- **Mobile**: Players sorted by rank with leader at top; rank (#1, #2, etc.) shown before each player
- **Desktop/Tablet**: Horizontal table with TOTAL and RANK rows at bottom
- Expandable rounds show individual round details
- Crown 👑 icon displayed for first place

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production (TypeScript check + Vite build)
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm test` - Run tests with Vitest
- `npm run test:ui` - Run tests with Vitest UI
- `npm run test:coverage` - Generate test coverage report

## Project Structure

```
src/
├── components/          # Reusable React components
│   ├── bid/             # Bidding phase sub-components
│   │   ├── BidTrackerCard.tsx       # Bid tracking display
│   │   ├── BlindBidPlayerCard.tsx   # Blind bid player card
│   │   ├── BlindBidSummary.tsx      # Blind bid summary (read-only)
│   │   └── RegularBidPlayerRow.tsx  # Regular bidding player row
│   ├── results/         # Results phase sub-components
│   │   └── ResultPlayerCard.tsx     # Result entry player card
│   ├── view/            # View-only page sub-components
│   │   └── ViewOnlyPlayerCard.tsx   # Read-only player card for spectators
│   ├── Header.tsx       # Navigation with auth controls
│   ├── BidCollector.tsx # Bidding phase orchestrator (52% smaller via composition)
│   ├── RoundEditor.tsx  # Results phase orchestrator (66% smaller via composition)
│   ├── Totals.tsx       # Running score breakdown
│   └── PlayerAvatar.tsx # Colored avatar circles
├── pages/               # Route-level page components
│   ├── GameSetupPage.tsx    # Game creation
│   ├── GamePlayPage.tsx     # Active game (owner)
│   ├── GameViewPage.tsx     # View-only (spectators, refactored)
│   ├── MyGamesPage.tsx      # User's game list
│   └── GameHistoryPage.tsx  # Legacy (deprecated)
├── contexts/            # React Context providers
│   └── AuthContext.tsx  # Authentication state
├── utils/               # Utility functions
│   ├── rounds.ts        # Round calculations
│   ├── suits.ts         # Player suit assignment
│   └── debounce.ts      # Debounce utility for auto-save
├── types.ts             # TypeScript type definitions
├── scoring.ts           # Game scoring logic
├── firebase.ts          # Firebase configuration
└── App.tsx              # Main app with routing
```

### Component Architecture

The app follows a **composition-based architecture** to maintain low cyclomatic complexity:

- **BidCollector.tsx** (206 lines, down from 424): Orchestrates bidding phases using sub-components
  - Delegates bid tracking display to `BidTrackerCard`
  - Delegates blind bid UI to `BlindBidPlayerCard` and `BlindBidSummary`
  - Delegates regular bidding UI to `RegularBidPlayerRow`

- **RoundEditor.tsx** (31 lines, down from 91): Orchestrates results phase using sub-components
  - Delegates player result cards to `ResultPlayerCard`

- **GameViewPage.tsx** (refactored): View-only page for spectators using sub-components
  - Delegates player display to `ViewOnlyPlayerCard` with real-time change animations

**Consistent Blind Bid Display**: All components use the `BidDisplay` component for uniform display:
- Badge shows "⚡ BLIND" **above** the bid count (centered)
- Reserved space ensures consistent height with or without badge
- Three size variants: `sm`, `md`, `lg` for different contexts
- Optional `suffix` prop for additional inline content (e.g., met/missed indicators)
- No duplicative text or "2X" notation

This architecture ensures each component has a **single responsibility**, making the codebase more maintainable, testable, and easier to understand.

## Game Rules

Old Heck (Oh Hell) is a trick-taking card game where:

### Basic Concept
- **Rounds & Tricks:** Each round number equals the number of tricks available
  - Round 1: 1 trick available (1 card dealt per player)
  - Round 2: 2 tricks available (2 cards dealt per player)
  - And so on...
- **Goal:** Bid exactly how many tricks you'll take (no more, no less)

### Bidding Rules
- **Regular Bidding:** Bid 0 or more tricks before seeing your cards
- **Blind Bidding:** Bid without seeing cards for **DOUBLE points**
- **Critical Rule:** Total of all bids ≠ number of tricks available
  - Ensures at least one player will fail their bid
  - Last player to bid must adjust if total would equal tricks

### Scoring
Points are based on whether you made your bid, not how many tricks you took:

**Regular Bids:**
- **Made bid** (took exactly what you bid): `(bid × bid) + 10` points
- **Missed bid** (took any other number): `-(bid × bid)` points

**Blind Bids (2x Multiplier):**
- **Made bid**: `2 × ((bid × bid) + 10)` points
- **Missed bid**: `2 × (-(bid × bid))` points

**Examples:**

Regular bid of 3 tricks:
- Make it: `(3 × 3) + 10 = +19` points ✓
- Miss it: `-(3 × 3) = -9` points ✗

Blind bid of 3 tricks:
- Make it: `2 × 19 = +38` points ✓✓
- Miss it: `2 × (-9) = -18` points ✗✗

Bid of 0 tricks (regular):
- Make it: `(0 × 0) + 10 = +10` points ✓
- Miss it: `-(0 × 0) = 0` points ✗

### Game Length
- Maximum rounds: `(52 × number of decks) ÷ number of players`
- Example: 1 deck, 4 players = 13 rounds max
- Example: 2 decks, 6 players = 17 rounds max

## Security

The app implements Firebase Security Rules to protect game data:

- **Public Read**: Anyone can view games (enables view-only links)
- **Authenticated Create**: Only signed-in users can create games
- **Owner-Only Write**: Only game creators can update/delete their games
- **Immutable Fields**: Creator and game setup cannot be changed after creation

See [FIRESTORE_RULES.md](./FIRESTORE_RULES.md) for complete security model.

## Contributing

Contributions are welcome! Please ensure your code:
- Passes `npm run lint` without errors
- Follows TypeScript best practices
- Maintains mobile responsiveness
- Includes appropriate error handling

## License

MIT
