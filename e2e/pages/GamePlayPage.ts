import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the Game Play Page
 * Provides methods to interact with the game during play
 */
export class GamePlayPage {
  readonly page: Page;

  // Header
  readonly shareButton: Locator;
  readonly myGamesLink: Locator;
  readonly newGameLink: Locator;
  readonly signOutButton: Locator;

  // Game controls
  readonly editSetupButton: Locator;
  readonly endGameEarlyButton: Locator;
  readonly playersToggle: Locator;
  readonly startNextRoundButton: Locator;
  readonly newGameButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header
    this.shareButton = page.getByTestId('header-share-button');
    this.myGamesLink = page.getByTestId('header-mygames-link');
    this.newGameLink = page.getByTestId('header-newgame-link');
    this.signOutButton = page.getByTestId('header-signout-button');

    // Game controls
    this.editSetupButton = page.getByTestId('game-edit-setup-button');
    this.endGameEarlyButton = page.getByTestId('game-end-early-button');
    this.playersToggle = page.getByTestId('game-players-toggle');
    this.startNextRoundButton = page.getByTestId('game-start-next-round-button');
    this.newGameButton = page.getByTestId('game-new-game-button');
  }

  /**
   * Navigate to a specific game
   */
  async goto(gameId: string) {
    await this.page.goto(`/game/${gameId}`);
  }

  // ==================== Blind Bidding Phase ====================

  /**
   * Get blind bid checkbox for a player
   */
  getBlindBidCheckbox(playerIndex: number): Locator {
    return this.page.getByTestId(`bidding-blind-checkbox-${playerIndex}`);
  }

  /**
   * Get blind bid input for a player
   */
  getBlindBidInput(playerIndex: number): Locator {
    return this.page.getByTestId(`bidding-blind-input-${playerIndex}`);
  }

  /**
   * Get blind bid decrease button for a player
   */
  getBlindBidDecreaseButton(playerIndex: number): Locator {
    return this.page.getByTestId(`bidding-blind-decrease-${playerIndex}`);
  }

  /**
   * Get blind bid increase button for a player
   */
  getBlindBidIncreaseButton(playerIndex: number): Locator {
    return this.page.getByTestId(`bidding-blind-increase-${playerIndex}`);
  }

  /**
   * Get blind bidding continue button (top button)
   */
  get blindBidContinueButton(): Locator {
    return this.page.getByTestId('bidding-blind-continue-button-top');
  }

  /**
   * Toggle blind bid for a player
   */
  async toggleBlindBid(playerIndex: number) {
    const checkbox = this.getBlindBidCheckbox(playerIndex);
    // Wait for the checkbox to actually be present and stable before clicking.
    // During a round transition the editor re-renders from its own onSnapshot
    // echo, so the phase heading can be visible while player cards are still
    // (re)mounting. Waiting on the concrete element avoids a click that races
    // the re-render.
    await checkbox.waitFor({ state: 'visible', timeout: 15000 });
    await checkbox.click({ force: true });
    // Toggling blind on reveals the bid input. Wait for it to render so a
    // subsequent setBlindBid doesn't block on a not-yet-actionable input.
    await this.getBlindBidInput(playerIndex).waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Set blind bid for a player
   */
  async setBlindBid(playerIndex: number, bid: number) {
    const input = this.getBlindBidInput(playerIndex);
    await input.fill(bid.toString());
    // Deterministic: assert the value committed to the controlled input rather
    // than sleeping a fixed interval hoping the save/debounce landed.
    await expect(input).toHaveValue(bid.toString(), { timeout: 5000 });
  }

  /**
   * Continue from blind bidding phase
   */
  async continueFromBlindBidding() {
    // Wait for button to be enabled (all blind bids entered if any)
    await expect(this.blindBidContinueButton).toBeEnabled({ timeout: 10000 });
    await this.blindBidContinueButton.click({ force: true });
    // Wait for either regular bidding or results phase to appear
    // If all players bid blind, goes to results, otherwise goes to regular bidding
    await Promise.race([
      this.page.waitForSelector('text=/Place Your Bids/i', { timeout: 15000 }),
      this.page.waitForSelector('text=/Record Results/i', { timeout: 15000 })
    ]);
  }

  // ==================== Regular Bidding Phase ====================

  /**
   * Get regular bid input for a player
   */
  getRegularBidInput(playerIndex: number): Locator {
    return this.page.getByTestId(`bidding-regular-input-${playerIndex}`);
  }

  /**
   * Get regular bid decrease button for a player
   */
  getRegularBidDecreaseButton(playerIndex: number): Locator {
    return this.page.getByTestId(`bidding-regular-decrease-${playerIndex}`);
  }

  /**
   * Get regular bid increase button for a player
   */
  getRegularBidIncreaseButton(playerIndex: number): Locator {
    return this.page.getByTestId(`bidding-regular-increase-${playerIndex}`);
  }

  /**
   * Get regular bidding complete button
   */
  get regularBidCompleteButton(): Locator {
    return this.page.getByTestId('bidding-regular-complete-button');
  }

  /**
   * Set regular bid for a player
   */
  async setRegularBid(playerIndex: number, bid: number) {
    const input = this.getRegularBidInput(playerIndex);
    // Only the active bidder's input is enabled; the next player's input stays
    // disabled until the app's 1.5s advance timer fires and moves the turn on.
    // Waiting for this input to be enabled is a deterministic proxy for that
    // advancement, replacing a fixed sleep that races the timer.
    await expect(input).toBeEnabled({ timeout: 10000 });
    await input.fill(bid.toString());
    // Confirm the value committed to local state before moving on.
    await expect(input).toHaveValue(bid.toString(), { timeout: 5000 });
  }

  /**
   * Complete regular bidding phase
   */
  async completeRegularBidding() {
    // Wait for button to be enabled (all bids entered)
    await expect(this.regularBidCompleteButton).toBeEnabled({ timeout: 10000 });
    await this.regularBidCompleteButton.click({ force: true });
    // Wait for results phase to appear
    await this.page.waitForSelector('text=/Record Results/i', { timeout: 15000 });
  }

  // ==================== Results Recording Phase ====================

  /**
   * Get "Made" button for a player
   */
  getResultMadeButton(playerIndex: number): Locator {
    return this.page.getByTestId(`results-made-${playerIndex}`);
  }

  /**
   * Get "Missed" button for a player
   */
  getResultMissedButton(playerIndex: number): Locator {
    return this.page.getByTestId(`results-missed-${playerIndex}`);
  }

  /**
   * Get complete round button
   */
  get completeRoundButton(): Locator {
    return this.page.getByTestId('game-complete-round-button');
  }

  /**
   * Mark a player as having made their bid
   */
  async markPlayerMade(playerIndex: number) {
    await this.getResultMadeButton(playerIndex).click({ force: true });
    // Wait for React state to update (result selection is instant)
    await this.page.waitForTimeout(100);
  }

  /**
   * Mark a player as having missed their bid
   */
  async markPlayerMissed(playerIndex: number) {
    await this.getResultMissedButton(playerIndex).click({ force: true });
    // Wait for React state to update (result selection is instant)
    await this.page.waitForTimeout(100);
  }

  /**
   * Complete the round (after recording results)
   */
  async completeRound() {
    // Wait for button to be enabled (all results recorded)
    await this.completeRoundButton.waitFor({ state: 'attached', timeout: 10000 });
    await expect(this.completeRoundButton).toBeEnabled({ timeout: 10000 });
    await this.completeRoundButton.click({ force: true });
    // Wait for score review phase to appear (text like "Round 1 Complete!")
    await this.page.waitForSelector('text=/Round \\d+ Complete/i', { timeout: 15000 });
  }

  // ==================== Score Review Phase ====================

  /**
   * Start the next round
   */
  async startNextRound() {
    // Wait for the button to render before asserting it is enabled. On slower
    // staging runs the score-review phase (and its button) can take a moment to
    // appear, so wait for it to attach first, then be enabled, with generous
    // timeouts to avoid flaky failures at the round transition.
    await this.startNextRoundButton.waitFor({ state: 'attached', timeout: 15000 });
    await expect(this.startNextRoundButton).toBeEnabled({ timeout: 15000 });
    // Use force click to handle real-time updates causing re-renders
    await this.startNextRoundButton.click({ force: true });
    // Wait for the blind bidding phase heading AND the first player's blind
    // checkbox to actually render. Waiting only on the heading let a caller
    // click a checkbox that hadn't mounted yet (the editor re-renders from its
    // own onSnapshot echo during the round transition), which flaked.
    await this.page.waitForSelector('text=/Blind Bid Phase/i', { timeout: 15000 });
    await this.getBlindBidCheckbox(0).waitFor({ state: 'visible', timeout: 15000 });
  }

  // ==================== Totals ====================

  /**
   * Get round toggle button
   */
  getRoundToggle(roundNumber: number): Locator {
    return this.page.getByTestId(`totals-round-toggle-${roundNumber}`);
  }

  /**
   * Toggle (expand/collapse) a round in the totals table
   */
  async toggleRound(roundNumber: number) {
    await this.getRoundToggle(roundNumber).first().click({ force: true });
  }

  // ==================== Helper Methods ====================

  /**
   * Complete a full round: bidding → results → review
   */
  async completeFullRound(options: {
    blindBids?: Array<{ playerIndex: number; bid: number }>;
    regularBids: Array<{ playerIndex: number; bid: number }>;
    results: Array<{ playerIndex: number; made: boolean }>;
  }) {
    // Blind bidding phase
    if (options.blindBids && options.blindBids.length > 0) {
      for (const { playerIndex, bid } of options.blindBids) {
        await this.toggleBlindBid(playerIndex);
        await this.setBlindBid(playerIndex, bid);
      }
    }
    await this.continueFromBlindBidding();

    // Regular bidding phase
    for (const { playerIndex, bid } of options.regularBids) {
      await this.setRegularBid(playerIndex, bid);
    }
    await this.completeRegularBidding();

    // Wait for results phase
    await this.page.waitForTimeout(500);

    // Results recording
    for (const { playerIndex, made } of options.results) {
      if (made) {
        await this.markPlayerMade(playerIndex);
      } else {
        await this.markPlayerMissed(playerIndex);
      }
    }
    await this.completeRound();
  }

  /**
   * Wait for a specific phase to appear
   */
  async waitForPhase(phase: 'bidding' | 'results' | 'score-review' | 'completed') {
    const phaseTexts = {
      bidding: 'Blind Bid Phase',
      results: 'Record Results',
      'score-review': 'Complete!',
      completed: 'Game complete',
    };

    await this.page.waitForSelector(`text=${phaseTexts[phase]}`, { timeout: 15000 });
  }
}
