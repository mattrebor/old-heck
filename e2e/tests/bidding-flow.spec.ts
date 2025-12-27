import { test, expect } from '@playwright/test';
import { GamePlayPage } from '../pages/GamePlayPage';

test.describe('Bidding Flow', () => {
  let gamePage: GamePlayPage;

  // TODO: These tests require authentication and game creation
  // For now, they serve as documentation of expected behavior
  // Once we add email/password auth for testing, we can uncomment and run these

  test.skip('should allow blind bidding', async ({ page }) => {
    gamePage = new GamePlayPage(page);

    // Navigate to a game (assumes game is created)
    // const gameId = await createTestGame(...);
    // await gamePage.goto(gameId);

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

  test.skip('should prevent total bids from equaling tricks available', async ({ page }) => {
    gamePage = new GamePlayPage(page);

    // Assume 2-player game, round 1 (1 trick available)
    // If both players bid 1, total = 2 which doesn't equal 1, so should be allowed
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

  test.skip('should show warning when bid exceeds cards in hand', async ({ page }) => {
    gamePage = new GamePlayPage(page);

    // Round 2: 2 tricks available
    // Bid 3 (more than available)
    await gamePage.setRegularBid(0, 3);

    // Should show warning
    await expect(page.getByText(/exceeds cards in hand/i)).toBeVisible();

    // But should still allow continuing (warning, not error)
    await expect(gamePage.regularBidCompleteButton).toBeEnabled();
  });

  test.skip('should enforce bidding order', async ({ page }) => {
    gamePage = new GamePlayPage(page);

    // First bidder's input should be enabled
    await expect(gamePage.getRegularBidInput(0)).toBeEnabled();

    // Other players' inputs should be disabled until it's their turn
    await expect(gamePage.getRegularBidInput(1)).toBeDisabled();

    // After first player bids
    await gamePage.setRegularBid(0, 1);

    // Wait for next player's input to become enabled
    await expect(gamePage.getRegularBidInput(1)).toBeEnabled({ timeout: 2000 });
  });

  test.skip('should calculate blind bid bonus correctly', async ({ page }) => {
    gamePage = new GamePlayPage(page);

    // Player makes blind bid of 1
    await gamePage.toggleBlindBid(0);
    await gamePage.setBlindBid(0, 1);
    await gamePage.continueFromBlindBidding();

    // Continue to results
    await gamePage.completeRegularBidding();

    // Mark as made
    await gamePage.markPlayerMade(0);

    // Score should show 2× bonus for blind bid
    // 1 trick = 10 points, blind = 20 points
    await expect(page.getByText(/\+20/)).toBeVisible();
  });

  test.skip('should handle all players bidding blind', async ({ page }) => {
    gamePage = new GamePlayPage(page);

    // All players bid blind
    await gamePage.toggleBlindBid(0);
    await gamePage.setBlindBid(0, 1);
    await gamePage.toggleBlindBid(1);
    await gamePage.setBlindBid(1, 0);

    // Ensure total doesn't equal tricks
    // (would show error if it does)

    // Continue should skip regular bidding phase
    await gamePage.continueFromBlindBidding();

    // Should go straight to results phase
    await expect(page.getByText('Record Results')).toBeVisible();
  });

  test.skip('should preserve blind bid flags during bidding', async ({ page }) => {
    gamePage = new GamePlayPage(page);

    // Toggle blind bid
    await gamePage.toggleBlindBid(0);
    await gamePage.setBlindBid(0, 1);

    // Continue to regular bidding
    await gamePage.continueFromBlindBidding();

    // Blind bidder should show in summary section
    await expect(page.getByText(/blind bids/i)).toBeVisible();
    await expect(page.getByText('⚡ BLIND')).toBeVisible();
  });
});
