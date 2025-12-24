export function calculateOldHeckScore(tricks: number, met: boolean): number {
  return met ? tricks * tricks + 1 : -(tricks * tricks);
}
