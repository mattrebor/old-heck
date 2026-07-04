import { describe, it, expect } from 'vitest';
import { calculateMaxRounds } from './rounds';

describe('calculateMaxRounds', () => {
  describe('Single deck games', () => {
    it('should calculate max rounds for 2 players', () => {
      expect(calculateMaxRounds(1, 2)).toBe(25);
    });

    it('should calculate max rounds for 3 players', () => {
      expect(calculateMaxRounds(1, 3)).toBe(17);
    });

    it('should calculate max rounds for 4 players', () => {
      expect(calculateMaxRounds(1, 4)).toBe(12);
    });

    it('should calculate max rounds for 5 players', () => {
      expect(calculateMaxRounds(1, 5)).toBe(10);
    });

    it('should calculate max rounds for 6 players', () => {
      expect(calculateMaxRounds(1, 6)).toBe(8);
    });

    it('should calculate max rounds for 13 players (edge case)', () => {
      expect(calculateMaxRounds(1, 13)).toBe(3);
    });
  });

  describe('Multiple deck games', () => {
    it('should calculate max rounds for 2 decks, 4 players', () => {
      expect(calculateMaxRounds(2, 4)).toBe(25);
    });

    it('should calculate max rounds for 2 decks, 8 players', () => {
      expect(calculateMaxRounds(2, 8)).toBe(12);
    });

    it('should calculate max rounds for 3 decks, 6 players', () => {
      expect(calculateMaxRounds(3, 6)).toBe(25);
    });

    it('should calculate max rounds for 3 decks, 12 players', () => {
      expect(calculateMaxRounds(3, 12)).toBe(12);
    });
  });

  describe('Edge cases', () => {
    it('should handle 1 deck with 1 player', () => {
      expect(calculateMaxRounds(1, 1)).toBe(51);
    });

    it('should handle many decks', () => {
      expect(calculateMaxRounds(10, 4)).toBe(129);
    });

    it('should handle large number of players with multiple decks', () => {
      expect(calculateMaxRounds(5, 20)).toBe(12);
    });
  });

  describe('Formula verification', () => {
    it('should follow the formula: (52 * decks - 1) / players', () => {
      const decks = 2;
      const players = 5;
      const expected = Math.floor((52 * decks - 1) / players);
      expect(calculateMaxRounds(decks, players)).toBe(expected);
    });
  });
});
