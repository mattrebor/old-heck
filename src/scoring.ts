/**
 * Calculate the score for a round of Old Heck based on bid outcome
 *
 * Scoring formula:
 * - Made bid: (tricks × tricks) + 10 points
 * - Missed bid: -((tricks × tricks) + 10) points
 * - Blind bid: 2x multiplier applied to base score
 *
 * @param tricks - The number of tricks bid by the player
 * @param met - Whether the player met their bid exactly
 * @param blindBid - Whether this was a blind bid (default: false)
 * @returns The calculated score (positive for made, negative for missed)
 *
 * @example
 * // Regular bid of 3, made
 * calculateOldHeckScore(3, true, false) // returns 19
 *
 * @example
 * // Blind bid of 3, missed
 * calculateOldHeckScore(3, false, true) // returns -38
 */
export function calculateOldHeckScore(tricks: number, met: boolean, blindBid: boolean = false): number {
  const baseScore = met ? tricks * tricks + 10 : -(tricks * tricks + 10);
  return blindBid ? baseScore * 2 : baseScore;
}
