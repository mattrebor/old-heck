# E2E Testing with Playwright

This directory contains end-to-end tests for the Old Heck card game application.

## Setup

All dependencies are already installed. Playwright and Firebase Emulator are configured and ready to use.

## Running Tests

### Quick Start

```bash
# Run all tests (currently only smoke tests are enabled)
npm run test:e2e

# Run tests in interactive UI mode (recommended for development)
npm run test:e2e:ui

# Run tests in headed mode (see the browser)
npm run test:e2e:headed

# Run tests with emulator (default for local development)
npm run test:e2e:emulator

# Run specific test file
npx playwright test e2e/tests/smoke.spec.ts
```

### With Firebase Emulator

```bash
# Start emulator in one terminal
npm run emulator:start

# Run tests in another terminal
npm run test:e2e:emulator:ui
```

The emulator UI will be available at http://localhost:4000

## Test Structure

```
e2e/
├── fixtures/
│   ├── auth.ts              # Authentication helpers
│   ├── firebase.ts          # Firebase CRUD operations
│   └── firebase-emulator.ts # Emulator lifecycle management
├── pages/
│   ├── GameSetupPage.ts     # Page Object Model for setup
│   └── GamePlayPage.ts      # Page Object Model for gameplay
├── tests/
│   ├── smoke.spec.ts        # ✅ Basic smoke tests (3 passing)
│   ├── game-setup.spec.ts   # ⚠️  Setup validation tests (auth required)
│   ├── bidding-flow.spec.ts # ⚠️  Bidding tests (auth required)
│   └── complete-game.spec.ts # ⚠️  Full game flow (auth required)
└── README.md
```

## Current Status

### ✅ Passing Tests (13-16 passing)

**smoke.spec.ts** - 3 passing:
- ✓ should load the homepage
- ✓ should have correct page title
- ✓ should show sign-in prompt when not authenticated

**game-setup.spec.ts** - 5-8 passing:
- ✓ should display the setup form
- ✓ should validate player names are required
- ✓ should allow changing number of decks
- ✓ should allow adding and removing players
- ✓ should allow reordering players
- ⚠️ should update first player selection when reordering (occasional auth flakiness)
- ⚠️ should show validation errors for empty player names (occasional auth flakiness)
- ⚠️ should allow setting up a game with custom configuration (occasional auth flakiness)

**bidding-flow.spec.ts** - 5 passing:
- ✓ should allow blind bidding
- ✓ should prevent total bids from equaling tricks available
- ✓ should enforce bidding order
- ✓ should handle all players bidding blind
- ✓ should preserve blind bid flags during bidding

### ⏭️  Skipped Tests (5 skipped)

**bidding-flow.spec.ts**:
- ⏭️ should show warning when bid exceeds cards in hand (requires Round 2 setup)
- ⏭️ should calculate blind bid bonus correctly (needs bid validation investigation)

**complete-game.spec.ts** - All skipped (helper method needs debugging):
- ⏭️ should complete a full 2-player, 3-round game
- ⏭️ should handle mid-game score review correctly
- ⏭️ should allow ending game early

## Enabling Auth-Required Tests

To enable the currently disabled tests, we need to implement one of these approaches:

### Option 1: Email/Password Auth (Recommended)

Add email/password authentication to the app specifically for testing:

1. Enable Email/Password provider in Firebase Console
2. Create test users in Firebase Auth
3. Update `e2e/fixtures/auth.ts` to use email/password sign-in
4. Remove `test.skip` from disabled tests

### Option 2: Mock Google Auth

Mock the Google sign-in popup in Playwright:

1. Intercept Google OAuth requests
2. Mock the auth response
3. Set Firebase auth token in browser storage

### Option 3: Use Firebase Admin SDK

Create authenticated sessions programmatically:

1. Use Firebase Admin SDK to create custom tokens
2. Sign in with custom token in tests
3. Bypass Google OAuth entirely

## Page Object Models

Tests use the Page Object Model pattern for better maintainability:

### GameSetupPage

```typescript
const setupPage = new GameSetupPage(page);
await setupPage.goto();
await setupPage.setPlayerName(0, 'Alice');
await setupPage.startGame();
```

### GamePlayPage

```typescript
const gamePage = new GamePlayPage(page);
await gamePage.setRegularBid(0, 1);
await gamePage.completeRegularBidding();
await gamePage.markPlayerMade(0);
await gamePage.completeRound();
```

## Writing New Tests

### Example: Simple Test

```typescript
import { test, expect } from '@playwright/test';

test('my test', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Old Heck')).toBeVisible();
});
```

### Example: With Page Objects

```typescript
import { test, expect } from '@playwright/test';
import { GameSetupPage } from '../pages/GameSetupPage';

test('setup game', async ({ page }) => {
  const setupPage = new GameSetupPage(page);
  await setupPage.goto();
  await setupPage.setPlayerName(0, 'Alice');
  await expect(setupPage.getPlayerInput(0)).toHaveValue('Alice');
});
```

### Example: With Auth (when enabled)

```typescript
import { test, expect } from '@playwright/test';
import { signInWithTestUser } from '../fixtures/auth';
import { GameSetupPage } from '../pages/GameSetupPage';

test('create game', async ({ page }) => {
  const user = await signInWithTestUser(page);

  const setupPage = new GameSetupPage(page);
  await setupPage.goto();
  await setupPage.setupGame({ players: ['Alice', 'Bob'] });
  await setupPage.waitForGamePage();

  const gameId = await setupPage.getGameId();
  expect(gameId).toBeTruthy();
});
```

## Debugging Tests

### Interactive UI Mode

```bash
npm run test:e2e:ui
```

This opens the Playwright Test UI where you can:
- Run tests and see them execute
- Step through each action
- View screenshots and videos
- Inspect the DOM at each step

### Debug Mode

```bash
npm run test:e2e:debug
```

Opens Playwright Inspector for step-by-step debugging.

### View Test Reports

```bash
npm run test:e2e:report
```

Opens the HTML report showing test results, screenshots, and traces.

## CI/CD Integration

Tests are configured to run in CI with:
- 2 retries on failure
- Screenshot on failure
- Trace on first retry
- JUnit XML output for CI systems

Example GitHub Actions workflow:

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright browsers
  run: npx playwright install --with-deps chromium

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Firebase Emulator

The Firebase Local Emulator provides:
- **Auth Emulator** (port 9099): Test authentication without real users
- **Firestore Emulator** (port 8080): Test database operations offline
- **Emulator UI** (port 4000): View and manage emulated data

### Emulator Benefits

- ⚡ **Fast**: No network latency
- 🔒 **Isolated**: No production data pollution
- 💰 **Free**: No Firebase usage costs
- 🧪 **Deterministic**: Fresh state for each test run
- ⚙️ **Parallel**: Run multiple test suites simultaneously

### Switching Between Emulator and Real Firebase

```bash
# Use emulator (default, recommended)
npm run test:e2e:emulator

# Use real Firebase (for integration testing)
npm run test:e2e:real
```

Set up environment files:
```bash
# Copy for emulator (uses demo credentials - safe to commit to git)
cp .env.test.local.example .env.test.local

# Copy and configure for real Firebase (uses real credentials - DO NOT commit)
cp .env.test.real.example .env.test.real
```

**IMPORTANT**: `.env.test.local` uses demo Firebase credentials. The emulator doesn't validate these credentials, so they can be fake values. This ensures you never accidentally connect to real Firebase during testing.

## Test Coverage Goals

- ✅ **Smoke Tests**: Basic app loading (3/3 passing)
- ⏳ **Setup Flow**: Game creation and validation (auth required)
- ⏳ **Bidding Flow**: All bidding scenarios (auth required)
- ⏳ **Results Flow**: Score recording (auth required)
- ⏳ **Multi-Round**: Complete games (auth required)
- ⏳ **Real-Time**: Updates across sessions (auth required)
- ⏳ **Share Links**: Collaborative editing (auth required)

Target: 15-20 E2E tests covering critical user journeys.

## Next Steps

1. **Implement Email/Password Auth** for testing
2. **Enable disabled tests** by removing `test.skip`
3. **Add real-time update tests** (multi-session scenarios)
4. **Add share link tests** (collaborative editing)
5. **Integrate with CI/CD** pipeline

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
