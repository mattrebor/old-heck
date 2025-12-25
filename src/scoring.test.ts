import { describe, it, expect } from 'vitest';
import { calculateOldHeckScore } from './scoring';

describe('calculateOldHeckScore', () => {
  describe('Regular bids (not blind)', () => {
    it('should calculate correct score for made bid of 0', () => {
      expect(calculateOldHeckScore(0, true, false)).toBe(10);
    });

    it('should calculate correct score for missed bid of 0', () => {
      expect(calculateOldHeckScore(0, false, false)).toBe(-10);
    });

    it('should calculate correct score for made bid of 1', () => {
      expect(calculateOldHeckScore(1, true, false)).toBe(11);
    });

    it('should calculate correct score for missed bid of 1', () => {
      expect(calculateOldHeckScore(1, false, false)).toBe(-11);
    });

    it('should calculate correct score for made bid of 3', () => {
      expect(calculateOldHeckScore(3, true, false)).toBe(19);
    });

    it('should calculate correct score for missed bid of 3', () => {
      expect(calculateOldHeckScore(3, false, false)).toBe(-19);
    });

    it('should calculate correct score for made bid of 5', () => {
      expect(calculateOldHeckScore(5, true, false)).toBe(35);
    });

    it('should calculate correct score for missed bid of 5', () => {
      expect(calculateOldHeckScore(5, false, false)).toBe(-35);
    });
  });

  describe('Blind bids (2x multiplier)', () => {
    it('should calculate correct score for blind made bid of 0', () => {
      expect(calculateOldHeckScore(0, true, true)).toBe(20);
    });

    it('should calculate correct score for blind missed bid of 0', () => {
      expect(calculateOldHeckScore(0, false, true)).toBe(-20);
    });

    it('should calculate correct score for blind made bid of 1', () => {
      expect(calculateOldHeckScore(1, true, true)).toBe(22);
    });

    it('should calculate correct score for blind missed bid of 1', () => {
      expect(calculateOldHeckScore(1, false, true)).toBe(-22);
    });

    it('should calculate correct score for blind made bid of 3', () => {
      expect(calculateOldHeckScore(3, true, true)).toBe(38);
    });

    it('should calculate correct score for blind missed bid of 3', () => {
      expect(calculateOldHeckScore(3, false, true)).toBe(-38);
    });

    it('should calculate correct score for blind made bid of 5', () => {
      expect(calculateOldHeckScore(5, true, true)).toBe(70);
    });

    it('should calculate correct score for blind missed bid of 5', () => {
      expect(calculateOldHeckScore(5, false, true)).toBe(-70);
    });
  });

  describe('Edge cases', () => {
    it('should handle large bid values', () => {
      expect(calculateOldHeckScore(10, true, false)).toBe(110);
      expect(calculateOldHeckScore(10, false, false)).toBe(-110);
    });

    it('should handle blind bid with large values', () => {
      expect(calculateOldHeckScore(10, true, true)).toBe(220);
      expect(calculateOldHeckScore(10, false, true)).toBe(-220);
    });
  });
});
