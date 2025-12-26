import type { PlayerScore } from "../types";

/**
 * Bidding validation state interface
 */
export interface BiddingValidationState {
  allBidsEntered: boolean;
  totalBids: number;
  bidsEqualTricks: boolean;
  canProceed: boolean;
  // Blind phase specific fields
  allBlindBidsEntered?: boolean;
  allPlayersBlind?: boolean;
  canProceedFromBlindPhase?: boolean;
}

/**
 * Get player indices in bidding order starting from first bidder
 *
 * Creates a rotated array of player indices where the first bidder
 * comes first, followed by players in sequential order wrapping around.
 *
 * @param firstBidderIndex - Index of the player who bids first (0-based)
 * @param playerCount - Total number of players in the game
 * @returns Array of player indices in bidding order
 *
 * @example
 * // 4 players, first bidder is player 2
 * getOrderedPlayerIndices(2, 4) // returns [2, 3, 0, 1]
 *
 * @example
 * // 3 players, first bidder is player 0
 * getOrderedPlayerIndices(0, 3) // returns [0, 1, 2]
 */
export function getOrderedPlayerIndices(
  firstBidderIndex: number,
  playerCount: number
): number[] {
  const playerIndices = Array.from({ length: playerCount }, (_, i) => i);
  return [
    ...playerIndices.slice(firstBidderIndex),
    ...playerIndices.slice(0, firstBidderIndex),
  ];
}

/**
 * Find the next player who needs to bid
 *
 * Searches through ordered player indices to find the first player who:
 * 1. Is not bidding blind (excluded from regular bidding)
 * 2. Has not yet entered a bid (bid === -1)
 *
 * @param orderedIndices - Player indices in bidding order
 * @param scores - Array of player scores with bid information
 * @param blindBidDecisions - Boolean array indicating which players are bidding blind
 * @returns Index of next bidder, or null if all eligible players have bid
 *
 * @example
 * // Player 2 is blind, player 0 has bid, player 1 needs to bid
 * getNextBidder([2, 0, 1], scores, [false, false, true]) // returns 1
 */
export function getNextBidder(
  orderedIndices: number[],
  scores: PlayerScore[],
  blindBidDecisions: boolean[]
): number | null {
  const nextBidderIndex = orderedIndices.find((idx) => {
    if (blindBidDecisions[idx]) return false; // Skip blind bidders
    return scores[idx].bid === -1; // Find first player without a bid
  });

  return nextBidderIndex !== undefined ? nextBidderIndex : null;
}

/**
 * Calculate all bidding validation state
 *
 * Computes validation flags for the bidding phase including whether all bids
 * are entered, total bids, and rule violations (bids equaling tricks available).
 *
 * When blindBidDecisions is provided, also calculates blind-phase-specific
 * validation including whether all blind bids are entered.
 *
 * @param scores - Array of player scores with bid information
 * @param tricksAvailable - Number of tricks available in this round
 * @param blindBidDecisions - Optional boolean array indicating blind bidders
 * @returns Object containing all validation state flags
 *
 * @example
 * // Regular bidding phase
 * calculateBiddingValidation(scores, 5)
 * // Returns: { allBidsEntered: true, totalBids: 4, bidsEqualTricks: false, canProceed: true }
 *
 * @example
 * // Blind bidding phase with all players blind
 * calculateBiddingValidation(scores, 3, [true, true, true])
 * // Returns: { ..., allPlayersBlind: true, canProceedFromBlindPhase: false }
 */
export function calculateBiddingValidation(
  scores: PlayerScore[],
  tricksAvailable: number,
  blindBidDecisions?: boolean[]
): BiddingValidationState {
  const allBidsEntered = scores.every((ps) => ps.bid >= 0);
  const totalBids = scores.reduce(
    (sum, ps) => sum + (ps.bid >= 0 ? ps.bid : 0),
    0
  );
  const bidsEqualTricks = totalBids === tricksAvailable;
  const canProceed = allBidsEntered && !bidsEqualTricks;

  // If no blind bid decisions provided, return basic validation
  if (!blindBidDecisions) {
    return { allBidsEntered, totalBids, bidsEqualTricks, canProceed };
  }

  // Blind phase specific validation
  const allBlindBidsEntered = blindBidDecisions.every((isBlind, i) => {
    if (!isBlind) return true; // Non-blind bidders don't need to bid yet
    return scores[i].bid >= 0;
  });

  const allPlayersBlind = blindBidDecisions.every((b) => b);

  // If all players bid blind, can only proceed if bids don't equal tricks
  const canProceedFromBlindPhase =
    allBlindBidsEntered && (!allPlayersBlind || !bidsEqualTricks);

  return {
    allBidsEntered,
    totalBids,
    bidsEqualTricks,
    canProceed,
    allBlindBidsEntered,
    allPlayersBlind,
    canProceedFromBlindPhase,
  };
}

/**
 * Filter ordered indices to exclude blind bidders
 *
 * Returns a new array containing only the indices of players who are
 * not bidding blind, maintaining the original bidding order.
 *
 * @param orderedIndices - Player indices in bidding order
 * @param scores - Array of player scores with blindBid flag
 * @returns Filtered array of indices excluding blind bidders
 *
 * @example
 * // Players [0, 1, 2] where player 1 is blind
 * filterNonBlindBidders([0, 1, 2], scores) // returns [0, 2]
 */
export function filterNonBlindBidders(
  orderedIndices: number[],
  scores: PlayerScore[]
): number[] {
  return orderedIndices.filter((idx) => !scores[idx].blindBid);
}
