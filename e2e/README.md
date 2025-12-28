# E2E Testing with Playwright

This directory contains end-to-end tests for the Old Heck card game application.

## Setup

All dependencies are already installed. Playwright and Firebase Emulator are configured and ready to use.

## Running Tests

### Quick Start

**IMPORTANT**: The emulator must be running before you run E2E tests!

```bash
# Terminal 1: Start the Firebase Emulator (leave this running)
npm run emulator:start

# Terminal 2: Run the tests
npm run test:e2e:emulator -- --workers=1

# Check if emulator is running
npm run emulator:check
```

### Test Commands

```bash
# With Firebase Emulator (recommended for local development)
npm run test:e2e:emulator              # Auto-checks if emulator is running
npm run test:e2e:emulator:ui           # Interactive UI mode
npm run test:e2e:emulator:headed       # See the browser
npm run test:e2e:emulator:nocheck      # Skip emulator check (not recommended)

# With Real Firebase (for integration testing)
npm run test:e2e:real
npm run test:e2e:real:ui

# Run specific test file
npm run test:e2e:emulator -- smoke.spec.ts --workers=1

# Check emulator status
npm run emulator:check
```

### Firebase Emulator Setup

**Step 1: Start the emulator (in a separate terminal)**
```bash
npm run emulator:start
```

The emulator will start:
- Auth Emulator: http://127.0.0.1:9099
- Firestore Emulator: http://127.0.0.1:8080
- Emulator UI: http://localhost:4000

**Step 2: Verify it's running**
```bash
npm run emulator:check
```

You should see:
```
✅ Auth Emulator (port 9099): Running
✅ Firestore Emulator (port 8080): Running
✅ UI Emulator (port 4000): Running
```

**Step 3: Run tests**
```bash
npm run test:e2e:emulator -- --workers=1
```

### Common Issues

**"Firebase Emulator is not fully running!"**
- Make sure you started the emulator: `npm run emulator:start`
- Check if ports 9099, 8080, 4000 are available
- Try stopping and restarting the emulator

**"network request failed" during auth**
- The emulator is not running
- Run `npm run emulator:check` to verify
- Start the emulator in a separate terminal

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

### ✅ All Tests Passing

**Test Suite Status: 100% Passing** ✅

All E2E tests are now fully functional and passing in both local and CI environments.

**smoke.spec.ts** - 3 passing:
- ✓ should load the homepage
- ✓ should have correct page title
- ✓ should show sign-in prompt when not authenticated

**game-setup.spec.ts** - 8 passing:
- ✓ should display the setup form
- ✓ should validate player names are required
- ✓ should allow changing number of decks
- ✓ should allow adding and removing players
- ✓ should allow reordering players
- ✓ should update first player selection when reordering
- ✓ should show validation errors for empty player names
- ✓ should allow setting up a game with custom configuration

**bidding-flow.spec.ts** - 8 passing:
- ✓ should allow blind bidding
- ✓ should prevent total bids from equaling tricks available
- ✓ should show warning when bid exceeds cards in hand
- ✓ should enforce bidding order
- ✓ should skip blind bidder in regular bidding phase
- ✓ should calculate blind bid bonus correctly
- ✓ should handle all players bidding blind
- ✓ should preserve blind bid flags during bidding

**complete-game.spec.ts** - 3 passing:
- ✓ should complete a full 2-player, 3-round game
- ✓ should handle mid-game score review correctly
- ✓ should allow ending game early

**Total: 22 E2E tests passing** 🎉

### Test Infrastructure

**Mobile-First Approach:**
- Default viewport: iPhone 12 (390x844)
- Tests reflect real-world mobile usage
- Desktop-specific tests only where UI differs significantly

**Authentication:**
- Email/password authentication enabled
- Test user credentials stored in GitHub secrets
- Works with both Firebase Emulator and real Firebase

**Timeout Optimization:**
- Reduced state update waits: 1000ms → 100ms (9x faster)
- Smart waits using Promise.race for auth flows
- Element-based waits instead of fixed delays where possible
- Firebase auto-save waits documented with TODOs for future improvement

**Selectors:**
- All tests use `data-testid` attributes for reliability
- Mobile/desktop-specific selectors differentiated
- Player index-based selectors instead of names (security)

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

E2E tests run automatically in the CI/CD pipeline after staging deployment.

### Pipeline Flow

```
PR Created → Lint + Unit Tests → Deploy Preview
     ↓
Merged to main → Lint + Unit Tests → Deploy Staging → E2E Tests → Deploy Production (approval required)
```

### Test Configuration

Tests are configured to run in CI with:
- 2 retries on failure
- Screenshot on failure
- Video recording on failure
- Trace on first retry
- JUnit XML output for CI systems
- Mobile viewport (iPhone 12: 390x844)

### GitHub Actions Workflow

The full workflow (`.github/workflows/cicd.yml`) includes:

```yaml
e2e-staging:
  name: E2E Tests on Staging
  needs: deploy-staging
  runs-on: ubuntu-latest
  environment:
    name: staging

  steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '22.12'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Install Playwright browsers
      run: npx playwright install --with-deps chromium

    - name: Run E2E tests against staging
      run: npm run test:e2e:real
      env:
        VITE_USE_FIREBASE_EMULATOR: false
        VITE_FIREBASE_API_KEY: ${{ vars.VITE_FIREBASE_API_KEY }}
        VITE_FIREBASE_AUTH_DOMAIN: ${{ vars.VITE_FIREBASE_AUTH_DOMAIN }}
        VITE_FIREBASE_PROJECT_ID: ${{ vars.VITE_FIREBASE_PROJECT_ID }}
        BASE_URL: https://${{ vars.VITE_FIREBASE_PROJECT_ID }}.web.app
        TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
        TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}

    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: playwright-report-staging
        path: playwright-report/
        retention-days: 30

    - name: Upload test failures (screenshots and videos)
      if: failure()
      uses: actions/upload-artifact@v4
      with:
        name: playwright-failures-staging
        path: test-results/
        retention-days: 30
```

### Test Artifacts

On test failure, the following artifacts are uploaded:
- **Playwright Report**: Full HTML report with test results
- **Screenshots**: PNG images of failed test states
- **Videos**: MP4 recordings of failed test runs
- **Traces**: Detailed execution traces for debugging

Access artifacts in GitHub Actions → Workflow run → Artifacts section.

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

## Test Coverage

- ✅ **Smoke Tests**: Basic app loading (3 tests)
- ✅ **Setup Flow**: Game creation and validation (8 tests)
- ✅ **Bidding Flow**: All bidding scenarios (8 tests)
- ✅ **Results Flow**: Score recording (included in complete game tests)
- ✅ **Multi-Round**: Complete games (3 tests)
- ✅ **CI/CD Integration**: Full pipeline with staging and production
- 🔄 **Real-Time Updates**: Cross-session scenarios (future enhancement)
- 🔄 **Share Links**: Collaborative editing (future enhancement)

**Current: 22 E2E tests covering all critical user journeys** 🎉

## Future Enhancements

1. **Real-time update tests** - Multi-session scenarios with different users
2. **Share link tests** - Collaborative editing and one-time token validation
3. **Performance testing** - Load time and interaction metrics
4. **Visual regression testing** - Screenshot comparisons for UI changes
5. **Accessibility testing** - ARIA labels and keyboard navigation

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
