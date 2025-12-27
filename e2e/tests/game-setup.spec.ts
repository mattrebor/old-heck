import { test, expect } from '@playwright/test';
import { GameSetupPage } from '../pages/GameSetupPage';

test.describe('Game Setup Flow', () => {
  let setupPage: GameSetupPage;

  test.beforeEach(async ({ page }) => {
    setupPage = new GameSetupPage(page);
    await setupPage.goto();
  });

  test('should display the setup form', async () => {
    // Should show the title
    await expect(setupPage.page.getByText('Old Heck')).toBeVisible();
    await expect(setupPage.page.getByText('Set Up Your Game')).toBeVisible();

    // Should require sign-in initially
    await expect(setupPage.signInButton).toBeVisible();
  });

  test.skip('should validate player names are required', async ({ page }) => {
    // Requires authentication to access form
    // TODO: Enable when auth is implemented

    // Try to clear a player name
    await setupPage.getPlayerInput(0).fill('');

    // Start button should be disabled with empty player name
    await expect(setupPage.startButton).toBeDisabled();
  });

  test.skip('should allow changing number of decks', async () => {
    // Requires authentication to access form
    // TODO: Enable when auth is implemented
    // Increase decks
    await setupPage.decksIncreaseButton.click();
    await expect(setupPage.decksInput).toHaveValue('2');

    // Decrease decks
    await setupPage.decksDecreaseButton.click();
    await expect(setupPage.decksInput).toHaveValue('1');

    // Should not go below 1
    await setupPage.decksDecreaseButton.click();
    await expect(setupPage.decksInput).toHaveValue('1');
  });

  test.skip('should allow adding and removing players', async () => {
    // Requires authentication to access form
    // TODO: Enable when auth is implemented

    // Initially has 2 players
    await expect(setupPage.getPlayerInput(0)).toBeVisible();
    await expect(setupPage.getPlayerInput(1)).toBeVisible();

    // Add a third player
    await setupPage.addPlayer('Charlie');
    await expect(setupPage.getPlayerInput(2)).toBeVisible();
    await expect(setupPage.getPlayerInput(2)).toHaveValue(/Player 3|Charlie/);

    // Remove the third player
    await setupPage.removePlayer(2);
    await expect(setupPage.getPlayerInput(2)).not.toBeVisible();

    // Cannot remove when only 2 players remain
    await expect(setupPage.getPlayerRemoveButton(0)).not.toBeVisible();
    await expect(setupPage.getPlayerRemoveButton(1)).not.toBeVisible();
  });

  test.skip('should allow reordering players', async () => {
    // Requires authentication to access form
    // TODO: Enable when auth is implemented

    await setupPage.setPlayerName(0, 'Alice');
    await setupPage.setPlayerName(1, 'Bob');

    // Move Bob up
    await setupPage.getPlayerMoveUpButton(1).click();

    // Bob should now be first
    await expect(setupPage.getPlayerInput(0)).toHaveValue('Bob');
    await expect(setupPage.getPlayerInput(1)).toHaveValue('Alice');

    // Move Alice down
    await setupPage.getPlayerMoveDownButton(1).click();

    // Should be back to original order
    await expect(setupPage.getPlayerInput(0)).toHaveValue('Bob');
    await expect(setupPage.getPlayerInput(1)).toHaveValue('Alice');
  });

  test.skip('should update first player selection when reordering', async () => {
    // Requires authentication to access form
    // TODO: Enable when auth is implemented

    await setupPage.setPlayerName(0, 'Alice');
    await setupPage.setPlayerName(1, 'Bob');

    // Select Bob as first player
    await setupPage.selectFirstPlayer(1);

    // Move Bob up (now index 0)
    await setupPage.getPlayerMoveUpButton(1).click();

    // First player dropdown should still show Bob selected
    const selectedValue = await setupPage.firstPlayerSelect.inputValue();
    expect(selectedValue).toBe('0'); // Bob is now at index 0
  });

  test.skip('should show validation errors for empty player names', async () => {
    // Requires authentication to access form
    // TODO: Enable when auth is implemented

    await setupPage.setPlayerName(0, 'Alice');
    await setupPage.setPlayerName(1, ''); // Empty name

    // Start button should be disabled
    await expect(setupPage.startButton).toBeDisabled();

    // Input should have error styling (red border)
    const input = setupPage.getPlayerInput(1);
    await expect(input).toHaveClass(/border-red/);
  });

  test.skip('should allow setting up a game with custom configuration', async () => {
    // Requires authentication to access form
    // TODO: Enable when auth is implemented

    // Set 2 decks
    await setupPage.setDecks(2);

    // Set up 3 players
    await setupPage.setPlayerName(0, 'Alice');
    await setupPage.setPlayerName(1, 'Bob');
    await setupPage.addPlayer('Charlie');

    // Select Bob as first player
    await setupPage.selectFirstPlayer(1);

    // Verify configuration
    await expect(setupPage.decksInput).toHaveValue('2');
    await expect(setupPage.getPlayerInput(0)).toHaveValue('Alice');
    await expect(setupPage.getPlayerInput(1)).toHaveValue('Bob');
    await expect(setupPage.getPlayerInput(2)).toHaveValue('Charlie');
    await expect(setupPage.firstPlayerSelect).toHaveValue('1');
  });

  // TODO: Add authenticated tests once we have email/password auth for testing
  // test('should create a new game when signed in', async () => {
  //   await signInWithTestUser(setupPage.page);
  //   await setupPage.setupGame({
  //     players: ['Alice', 'Bob'],
  //   });
  //   await setupPage.waitForGamePage();
  //   const gameId = await setupPage.getGameId();
  //   expect(gameId).toBeTruthy();
  // });
});
