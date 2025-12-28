import { test, expect } from '@playwright/test';
import { GamePlayPage } from '../pages/GamePlayPage';
import { GameSetupPage } from '../pages/GameSetupPage';
import { signInWithTestUser } from '../fixtures/auth';

test.describe('Bidding Flow', () => {
  let gamePage: GamePlayPage;
  let setupPage: GameSetupPage;

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

  test.skip('should show warning when bid exceeds cards in hand', async ({ page }) => {
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
    await gamePage.continueFromBlindBidding();

    // Try to bid more than 2 (cards in hand)
    await gamePage.setRegularBid(0, 3);

    // Should show warning
    await expect(page.getByText(/exceeds cards in hand/i)).toBeVisible();
  });

  test('should enforce bidding order', async ({ page }) => {
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

  test.skip('should calculate blind bid bonus correctly', async ({ page }) => {
    // Player 0 makes blind bid of 1
    await gamePage.toggleBlindBid(0);
    await gamePage.setBlindBid(0, 1);
    await gamePage.continueFromBlindBidding();

    // Player 1 bids 0 in regular bidding (total = 1, equals 1 trick - need to bid differently)
    // Total must NOT equal tricks available (1), so bid 1 for total of 2
    await gamePage.setRegularBid(1, 1);
    await gamePage.completeRegularBidding();

    // Mark player 0 as made (blind bid bonus should apply: 1 trick × 10 × 2 = 20)
    // Player 1 misses their bid (1 trick × -10 = -10)
    await gamePage.markPlayerMade(0);
    await gamePage.markPlayerMissed(1);
    await gamePage.completeRound();

    // Score should show 2× bonus for blind bid
    // Player 0: 1 trick blind made = 10 × 2 = 20 points
    await expect(page.getByText(/\+20/)).toBeVisible();
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
});
