import { describe, it, expect } from "vitest";
import {
  getOrderedPlayerIndices,
  getNextBidder,
  calculateBiddingValidation,
  filterNonBlindBidders,
} from "./bidding";
import type { PlayerScore } from "../types";

describe("getOrderedPlayerIndices", () => {
  it("should return indices in order when first bidder is 0", () => {
    const result = getOrderedPlayerIndices(0, 4);
    expect(result).toEqual([0, 1, 2, 3]);
  });

  it("should rotate indices when first bidder is not 0", () => {
    const result = getOrderedPlayerIndices(2, 4);
    expect(result).toEqual([2, 3, 0, 1]);
  });

  it("should handle wrap-around at end of array", () => {
    const result = getOrderedPlayerIndices(3, 4);
    expect(result).toEqual([3, 0, 1, 2]);
  });

  it("should handle single player", () => {
    const result = getOrderedPlayerIndices(0, 1);
    expect(result).toEqual([0]);
  });

  it("should handle two players starting with second", () => {
    const result = getOrderedPlayerIndices(1, 2);
    expect(result).toEqual([1, 0]);
  });

  it("should handle six players starting with fourth", () => {
    const result = getOrderedPlayerIndices(3, 6);
    expect(result).toEqual([3, 4, 5, 0, 1, 2]);
  });
});

describe("getNextBidder", () => {
  const createPlayerScores = (bids: number[]): PlayerScore[] => {
    return bids.map((bid, i) => ({
      name: `Player ${i}`,
      bid,
      met: null,
      score: 0,
      blindBid: false,
    }));
  };

  it("should return first player without bid", () => {
    const scores = createPlayerScores([-1, -1, -1]);
    const orderedIndices = [0, 1, 2];
    const blindBidDecisions = [false, false, false];

    const result = getNextBidder(orderedIndices, scores, blindBidDecisions);
    expect(result).toBe(0);
  });

  it("should skip players who already bid", () => {
    const scores = createPlayerScores([3, -1, 2]);
    const orderedIndices = [0, 1, 2];
    const blindBidDecisions = [false, false, false];

    const result = getNextBidder(orderedIndices, scores, blindBidDecisions);
    expect(result).toBe(1);
  });

  it("should skip blind bidders", () => {
    const scores = createPlayerScores([-1, -1, -1]);
    const orderedIndices = [0, 1, 2];
    const blindBidDecisions = [true, false, false];

    const result = getNextBidder(orderedIndices, scores, blindBidDecisions);
    expect(result).toBe(1);
  });

  it("should skip both blind bidders and players who already bid", () => {
    const scores = createPlayerScores([2, 3, -1, -1]);
    const orderedIndices = [0, 1, 2, 3];
    const blindBidDecisions = [false, false, true, false];

    const result = getNextBidder(orderedIndices, scores, blindBidDecisions);
    expect(result).toBe(3);
  });

  it("should return null when all eligible players have bid", () => {
    const scores = createPlayerScores([2, 3, 1]);
    const orderedIndices = [0, 1, 2];
    const blindBidDecisions = [false, false, false];

    const result = getNextBidder(orderedIndices, scores, blindBidDecisions);
    expect(result).toBeNull();
  });

  it("should return null when only blind bidders remain", () => {
    const scores = createPlayerScores([2, -1, 3]);
    const orderedIndices = [0, 1, 2];
    const blindBidDecisions = [false, true, false];

    const result = getNextBidder(orderedIndices, scores, blindBidDecisions);
    expect(result).toBeNull();
  });

  it("should respect bidding order from orderedIndices", () => {
    const scores = createPlayerScores([-1, -1, -1]);
    const orderedIndices = [2, 0, 1]; // Different bidding order
    const blindBidDecisions = [false, false, false];

    const result = getNextBidder(orderedIndices, scores, blindBidDecisions);
    expect(result).toBe(2); // First in ordered indices
  });
});

describe("calculateBiddingValidation", () => {
  const createPlayerScores = (bids: number[]): PlayerScore[] => {
    return bids.map((bid, i) => ({
      name: `Player ${i}`,
      bid,
      met: null,
      score: 0,
      blindBid: false,
    }));
  };

  describe("Regular bidding phase (no blind decisions)", () => {
    it("should detect when all bids are entered", () => {
      const scores = createPlayerScores([2, 3, 1]);
      const result = calculateBiddingValidation(scores, 5);

      expect(result.allBidsEntered).toBe(true);
      expect(result.totalBids).toBe(6);
    });

    it("should detect when not all bids are entered", () => {
      const scores = createPlayerScores([2, -1, 1]);
      const result = calculateBiddingValidation(scores, 5);

      expect(result.allBidsEntered).toBe(false);
      expect(result.totalBids).toBe(3); // -1 bids don't count
    });

    it("should detect when bids equal tricks (rule violation)", () => {
      const scores = createPlayerScores([2, 2, 1]);
      const result = calculateBiddingValidation(scores, 5);

      expect(result.bidsEqualTricks).toBe(true);
      expect(result.canProceed).toBe(false); // Violation
    });

    it("should allow proceeding when bids don't equal tricks", () => {
      const scores = createPlayerScores([2, 2, 2]);
      const result = calculateBiddingValidation(scores, 5);

      expect(result.bidsEqualTricks).toBe(false);
      expect(result.canProceed).toBe(true);
    });

    it("should not allow proceeding when not all bids entered", () => {
      const scores = createPlayerScores([2, -1, 2]);
      const result = calculateBiddingValidation(scores, 5);

      expect(result.canProceed).toBe(false);
    });

    it("should calculate total bids correctly ignoring unsubmitted bids", () => {
      const scores = createPlayerScores([3, -1, 2, -1, 4]);
      const result = calculateBiddingValidation(scores, 10);

      expect(result.totalBids).toBe(9); // 3 + 2 + 4
    });

    it("should not include blind-phase fields when blind decisions not provided", () => {
      const scores = createPlayerScores([2, 3, 1]);
      const result = calculateBiddingValidation(scores, 5);

      expect(result.allBlindBidsEntered).toBeUndefined();
      expect(result.allPlayersBlind).toBeUndefined();
      expect(result.canProceedFromBlindPhase).toBeUndefined();
    });
  });

  describe("Blind bidding phase (with blind decisions)", () => {
    it("should detect when all blind bids are entered", () => {
      const scores = createPlayerScores([2, -1, 3]);
      const blindBidDecisions = [true, false, true];
      const result = calculateBiddingValidation(scores, 5, blindBidDecisions);

      expect(result.allBlindBidsEntered).toBe(true);
    });

    it("should detect when not all blind bids are entered", () => {
      const scores = createPlayerScores([2, -1, -1]);
      const blindBidDecisions = [true, false, true];
      const result = calculateBiddingValidation(scores, 5, blindBidDecisions);

      expect(result.allBlindBidsEntered).toBe(false);
    });

    it("should detect when all players are blind", () => {
      const scores = createPlayerScores([2, 3, 1]);
      const blindBidDecisions = [true, true, true];
      const result = calculateBiddingValidation(scores, 5, blindBidDecisions);

      expect(result.allPlayersBlind).toBe(true);
    });

    it("should detect when not all players are blind", () => {
      const scores = createPlayerScores([2, 3, 1]);
      const blindBidDecisions = [true, false, true];
      const result = calculateBiddingValidation(scores, 5, blindBidDecisions);

      expect(result.allPlayersBlind).toBe(false);
    });

    it("should allow proceeding when all blind bids entered and not all players blind", () => {
      const scores = createPlayerScores([2, -1, 3]);
      const blindBidDecisions = [true, false, true];
      const result = calculateBiddingValidation(scores, 5, blindBidDecisions);

      expect(result.canProceedFromBlindPhase).toBe(true);
    });

    it("should NOT allow proceeding when all players blind and bids equal tricks", () => {
      const scores = createPlayerScores([2, 2, 1]);
      const blindBidDecisions = [true, true, true];
      const result = calculateBiddingValidation(scores, 5, blindBidDecisions);

      expect(result.allPlayersBlind).toBe(true);
      expect(result.bidsEqualTricks).toBe(true);
      expect(result.canProceedFromBlindPhase).toBe(false);
    });

    it("should allow proceeding when all players blind but bids don't equal tricks", () => {
      const scores = createPlayerScores([2, 2, 2]);
      const blindBidDecisions = [true, true, true];
      const result = calculateBiddingValidation(scores, 5, blindBidDecisions);

      expect(result.allPlayersBlind).toBe(true);
      expect(result.bidsEqualTricks).toBe(false);
      expect(result.canProceedFromBlindPhase).toBe(true);
    });

    it("should not allow proceeding when not all blind bids entered", () => {
      const scores = createPlayerScores([2, -1, -1]);
      const blindBidDecisions = [true, false, true];
      const result = calculateBiddingValidation(scores, 5, blindBidDecisions);

      expect(result.canProceedFromBlindPhase).toBe(false);
    });

    it("should include all validation fields when blind decisions provided", () => {
      const scores = createPlayerScores([2, -1, 3]);
      const blindBidDecisions = [true, false, true];
      const result = calculateBiddingValidation(scores, 5, blindBidDecisions);

      expect(result).toHaveProperty("allBidsEntered");
      expect(result).toHaveProperty("totalBids");
      expect(result).toHaveProperty("bidsEqualTricks");
      expect(result).toHaveProperty("canProceed");
      expect(result).toHaveProperty("allBlindBidsEntered");
      expect(result).toHaveProperty("allPlayersBlind");
      expect(result).toHaveProperty("canProceedFromBlindPhase");
    });
  });

  describe("Edge cases", () => {
    it("should handle zero tricks available", () => {
      const scores = createPlayerScores([0, 0, 0]);
      const result = calculateBiddingValidation(scores, 0);

      expect(result.bidsEqualTricks).toBe(true);
      expect(result.canProceed).toBe(false);
    });

    it("should handle single player", () => {
      const scores = createPlayerScores([3]);
      const result = calculateBiddingValidation(scores, 3);

      expect(result.bidsEqualTricks).toBe(true);
      expect(result.canProceed).toBe(false);
    });

    it("should handle all players bidding zero", () => {
      const scores = createPlayerScores([0, 0, 0]);
      const result = calculateBiddingValidation(scores, 5);

      expect(result.totalBids).toBe(0);
      expect(result.canProceed).toBe(true);
    });
  });
});

describe("filterNonBlindBidders", () => {
  const createPlayerScores = (blindFlags: boolean[]): PlayerScore[] => {
    return blindFlags.map((blindBid, i) => ({
      name: `Player ${i}`,
      bid: -1,
      met: null,
      score: 0,
      blindBid,
    }));
  };

  it("should return all indices when no blind bidders", () => {
    const scores = createPlayerScores([false, false, false]);
    const orderedIndices = [0, 1, 2];

    const result = filterNonBlindBidders(orderedIndices, scores);
    expect(result).toEqual([0, 1, 2]);
  });

  it("should filter out blind bidders", () => {
    const scores = createPlayerScores([false, true, false]);
    const orderedIndices = [0, 1, 2];

    const result = filterNonBlindBidders(orderedIndices, scores);
    expect(result).toEqual([0, 2]);
  });

  it("should filter out all blind bidders", () => {
    const scores = createPlayerScores([true, true, true]);
    const orderedIndices = [0, 1, 2];

    const result = filterNonBlindBidders(orderedIndices, scores);
    expect(result).toEqual([]);
  });

  it("should maintain bidding order from orderedIndices", () => {
    const scores = createPlayerScores([false, true, false, true]);
    const orderedIndices = [2, 3, 0, 1]; // Rotated order

    const result = filterNonBlindBidders(orderedIndices, scores);
    expect(result).toEqual([2, 0]); // Maintains rotated order, excludes blind (indices 3 and 1)
  });

  it("should handle single player who is not blind", () => {
    const scores = createPlayerScores([false]);
    const orderedIndices = [0];

    const result = filterNonBlindBidders(orderedIndices, scores);
    expect(result).toEqual([0]);
  });

  it("should handle single player who is blind", () => {
    const scores = createPlayerScores([true]);
    const orderedIndices = [0];

    const result = filterNonBlindBidders(orderedIndices, scores);
    expect(result).toEqual([]);
  });
});
