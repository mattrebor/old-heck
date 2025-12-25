import type { GameSetup, Round } from "../types";

/**
 * Calculate the maximum number of rounds based on decks and players
 *
 * Uses standard card game calculation: (52 cards × decks) ÷ players
 * Result is floored to ensure whole rounds only
 *
 * @param decks - Number of card decks in play
 * @param players - Number of players in the game
 * @returns Maximum number of rounds that can be played
 *
 * @example
 * // 1 deck, 4 players
 * calculateMaxRounds(1, 4) // returns 13
 *
 * @example
 * // 2 decks, 6 players
 * calculateMaxRounds(2, 6) // returns 17
 */
export function calculateMaxRounds(decks: number, players: number): number {
  return Math.floor((52 * decks) / players);
}

/**
 * Create a new round with initialized player scores
 *
 * Automatically rotates the first bidder based on round number.
 * All bids are initialized to -1 (not entered yet), and scores start at 0.
 *
 * @param gameSetup - Game configuration including players and first player index
 * @param roundNumber - The round number to create (1-indexed)
 * @returns A new Round object with initial state
 *
 * @example
 * // Create round 3 for a 4-player game
 * const setup = { players: ['Alice', 'Bob', 'Charlie', 'Dave'], firstPlayerIndex: 0, decks: 1, maxRounds: 13 };
 * const round = createRound(setup, 3);
 * // round.firstBidderIndex will be 2 (Charlie)
 */
export function createRound(
  gameSetup: GameSetup,
  roundNumber: number
): Round {
  // Rotate the first bidder each round, starting from the selected first player
  const firstBidderIndex =
    (gameSetup.firstPlayerIndex + (roundNumber - 1)) % gameSetup.players.length;

  return {
    roundNumber,
    scores: gameSetup.players.map((name) => ({
      name,
      bid: -1, // -1 indicates bid not entered yet
      tricks: 0,
      met: false,
      score: 0,
      blindBid: false,
    })),
    firstBidderIndex,
  };
}
