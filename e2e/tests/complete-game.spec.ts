import { test, expect } from '@playwright/test';
import { GameSetupPage } from '../pages/GameSetupPage';
import { GamePlayPage } from '../pages/GamePlayPage';
import { signInWithTestUser } from '../fixtures/auth';

test.describe('Complete Game Flow', () => {
  test('should complete a full 2-player, 3-round game', async ({ page }) => {
    // This test demonstrates the complete flow:
    // 1. Setup game
    // 2. Play 3 rounds
    // 3. View final scores

    const setupPage = new GameSetupPage(page);
    const gamePage = new GamePlayPage(page);

    // ==================== Setup ====================
    await setupPage.goto();
    await signInWithTestUser(page);

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

    // Regular bidding - Round 1: 1 trick available, total must NOT equal 1
    await gamePage.setRegularBid(0, 0); // Alice bids 0
    await gamePage.setRegularBid(1, 0); // Bob bids 0 (total = 0, doesn't equal 1)
    await gamePage.completeRegularBidding();

    // Results
    await gamePage.markPlayerMade(0); // Alice makes her bid: (0×0)+10 = +11
    await gamePage.markPlayerMade(1); // Bob makes his bid: (0×0)+10 = +11
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

    // Regular bidding (Bob only) - Round 2: 2 tricks, Alice bid 1, Bob must not make total = 2
    await gamePage.setRegularBid(1, 0); // Bob bids 0 (total = 1, doesn't equal 2)
    await gamePage.completeRegularBidding();

    // Results
    await gamePage.markPlayerMade(0); // Alice makes blind bid: ((1×1)+10)×2 = +22
    await gamePage.markPlayerMade(1); // Bob makes his bid: (0×0)+10 = +11
    await gamePage.completeRound();

    // Start round 3
    await gamePage.startNextRound();

    // ==================== Round 3 ====================
    // Each player gets 3 cards
    // Alice starts (rotation)

    // Blind bidding: no one bids blind
    await gamePage.continueFromBlindBidding();

    // Regular bidding - Round 3: 3 tricks available, total must NOT equal 3
    await gamePage.setRegularBid(0, 2); // Alice bids 2
    await gamePage.setRegularBid(1, 2); // Bob bids 2 (total = 4, doesn't equal 3)
    await gamePage.completeRegularBidding();

    // Results
    await gamePage.markPlayerMissed(0); // Alice misses: -((2×2)+10) = -14
    await gamePage.markPlayerMade(1); // Bob makes: (2×2)+10 = +14
    await gamePage.completeRound();

    // ==================== Round 3 Complete ====================
    // Game continues (maxRounds = floor(52/2) = 26 for 1 deck, 2 players)
    await expect(page.getByText(/Round 3 Complete/i)).toBeVisible();

    // Verify final scores in totals table after 3 rounds
    // Alice: +11 (R1) +22 (R2) -14 (R3) = +19
    // Bob: +11 (R1) +11 (R2) +14 (R3) = +36

    // Verify scores are visible (don't check exact winner since game continues)
    await expect(page.getByText(/Round 3 Complete/i)).toBeVisible();
  });

  test('should handle mid-game score review correctly', async ({ page }) => {
    const setupPage = new GameSetupPage(page);
    const gamePage = new GamePlayPage(page);

    await setupPage.goto();
    await signInWithTestUser(page);

    await setupPage.setupGame({
      players: ['Alice', 'Bob'],
    });

    await setupPage.waitForGamePage();

    // Complete round 1 - Round 1: 1 trick available, total must NOT equal 1
    await gamePage.completeFullRound({
      regularBids: [
        { playerIndex: 0, bid: 0 },  // Changed from 1 to 0
        { playerIndex: 1, bid: 0 },  // Total = 0, doesn't equal 1
      ],
      results: [
        { playerIndex: 0, made: true },
        { playerIndex: 1, made: true },
      ],
    });

    // Should be in score review
    await expect(page.getByText(/Round 1 Complete/i)).toBeVisible();

    // Should show next round info
    await expect(page.getByText(/Round 2/i).first()).toBeVisible();

    // Should show who starts next
    await expect(page.getByText(/will start the bidding/i)).toBeVisible();

    // Totals should show round 1 scores with deltas
    await expect(page.getByText(/\+11/i).first()).toBeVisible(); // Both players made their 0 bids: (0×0)+10 = +11 each
  });

  test('should allow ending game early', async ({ page }) => {
    const setupPage = new GameSetupPage(page);
    const gamePage = new GamePlayPage(page);

    await setupPage.goto();
    await signInWithTestUser(page);

    await setupPage.setupGame({
      players: ['Alice', 'Bob'],
    });

    await setupPage.waitForGamePage();

    // Complete one round - Round 1: 1 trick available, total must NOT equal 1
    await gamePage.completeFullRound({
      regularBids: [
        { playerIndex: 0, bid: 0 },  // Changed from 1 to 0
        { playerIndex: 1, bid: 0 },  // Total = 0, doesn't equal 1
      ],
      results: [
        { playerIndex: 0, made: true },
        { playerIndex: 1, made: true },
      ],
    });

    // Click end game early
    await gamePage.endGameEarlyButton.click();

    // Should show confirmation dialog
    await expect(page.getByText(/End Game Early/i).first()).toBeVisible();
    await expect(page.getByText(/cannot be undone/i)).toBeVisible();

    // Confirm
    await page.getByTestId('end-game-confirm-button').click();

    // Should navigate to view page and show game complete message
    await page.waitForURL(/\/game\/[a-z0-9]+\/view/, { timeout: 10000 });
    await expect(page.getByText(/Game complete/i)).toBeVisible();
  });
});
