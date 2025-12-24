import type { Suit } from '../types';

export const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];

export function assignSuit(playerIndex: number): Suit {
  return SUITS[playerIndex % SUITS.length];
}

export function getSuitColor(suit: Suit): string {
  // Hearts and Diamonds are red, Spades and Clubs are black
  return suit === '♥' || suit === '♦' ? 'text-red-600' : 'text-gray-800';
}
