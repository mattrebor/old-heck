import { describe, it, expect } from 'vitest';
import { assignSuit, getSuitColor, SUITS } from './suits';

describe('assignSuit', () => {
  it('should assign spades to player 0', () => {
    expect(assignSuit(0)).toBe('♠');
  });

  it('should assign hearts to player 1', () => {
    expect(assignSuit(1)).toBe('♥');
  });

  it('should assign diamonds to player 2', () => {
    expect(assignSuit(2)).toBe('♦');
  });

  it('should assign clubs to player 3', () => {
    expect(assignSuit(3)).toBe('♣');
  });

  it('should cycle back to spades for player 4', () => {
    expect(assignSuit(4)).toBe('♠');
  });

  it('should cycle back to hearts for player 5', () => {
    expect(assignSuit(5)).toBe('♥');
  });

  it('should handle large player indices', () => {
    expect(assignSuit(12)).toBe('♠'); // 12 % 4 = 0
    expect(assignSuit(13)).toBe('♥'); // 13 % 4 = 1
    expect(assignSuit(14)).toBe('♦'); // 14 % 4 = 2
    expect(assignSuit(15)).toBe('♣'); // 15 % 4 = 3
  });

  it('should assign suits in correct order', () => {
    const suits = [0, 1, 2, 3].map(assignSuit);
    expect(suits).toEqual(['♠', '♥', '♦', '♣']);
  });
});

describe('getSuitColor', () => {
  it('should return red color class for hearts', () => {
    expect(getSuitColor('♥')).toBe('text-red-600');
  });

  it('should return red color class for diamonds', () => {
    expect(getSuitColor('♦')).toBe('text-red-600');
  });

  it('should return black color class for spades', () => {
    expect(getSuitColor('♠')).toBe('text-gray-800');
  });

  it('should return black color class for clubs', () => {
    expect(getSuitColor('♣')).toBe('text-gray-800');
  });
});

describe('SUITS constant', () => {
  it('should contain exactly 4 suits', () => {
    expect(SUITS).toHaveLength(4);
  });

  it('should contain the correct suits in order', () => {
    expect(SUITS).toEqual(['♠', '♥', '♦', '♣']);
  });
});
