export function calculateOldHeckScore(tricks: number, met: boolean, blindBid: boolean = false): number {
  const baseScore = met ? tricks * tricks + 10 : -(tricks * tricks + 10);
  return blindBid ? baseScore * 2 : baseScore;
}
