import { useMemo } from "react";
import type { Round, PlayerScore } from "../types";
import {
  getOrderedPlayerIndices,
  getNextBidder,
  filterNonBlindBidders,
} from "../utils/bidding";

export interface BiddingViewModel {
  orderedIndices: number[];
  blindBidders: Array<{ ps: PlayerScore; i: number }>;
  nonBlindOrderedIndices: number[];
  nextBidderIndex: number | null;
  tricksAvailable: number;
  totalBids: number;
}

export function useBiddingViewModel(
  currentRound: Round | null,
  currentPhase: string | null,
  biddingPhase: "blind-declaration-and-entry" | "regular-bid-entry" | null
): BiddingViewModel | null {
  return useMemo(() => {
    if (!currentRound) return null;

    const orderedIndices = getOrderedPlayerIndices(
      currentRound.firstBidderIndex,
      currentRound.scores.length
    );

    const tricksAvailable = currentRound.roundNumber;
    const totalBids = currentRound.scores.reduce(
      (sum, ps) => sum + (ps.bid >= 0 ? ps.bid : 0),
      0
    );

    const blindBidders = currentRound.scores
      .map((ps, i) => ({ ps, i }))
      .filter(({ ps }) => ps.blindBid);

    const nonBlindOrderedIndices = filterNonBlindBidders(
      orderedIndices,
      currentRound.scores
    );

    const blindBidDecisions = currentRound.scores.map(ps => ps.blindBid);
    const nextBidderIndex = getNextBidder(
      orderedIndices,
      currentRound.scores,
      blindBidDecisions
    );

    return {
      orderedIndices,
      blindBidders,
      nonBlindOrderedIndices,
      nextBidderIndex,
      tricksAvailable,
      totalBids,
    };
  }, [currentRound, currentPhase, biddingPhase]);
}
