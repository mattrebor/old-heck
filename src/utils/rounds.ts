// Standard calculation: (52 cards * decks) / players
export function calculateMaxRounds(decks: number, players: number): number {
  return Math.floor((52 * decks) / players);
}
