import { test, expect } from '@playwright/test';
import { GameSetupPage } from '../pages/GameSetupPage';
import { GamePlayPage } from '../pages/GamePlayPage';

test.describe('Complete Game Flow', () => {
  // TODO: These tests require authentication
  // Once we implement email/password auth for testing, these can be enabled

  test.skip('should complete a full 2-player, 3-round game', async ({ page }) => {
    // This test demonstrates the complete flow:
    // 1. Setup game
    // 2. Play 3 rounds
    // 3. View final scores

    const setupPage = new GameSetupPage(page);
    const gamePage = new GamePlayPage(page);

    // ==================== Setup ====================
    await setupPage.goto();

    // Sign in (requires auth implementation)
    // await signInWithTestUser(page);

    // Create a game with 2 players
    await setupPage.setupGame({
      decks: 1,
      players: ['Alice', 'Bob'],
      firstPlayerIndex: 0, // Alice starts
    });

    await setupPage.waitForGamePage();

    // ==================== Round 1 ====================
    // Each player gets 1 card

    // Blind bidding: no one bids blind
    await gamePage.continueFromBlindBidding();

    // Regular bidding
    await gamePage.setRegularBid(0, 1); // Alice bids 1
    await gamePage.setRegularBid(1, 0); // Bob bids 0 (can't total 1)
    await gamePage.completeRegularBidding();

    // Results
    await gamePage.markPlayerMade(0); // Alice makes her bid: +10
    await gamePage.markPlayerMade(1); // Bob makes his bid: +5
    await gamePage.completeRound();

    // Verify scores after round 1
    await expect(page.getByText(/Round 1 Complete/i)).toBeVisible();
    await gamePage.startNextRound();

    // ==================== Round 2 ====================
    // Each player gets 2 cards
    // Bob starts (rotation)

    // Blind bidding: Alice bids blind
    await gamePage.toggleBlindBid(0);
    await gamePage.setBlindBid(0, 1);
    await gamePage.continueFromBlindBidding();

    // Regular bidding (Bob only)
    await gamePage.setRegularBid(1, 0); // Bob bids 0
    await gamePage.completeRegularBidding();

    // Results
    await gamePage.markPlayerMade(0); // Alice makes blind bid: +20 (2× bonus)
    await gamePage.markPlayerMade(1); // Bob makes his bid: +5
    await gamePage.completeRound();

    // Start round 3
    await gamePage.startNextRound();

    // ==================== Round 3 ====================
    // Each player gets 3 cards
    // Alice starts (rotation)

    // Blind bidding: no one bids blind
    await gamePage.continueFromBlindBidding();

    // Regular bidding
    await gamePage.setRegularBid(0, 2); // Alice bids 2
    await gamePage.setRegularBid(1, 2); // Bob bids 2 (total = 4, doesn't equal 3)
    await gamePage.completeRegularBidding();

    // Results
    await gamePage.markPlayerMissed(0); // Alice misses: -2 × 10 = -20
    await gamePage.markPlayerMade(1); // Bob makes: +20
    await gamePage.completeRound();

    // ==================== Game Complete ====================
    // Max rounds reached (3 for 1 deck, 2 players)
    await expect(page.getByText(/Game complete/i)).toBeVisible();

    // Verify final scores in totals table
    // Alice: +10 (R1) +20 (R2) -20 (R3) = +10
    // Bob: +5 (R1) +5 (R2) +20 (R3) = +30

    // Bob should be the winner (👑)
    await expect(page.getByText('👑')).toBeVisible();

    // Can start new game with same settings
    await expect(gamePage.newGameButton).toBeVisible();
  });

  test.skip('should handle mid-game score review correctly', async ({ page }) => {
    const setupPage = new GameSetupPage(page);
    const gamePage = new GamePlayPage(page);

    await setupPage.goto();
    // await signInWithTestUser(page);

    await setupPage.setupGame({
      players: ['Alice', 'Bob'],
    });

    await setupPage.waitForGamePage();

    // Complete round 1
    await gamePage.completeFullRound({
      regularBids: [
        { playerIndex: 0, bid: 1 },
        { playerIndex: 1, bid: 0 },
      ],
      results: [
        { playerIndex: 0, made: true },
        { playerIndex: 1, made: true },
      ],
    });

    // Should be in score review
    await expect(page.getByText(/Round 1 Complete/i)).toBeVisible();

    // Should show next round info
    await expect(page.getByText(/Round 2/i)).toBeVisible();

    // Should show who starts next
    await expect(page.getByText(/will start the bidding/i)).toBeVisible();

    // Totals should show round 1 scores with deltas
    await expect(page.getByText(/\+10/i)).toBeVisible(); // Alice's score
    await expect(page.getByText(/\+5/i)).toBeVisible(); // Bob's score

    // Can expand round details
    await gamePage.toggleRound(1);

    // Should show bid details
    await expect(page.getByText(/Bid.*1/i)).toBeVisible();
  });

  test.skip('should allow ending game early', async ({ page }) => {
    const setupPage = new GameSetupPage(page);
    const gamePage = new GamePlayPage(page);

    await setupPage.goto();
    // await signInWithTestUser(page);

    await setupPage.setupGame({
      players: ['Alice', 'Bob'],
    });

    await setupPage.waitForGamePage();

    // Complete one round
    await gamePage.completeFullRound({
      regularBids: [
        { playerIndex: 0, bid: 1 },
        { playerIndex: 1, bid: 0 },
      ],
      results: [
        { playerIndex: 0, made: true },
        { playerIndex: 1, made: true },
      ],
    });

    // Click end game early
    await gamePage.endGameEarlyButton.click();

    // Should show confirmation dialog
    await expect(page.getByText(/End Game Early/i)).toBeVisible();
    await expect(page.getByText(/cannot be undone/i)).toBeVisible();

    // Confirm
    await page.getByTestId('end-game-confirm-button').click();

    // Should mark game as complete
    await expect(page.getByText(/Game complete/i)).toBeVisible();
  });
});
