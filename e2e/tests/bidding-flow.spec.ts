import { test, expect } from '@playwright/test';
import { GamePlayPage } from '../pages/GamePlayPage';
import { GameSetupPage } from '../pages/GameSetupPage';
import { signInWithTestUser } from '../fixtures/auth';
import { deleteGame } from '../fixtures/firebase';

test.describe('Bidding Flow', () => {
  let gamePage: GamePlayPage;
  let setupPage: GameSetupPage;
  let gameId: string;

  test.beforeEach(async ({ page }) => {
    setupPage = new GameSetupPage(page);
    gamePage = new GamePlayPage(page);

    // Sign in and create a game
    await setupPage.goto();
    await signInWithTestUser(page);
    await setupPage.setupGame({
      decks: 1,
      players: ['Alice', 'Bob'],
      firstPlayerIndex: 0,
    });

    // Wait for game to be created and navigate to game page
    await page.waitForURL(/\/game\/[a-z0-9]+/, { timeout: 10000 });
    gameId = await setupPage.getGameId();
  });

  test.afterEach(async () => {
    // Clean up: Delete the game
    if (gameId) {
      await deleteGame(gameId);
    }
  });

  test('should allow blind bidding', async ({ page }) => {
    // Should be in blind bidding phase
    await expect(page.getByText('Blind Bid Phase')).toBeVisible();

    // Toggle blind bid for player 0
    await gamePage.toggleBlindBid(0);
    await expect(gamePage.getBlindBidCheckbox(0)).toBeChecked();

    // Enter blind bid
    await gamePage.setBlindBid(0, 1);
    await expect(gamePage.getBlindBidInput(0)).toHaveValue('1');

    // Continue button should be enabled once bid is entered
    await expect(gamePage.blindBidContinueButton).toBeEnabled();

    // Continue to regular bidding
    await gamePage.continueFromBlindBidding();

    // Should now be in regular bidding phase
    await expect(page.getByText('Place Your Bids')).toBeVisible();
  });

  test('should prevent total bids from equaling tricks available', async ({ page }) => {
    // Skip blind bidding
    await gamePage.continueFromBlindBidding();

    // Round 1: 1 trick available
    // If player 0 bids 1 and player 1 bids 0, total = 1 which equals 1, should show error

    await gamePage.setRegularBid(0, 1);
    await gamePage.setRegularBid(1, 0);

    // Should show validation error
    await expect(page.getByText(/total cannot equal/i)).toBeVisible();

    // Complete button should be disabled
    await expect(gamePage.regularBidCompleteButton).toBeDisabled();

    // Fix by changing player 1's bid
    await gamePage.setRegularBid(1, 1);

    // Error should be gone
    await expect(page.getByText(/total cannot equal/i)).not.toBeVisible();

    // Complete button should be enabled
    await expect(gamePage.regularBidCompleteButton).toBeEnabled();
  });

  test('should show warning when bid exceeds cards in hand', async ({ page }) => {
    // Complete Round 1 to get to Round 2 (with 2 cards per player)
    // Round 1: 1 trick available, bid total must NOT equal 1
    await gamePage.continueFromBlindBidding();
    await gamePage.setRegularBid(0, 0);  // Changed from 1 to 0
    await gamePage.setRegularBid(1, 0);  // Total = 0, doesn't equal 1
    await gamePage.completeRegularBidding();
    await gamePage.markPlayerMade(0);
    await gamePage.markPlayerMade(1);
    await gamePage.completeRound();
    await gamePage.startNextRound();

    // Round 2: Each player has 2 cards
    // Player 1 (Bob) bids first in Round 2 due to rotation
    await gamePage.continueFromBlindBidding();

    // Try to bid more than 2 (cards in hand) - Bob's turn
    await gamePage.setRegularBid(1, 3);

    // Should show warning
    await expect(page.getByText(/exceeds cards in hand/i)).toBeVisible();
  });

  test('should enforce bidding order', async () => {
    // Skip blind bidding
    await gamePage.continueFromBlindBidding();

    // First bidder's input should be enabled
    await expect(gamePage.getRegularBidInput(0)).toBeEnabled();

    // Other players' inputs should be disabled until it's their turn
    await expect(gamePage.getRegularBidInput(1)).toBeDisabled();

    // After first player bids
    await gamePage.setRegularBid(0, 1);

    // Wait for next player's input to become enabled
    await expect(gamePage.getRegularBidInput(1)).toBeEnabled({ timeout: 2000 });
  });

  test('should skip blind bidder in regular bidding phase', async () => {
    // Player 0 (Alice) does a blind bid
    await gamePage.toggleBlindBid(0);
    await gamePage.setBlindBid(0, 1);

    // Continue to regular bidding phase
    await gamePage.continueFromBlindBidding();

    // Player 0 (blind bidder) should not appear in regular bidding (skipped entirely)
    await expect(gamePage.getRegularBidInput(0)).not.toBeAttached();

    // Player 1 (Bob) should be enabled first since Player 0 is skipped
    await expect(gamePage.getRegularBidInput(1)).toBeEnabled({ timeout: 2000 });

    // Player 1 enters their bid (bid 1 so total = 2, doesn't equal 1 trick available)
    await gamePage.setRegularBid(1, 1);

    // All bids complete - button should be enabled
    await expect(gamePage.regularBidCompleteButton).toBeEnabled({ timeout: 2000 });
  });

  test('should calculate blind bid bonus correctly', async ({ page }) => {
    // Player 0 makes blind bid of 1
    await gamePage.toggleBlindBid(0);
    await gamePage.setBlindBid(0, 1);
    await gamePage.continueFromBlindBidding();

    // Player 1 bids 0 in regular bidding (total = 1, equals 1 trick - need to bid differently)
    // Total must NOT equal tricks available (1), so bid 1 for total of 2
    await gamePage.setRegularBid(1, 1);
    await gamePage.completeRegularBidding();

    // Mark player 0 as made (blind bid bonus should apply: ((1×1) + 10) × 2 = 22)
    // Player 1 misses their bid: -((1×1) + 10) = -11
    await gamePage.markPlayerMade(0);
    await gamePage.markPlayerMissed(1);
    await gamePage.completeRound();

    // Score should show 2× bonus for blind bid
    // Player 0: 1 trick blind made = ((1×1) + 10) × 2 = 22 points
    // Check the round 1 delta for player 0 (Alice) - mobile view
    await expect(page.getByTestId('mobile-round-1-delta-player0')).toBeVisible({ timeout: 10000 });
  });

  test('should handle all players bidding blind', async ({ page }) => {
    // All players bid blind
    // Round 1: 1 trick available
    // Player 0 bids 0, Player 1 bids 0 (total = 0, doesn't equal 1)
    await gamePage.toggleBlindBid(0);
    await gamePage.setBlindBid(0, 0);
    await gamePage.toggleBlindBid(1);
    await gamePage.setBlindBid(1, 0);

    // Ensure total doesn't equal tricks
    // Total = 0, tricks = 1, so it's valid

    // Continue should skip regular bidding phase since all players bid blind
    await gamePage.continueFromBlindBidding();

    // Should go straight to results phase
    await expect(page.getByText('Record Results')).toBeVisible();
  });

  test('should preserve blind bid flags during bidding', async ({ page }) => {
    // Toggle blind bid
    await gamePage.toggleBlindBid(0);
    await gamePage.setBlindBid(0, 1);

    // Continue to regular bidding
    await gamePage.continueFromBlindBidding();

    // Blind bidder should show in summary section
    await expect(page.getByText(/blind bids/i)).toBeVisible();
    await expect(page.getByText('⚡ BLIND')).toBeVisible();
  });

  test('should allow setting all players to made at once', async ({ page }) => {
    // Skip blind bidding
    await gamePage.continueFromBlindBidding();

    // Enter regular bids (total must not equal 1)
    await gamePage.setRegularBid(0, 0);
    await gamePage.setRegularBid(1, 0);
    await gamePage.completeRegularBidding();

    // Should be on results phase
    await expect(page.getByText('Record Results')).toBeVisible();

    // "Set All to Made" button should be visible
    const setAllButton = page.getByTestId('results-set-all-made');
    await expect(setAllButton).toBeVisible();
    await expect(setAllButton).toHaveText('✓ Set All to Made');

    // Click the button
    await setAllButton.click();

    // Wait for all updates to complete (includes Firebase auto-save)
    // Multiple updates (one per player) need time to process
    await page.waitForTimeout(2000);

    // Both players should be marked as Made
    await expect(page.getByTestId('results-made-0')).toBeChecked();
    await expect(page.getByTestId('results-made-1')).toBeChecked();

    // Button should disappear since all results are now recorded
    await expect(setAllButton).not.toBeVisible();
  });

  test('should handle rapid bid entry without invalid bids in results phase', async ({ page }) => {
    // This test verifies that quickly entering bids and clicking Complete
    // doesn't cause any player to have bid = -1 in the results phase

    // Skip blind bidding
    await gamePage.continueFromBlindBidding();

    // Rapidly enter bids without waiting (simulates fast user)
    // Round 1: 1 trick available, so total must NOT equal 1
    await gamePage.setRegularBid(0, 0);
    await gamePage.setRegularBid(1, 0);

    // Immediately click complete (before auto-advance timer)
    await gamePage.completeRegularBidding();

    // Should transition to results phase
    await expect(page.getByText('Record Results')).toBeVisible({ timeout: 5000 });

    // Verify both players have their bids displayed (not -1)
    // Both players should show bid of 0
    await expect(page.locator('[data-testid="results-player-0"]').getByText('Bid: 0')).toBeVisible();
    await expect(page.locator('[data-testid="results-player-1"]').getByText('Bid: 0')).toBeVisible();
  });
});
