import type { Timestamp } from "firebase/firestore";

export type Suit = '♠' | '♥' | '♦' | '♣';

export type PlayerScore = {
  name: string;
  suit: Suit;
  bid: number;
  tricks: number;
  met: boolean;
  score: number;
  blindBid: boolean;
};

export type Round = {
  roundNumber: number;
  scores: PlayerScore[];
  firstBidderIndex: number;
};

export type GameSetup = {
  players: string[];
  decks: number;
  maxRounds: number;
};

export type Game = {
  id?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  status: 'in_progress' | 'completed';
  createdBy?: {
    uid: string;
    displayName: string | null;
    email: string | null;
  };
  setup: GameSetup;
  rounds: Round[];
  inProgressRound?: Round;
  currentPhase?: 'bidding' | 'results' | 'completed';
};
