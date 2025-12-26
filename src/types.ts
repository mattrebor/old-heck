import type { Timestamp } from "firebase/firestore";

export type Suit = "♠" | "♥" | "♦" | "♣";

export type PlayerScore = {
  name: string;
  bid: number;
  tricks?: number; // Deprecated: kept for backwards compatibility with existing games
  met: boolean | null; // null = not yet recorded, true/false = result
  score: number;
  blindBid: boolean;
};

// Helper function to check if a player's result has been recorded
export function hasResultRecorded(player: PlayerScore): boolean {
  // Backwards compatibility: if tricks field exists, use it as the sentinel
  // (old games used tricks >= 0 to indicate recorded, tricks < 0 for not recorded)
  if (player.tricks !== undefined) {
    return player.tricks >= 0;
  }

  // New way: met must be explicitly true or false (not null)
  // null = not recorded, true/false = recorded
  return player.met === true || player.met === false;
}

export type Round = {
  roundNumber: number;
  scores: PlayerScore[];
  firstBidderIndex: number;
};

export type GameSetup = {
  players: string[];
  decks: number;
  maxRounds: number;
  firstPlayerIndex: number;
};

export type Game = {
  id?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  status: "in_progress" | "completed";
  createdBy?: {
    uid: string;
    displayName: string | null;
    email: string | null;
  };
  setup: GameSetup;
  rounds: Round[];
  inProgressRound?: Round;
  currentPhase?: "bidding" | "results" | "score-review" | "completed";
  biddingPhase?: "blind-declaration-and-entry" | "regular-bid-entry";
};
