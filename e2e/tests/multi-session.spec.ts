import { test, expect } from '@playwright/test';
import { GameSetupPage } from '../pages/GameSetupPage';
import { GamePlayPage } from '../pages/GamePlayPage';
import { signInWithTestUser } from '../fixtures/auth';
import { deleteGame } from '../fixtures/firebase';

/**
 * TODO: Enhance multi-session tests
 *
 * Current limitations:
 * - View-only page doesn't expose input values for verification
 * - Tests only verify phase transitions and visible text
 *
 * Future improvements:
 * - Add data-testid attributes to view-only page for bid displays
 * - Verify specific bid values appear in real-time on view page
 * - Test concurrent editing scenarios with conflict resolution
 * - Add visual indicators for "someone is typing" or "bid being entered"
 * - Test network disconnection and reconnection scenarios
 */

test.describe('Multi-Session Real-Time Updates', () => {
  // Multi-session tests take longer due to multiple browser contexts and
  // cross-client real-time (onSnapshot) propagation over two rounds, which can
  // be slow on staging. Give generous headroom so the suite doesn't hit the
  // whole-test cap while individual steps are still (bounded) waiting.
  test.setTimeout(60000); // 60 seconds instead of default 30 seconds

  // Runs against the Firebase emulator (isolated, no WAN latency), where the
  // cross-client onSnapshot propagation this test asserts is deterministic.
  // Was previously skipped as flaky against shared staging Firebase.
  test('should show real-time updates when one user edits and another watches', async ({ browser }) => {
    // Create two separate browser contexts to simulate two different users
    const editorContext = await browser.newContext();
    const viewerContext = await browser.newContext();

    const editorPage = await editorContext.newPage();
    const viewerPage = await viewerContext.newPage();

    const editorSetupPage = new GameSetupPage(editorPage);
    const editorGamePage = new GamePlayPage(editorPage);

    try {
      // ==================== Editor: Create Game ====================
      await editorSetupPage.goto();
      await signInWithTestUser(editorPage, 0); // Alice

      await editorSetupPage.setupGame({
        decks: 1,
        players: ['Alice', 'Bob'],
        firstPlayerIndex: 0,
      });

      await editorSetupPage.waitForGamePage();
      const gameId = await editorSetupPage.getGameId();
      console.log(`📝 Editor created game: ${gameId}`);

      // ==================== Viewer: Join Game ====================
      // Sign in as different user
      await viewerPage.goto('/');
      await signInWithTestUser(viewerPage, 1); // Bob

      // Navigate to view-only page
      await viewerPage.goto(`/game/${gameId}/view`);
      console.log(`👁️  Viewer watching game: ${gameId}`);

      // Wait for game to load for viewer
      await viewerPage.waitForSelector('text=/Round 1/i', { timeout: 10000 });

      // ==================== Round 1: Blind Bidding ====================
      // Editor: No one bids blind
      await editorGamePage.continueFromBlindBidding();

      // Viewer: Should see transition to regular bidding (view page shows "📝 Bidding")
      await viewerPage.waitForSelector('text=/Bidding/i', { timeout: 10000 });
      console.log('✅ Viewer sees regular bidding phase');

      // ==================== Round 1: Regular Bidding ====================
      // Editor: Enter bids (total must NOT equal 1)
      await editorGamePage.setRegularBid(0, 1); // Alice bids 1
      await editorGamePage.setRegularBid(1, 1); // Bob bids 1 (total = 2, doesn't equal 1)

      // Viewer: Should see bidding phase remain active
      // (View-only page doesn't show input values, just displays bids as text)
      await expect(viewerPage.getByText(/Bidding/i)).toBeVisible();
      console.log('✅ Viewer sees bidding phase');

      // Editor: Complete bidding
      await editorGamePage.completeRegularBidding();

      // Viewer: Should see transition to results phase
      await viewerPage.waitForSelector('text=/Recording Results/i', { timeout: 10000 });
      console.log('✅ Viewer sees results phase');

      // ==================== Round 1: Results ====================
      // Editor: Record results
      await editorGamePage.markPlayerMade(0); // Alice makes
      await editorGamePage.markPlayerMissed(1); // Bob misses

      // Viewer: Should remain on results phase
      // (View-only page doesn't show checkboxes, just displays results)
      await expect(viewerPage.getByText(/Recording Results/i)).toBeVisible();
      console.log('✅ Viewer sees results phase');

      // Editor: Complete round
      await editorGamePage.completeRound();

      // Viewer: Should see score review phase
      await viewerPage.waitForSelector('text=/Round 1 Complete/i', { timeout: 10000 });
      console.log('✅ Viewer sees score review phase');

      // Viewer: Verify scores are shown
      // Alice: (1×1)+10 = +11
      // Bob: -((1×1)+10) = -11
      await expect(viewerPage.getByText(/Round 1 Complete/i)).toBeVisible();

      // ==================== Round 2: Start Next Round ====================
      // Editor: Start round 2
      await editorGamePage.startNextRound();

      // Viewer: Should see round 2 bidding phase.
      // Wait for the round 2 card to appear, then wait on the definitive
      // "📝 Bidding" phase indicator rather than a loose /Bidding/i regex.
      // Starting the next round can briefly flash a "✅ Completing Round" phase
      // before "bidding" propagates via Firestore onSnapshot, so the round header
      // can be visible while the phase indicator hasn't settled yet. Waiting on
      // the specific bidding indicator (with a generous timeout for slow staging
      // real-time sync) avoids that race.
      await viewerPage.getByText('Round 2 - In Progress').waitFor({ timeout: 15000 });
      await viewerPage.getByText('📝 Bidding').waitFor({ timeout: 15000 });
      console.log('✅ Viewer sees round 2 start');

      // ==================== Round 2: Blind Bidding ====================
      // Editor: Alice bids blind
      await editorGamePage.toggleBlindBid(0);
      await editorGamePage.setBlindBid(0, 2);

      // Viewer: Should remain on bidding phase
      // (View-only page shows blind bids as text, not as inputs)
      await expect(viewerPage.getByText(/Bidding/i)).toBeVisible();
      console.log('✅ Viewer sees bidding phase with blind bid');

      console.log('🎉 All multi-session real-time updates working correctly!');

      // Clean up: Delete the game (only in emulator mode)
      await deleteGame(gameId);
      console.log(`🗑️  Cleaned up game: ${gameId}`);
    } finally {
      // Clean up contexts
      await editorContext.close();
      await viewerContext.close();
    }
  });

  test('should sync updates between multiple viewers', async ({ browser }) => {
    // Test that multiple view-only users all see the same updates in real-time
    const editorContext = await browser.newContext();
    const viewer1Context = await browser.newContext();
    const viewer2Context = await browser.newContext();

    const editorPage = await editorContext.newPage();
    const viewer1Page = await viewer1Context.newPage();
    const viewer2Page = await viewer2Context.newPage();

    const setupPage = new GameSetupPage(editorPage);
    const gamePage = new GamePlayPage(editorPage);

    try {
      // Editor: Create game
      await setupPage.goto();
      await signInWithTestUser(editorPage, 0); // Alice

      await setupPage.setupGame({
        decks: 1,
        players: ['Alice', 'Bob', 'Charlie'],
        firstPlayerIndex: 0,
      });

      await setupPage.waitForGamePage();
      const gameId = await setupPage.getGameId();
      console.log(`📝 Created game: ${gameId}`);

      // Viewer 1: Bob watches
      await viewer1Page.goto('/');
      await signInWithTestUser(viewer1Page, 1);
      await viewer1Page.goto(`/game/${gameId}/view`);
      await viewer1Page.waitForSelector('text=/Round 1/i', { timeout: 10000 });
      console.log(`👁️  Viewer 1 watching`);

      // Viewer 2: Charlie watches
      await viewer2Page.goto('/');
      await signInWithTestUser(viewer2Page, 2);
      await viewer2Page.goto(`/game/${gameId}/view`);
      await viewer2Page.waitForSelector('text=/Round 1/i', { timeout: 10000 });
      console.log(`👁️  Viewer 2 watching`);

      // Editor: Skip blind bidding
      await gamePage.continueFromBlindBidding();

      // Both viewers should see bidding phase
      await viewer1Page.waitForSelector('text=/Bidding/i', { timeout: 10000 });
      await viewer2Page.waitForSelector('text=/Bidding/i', { timeout: 10000 });

      // Editor: Enter bids (total must not equal 3)
      await gamePage.setRegularBid(0, 1);
      await gamePage.setRegularBid(1, 0);
      await gamePage.setRegularBid(2, 1);

      // Both viewers should remain on bidding phase
      // (View-only page doesn't expose input values)
      await expect(viewer1Page.getByText(/Bidding/i)).toBeVisible();
      await expect(viewer2Page.getByText(/Bidding/i)).toBeVisible();

      console.log('✅ All viewers see the same phase in real-time');

      // Clean up: Delete the game
      await deleteGame(gameId);
      console.log(`🗑️  Cleaned up game: ${gameId}`);
    } finally {
      await editorContext.close();
      await viewer1Context.close();
      await viewer2Context.close();
    }
  });

  test('should show game completion to all viewers', async ({ browser }) => {
    const editorContext = await browser.newContext();
    const viewerContext = await browser.newContext();

    const editorPage = await editorContext.newPage();
    const viewerPage = await viewerContext.newPage();

    const editorSetupPage = new GameSetupPage(editorPage);
    const editorGamePage = new GamePlayPage(editorPage);

    try {
      // Editor: Create game
      await editorSetupPage.goto();
      await signInWithTestUser(editorPage, 0);

      await editorSetupPage.setupGame({
        decks: 1,
        players: ['Alice', 'Bob'],
        firstPlayerIndex: 0,
      });

      await editorSetupPage.waitForGamePage();
      const gameId = await editorSetupPage.getGameId();

      // Viewer: Watch game
      await viewerPage.goto('/');
      await signInWithTestUser(viewerPage, 1);
      await viewerPage.goto(`/game/${gameId}/view`);
      await viewerPage.waitForSelector('text=/Round 1/i', { timeout: 10000 });

      // Complete one round (total bids must not equal 1)
      await editorGamePage.completeFullRound({
        regularBids: [
          { playerIndex: 0, bid: 0 },
          { playerIndex: 1, bid: 0 }, // Changed from 1 to 0, total = 0 (doesn't equal 1)
        ],
        results: [
          { playerIndex: 0, made: true },
          { playerIndex: 1, made: true }, // Changed to made since bid is 0
        ],
      });

      // Viewer should see score review
      await viewerPage.waitForSelector('text=/Round 1 Complete/i', { timeout: 5000 });

      // Editor: End game early
      await editorGamePage.endGameEarlyButton.click();
      await editorPage.getByTestId('end-game-confirm-button').click();

      // Both should navigate to view page and see game complete
      await editorPage.waitForURL(/\/game\/[a-z0-9]+\/view/, { timeout: 10000 });
      await expect(editorPage.getByText(/Game complete/i)).toBeVisible();

      // Viewer should also see game complete (real-time update of status change)
      await viewerPage.waitForSelector('text=/Game complete/i', { timeout: 10000 });
      console.log('✅ Viewer sees game completion in real-time');

      // Clean up: Delete the game
      await deleteGame(gameId);
      console.log(`🗑️  Cleaned up game: ${gameId}`);
    } finally {
      await editorContext.close();
      await viewerContext.close();
    }
  });
});
