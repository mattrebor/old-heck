import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the Game Setup Page
 * Provides methods to interact with the game setup form
 */
export class GameSetupPage {
  readonly page: Page;

  // Locators
  readonly signInButton: Locator;
  readonly decksInput: Locator;
  readonly decksDecreaseButton: Locator;
  readonly decksIncreaseButton: Locator;
  readonly addPlayerButton: Locator;
  readonly firstPlayerSelect: Locator;
  readonly startButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators
    this.signInButton = page.getByTestId('setup-signin-button');
    this.decksInput = page.getByTestId('setup-decks-input');
    this.decksDecreaseButton = page.getByTestId('setup-decks-decrease-button');
    this.decksIncreaseButton = page.getByTestId('setup-decks-increase-button');
    this.addPlayerButton = page.getByTestId('setup-players-add-button');
    this.firstPlayerSelect = page.getByTestId('setup-firstplayer-select');
    this.startButton = page.getByTestId('setup-start-button');
  }

  /**
   * Navigate to the setup page
   */
  async goto() {
    await this.page.goto('/');
  }

  /**
   * Get player input by index
   */
  getPlayerInput(index: number): Locator {
    return this.page.getByTestId(`setup-players-input-${index}`);
  }

  /**
   * Get player remove button by index
   */
  getPlayerRemoveButton(index: number): Locator {
    return this.page.getByTestId(`setup-players-remove-${index}`);
  }

  /**
   * Get player move up button by index
   */
  getPlayerMoveUpButton(index: number): Locator {
    return this.page.getByTestId(`setup-players-moveup-${index}`);
  }

  /**
   * Get player move down button by index
   */
  getPlayerMoveDownButton(index: number): Locator {
    return this.page.getByTestId(`setup-players-movedown-${index}`);
  }

  /**
   * Set the number of decks
   */
  async setDecks(count: number) {
    await this.decksInput.fill(count.toString());
  }

  /**
   * Set player name by index
   */
  async setPlayerName(index: number, name: string) {
    await this.getPlayerInput(index).fill(name);
  }

  /**
   * Add a new player with the given name
   */
  async addPlayer(name?: string) {
    await this.addPlayerButton.click();

    if (name) {
      // Get the index of the newly added player
      const inputs = await this.page.getByTestId(/setup-players-input-\d+/).count();
      await this.setPlayerName(inputs - 1, name);
    }
  }

  /**
   * Remove a player by index
   */
  async removePlayer(index: number) {
    await this.getPlayerRemoveButton(index).click();
  }

  /**
   * Select the first player by index
   */
  async selectFirstPlayer(index: number) {
    await this.firstPlayerSelect.selectOption(index.toString());
  }

  /**
   * Start the game (submit the form)
   */
  async startGame() {
    await this.startButton.click();
  }

  /**
   * Setup a complete game with the given configuration
   * This is a convenience method for common setup flow
   */
  async setupGame(options: {
    decks?: number;
    players: string[];
    firstPlayerIndex?: number;
  }) {
    // Set decks if provided
    if (options.decks !== undefined) {
      await this.setDecks(options.decks);
    }

    // Set players
    for (let i = 0; i < options.players.length; i++) {
      if (i < 2) {
        // First 2 players are pre-filled, just update names
        await this.setPlayerName(i, options.players[i]);
      } else {
        // Add additional players
        await this.addPlayer(options.players[i]);
      }
    }

    // Select first player if provided
    if (options.firstPlayerIndex !== undefined) {
      await this.selectFirstPlayer(options.firstPlayerIndex);
    }

    // Start the game
    await this.startGame();
  }

  /**
   * Wait for navigation to game page after starting
   */
  async waitForGamePage() {
    await this.page.waitForURL(/\/game\/.+/);
  }

  /**
   * Get the current game ID from the URL
   */
  async getGameId(): Promise<string | null> {
    const url = this.page.url();
    const match = url.match(/\/game\/([^/]+)/);
    return match ? match[1] : null;
  }
}
