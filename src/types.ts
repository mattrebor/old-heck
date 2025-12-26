import type { Timestamp } from "firebase/firestore";

export type Suit = "♠" | "♥" | "♦" | "♣";

export type PlayerScore = {
  name: string;
  bid: number;
  met: boolean | null; // null = not yet recorded, true/false = result
  score: number;
  blindBid: boolean;
};

// Helper function to check if a player's result has been recorded
export function hasResultRecorded(player: PlayerScore): boolean {
  // met must be explicitly true or false (not null)
  // null = not recorded, true/false = recorded
  return player.met !== null;
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

export type ShareToken = {
  token: string; // 32-char cryptographically random string
  createdAt: number; // Unix timestamp
  usedAt: number | null; // null = unused, timestamp = used
  usedBy: string | null; // session ID of user who claimed it
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
  shareToken?: ShareToken;
};
