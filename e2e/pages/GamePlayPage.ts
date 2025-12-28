import { Page, Locator } from '@playwright/test';

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
   * Get blind bidding continue button
   * Note: Uses .first() because there are mobile and desktop versions
   */
  get blindBidContinueButton(): Locator {
    return this.page.getByTestId('bidding-blind-continue-button').first();
  }

  /**
   * Toggle blind bid for a player
   */
  async toggleBlindBid(playerIndex: number) {
    await this.getBlindBidCheckbox(playerIndex).click({ force: true });
    // Wait for the blind bid input to become visible/enabled
    await this.page.waitForTimeout(300);
  }

  /**
   * Set blind bid for a player
   */
  async setBlindBid(playerIndex: number, bid: number) {
    await this.getBlindBidInput(playerIndex).fill(bid.toString());
  }

  /**
   * Continue from blind bidding phase
   */
  async continueFromBlindBidding() {
    await this.blindBidContinueButton.click({ force: true });
    // Wait for either regular bidding or results phase to appear
    // If all players bid blind, goes to results, otherwise goes to regular bidding
    await Promise.race([
      this.page.waitForSelector('text=/Place Your Bids/i', { timeout: 10000 }),
      this.page.waitForSelector('text=/Record Results/i', { timeout: 10000 })
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
    await this.getRegularBidInput(playerIndex).fill(bid.toString());
  }

  /**
   * Complete regular bidding phase
   */
  async completeRegularBidding() {
    await this.regularBidCompleteButton.click({ force: true });
    // Wait for results phase to appear
    await this.page.waitForSelector('text=/Record Results/i', { timeout: 10000 });
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
    // Wait briefly for state update
    await this.page.waitForTimeout(300);
  }

  /**
   * Mark a player as having missed their bid
   */
  async markPlayerMissed(playerIndex: number) {
    await this.getResultMissedButton(playerIndex).click({ force: true });
    // Wait briefly for state update
    await this.page.waitForTimeout(300);
  }

  /**
   * Complete the round (after recording results)
   */
  async completeRound() {
    await this.completeRoundButton.click({ force: true });
    // Wait for score review phase to appear (text like "Round 1 Complete!")
    await this.page.waitForSelector('text=/Round \\d+ Complete/i', { timeout: 10000 });
  }

  // ==================== Score Review Phase ====================

  /**
   * Start the next round
   */
  async startNextRound() {
    // Use force click to handle real-time updates causing re-renders
    await this.startNextRoundButton.click({ force: true });
    // Wait for blind bidding phase to appear
    await this.page.waitForSelector('text=/Blind Bid Phase/i', { timeout: 10000 });
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

    await this.page.waitForSelector(`text=${phaseTexts[phase]}`, { timeout: 10000 });
  }
}
