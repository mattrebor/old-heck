import { useState, useRef, useEffect, useMemo } from "react";
import type { Round } from "../types";
import BlindBiddingPhase from "./bid/BlindBiddingPhase";
import RegularBiddingPhase from "./bid/RegularBiddingPhase";
import {
  getOrderedPlayerIndices,
  getNextBidder,
  calculateBiddingValidation,
} from "../utils/bidding";

const BID_ADVANCE_DELAY_MS = 2000; // 2 second delay before moving to next bidder

export default function BidCollector({
  round,
  tricksAvailable,
  onUpdate,
  onComplete,
  initialPhase = "blind-declaration-and-entry",
  onPhaseChange,
}: {
  round: Round;
  tricksAvailable: number;
  onUpdate: (playerIndex: number, bid: number, blindBid: boolean) => void;
  onComplete: () => void;
  initialPhase?: "blind-declaration-and-entry" | "regular-bid-entry";
  onPhaseChange?: (phase: "blind-declaration-and-entry" | "regular-bid-entry") => void;
}) {
  const [biddingPhase, setBiddingPhase] = useState<
    "blind-declaration-and-entry" | "regular-bid-entry"
  >(initialPhase);
  const [blindBidDecisions, setBlindBidDecisions] = useState<boolean[]>(
    round.scores.map((ps) => ps.blindBid)
  );

  // Local bid state for regular bidding (not saved to Firebase until timer expires)
  const [localBids, setLocalBids] = useState<number[]>(
    round.scores.map(ps => ps.bid)
  );

  // Initialize active bidder immediately if starting in regular-bid-entry phase
  const [activeBidderIndex, setActiveBidderIndex] = useState<number | null>(() => {
    if (initialPhase === "regular-bid-entry") {
      const orderedIndices = getOrderedPlayerIndices(
        round.firstBidderIndex,
        round.scores.length
      );
      return getNextBidder(orderedIndices, round.scores, round.scores.map(ps => ps.blindBid));
    }
    return null;
  });

  const bidTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Create scores with local bids for validation
  const scoresWithLocalBids = round.scores.map((ps, i) => ({
    ...ps,
    bid: localBids[i],
  }));

  // Calculate validation to check if all players bid blind
  const validation = calculateBiddingValidation(
    scoresWithLocalBids,
    tricksAvailable,
    blindBidDecisions
  );
  const { allPlayersBlind } = validation;

  // Sync biddingPhase when initialPhase changes (for real-time updates from other users)
  useEffect(() => {
    if (initialPhase !== biddingPhase) {
      setBiddingPhase(initialPhase);

      // If transitioning to regular bidding, set the active bidder
      if (initialPhase === "regular-bid-entry") {
        // Sync local bids from server
        setLocalBids(round.scores.map(ps => ps.bid));

        const orderedIndices = getOrderedPlayerIndices(
          round.firstBidderIndex,
          round.scores.length
        );
        const blindBidDecisions = round.scores.map(ps => ps.blindBid);
        const nextBidder = getNextBidder(orderedIndices, round.scores, blindBidDecisions);
        setActiveBidderIndex(nextBidder);
      }
    }
  }, [initialPhase, biddingPhase, round]);

  // Sync blindBidDecisions when round changes (for real-time updates from other users)
  // Create a stable key from blind bid flags
  const blindBidsKey = useMemo(
    () => round.scores.map((ps) => ps.blindBid).join(','),
    [round.scores]
  );

  useEffect(() => {
    const serverBlindBids = round.scores.map((ps) => ps.blindBid);
    const hasChanged = serverBlindBids.some((serverBid, i) => serverBid !== blindBidDecisions[i]);

    if (hasChanged) {
      setBlindBidDecisions(serverBlindBids);
    }
  }, [blindBidsKey, blindBidDecisions, round.scores]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (bidTimerRef.current) {
        clearTimeout(bidTimerRef.current);
      }
    };
  }, []);

  function toggleBlindBid(index: number) {
    const updated = [...blindBidDecisions];
    updated[index] = !updated[index];
    setBlindBidDecisions(updated);

    // Save blind bid decision to Firebase immediately for real-time sync
    const currentBid = round.scores[index].bid;
    if (updated[index]) {
      // Checking blind bid - keep current bid (or -1 if none) and set blindBid flag
      onUpdate(index, currentBid, true);
    } else {
      // Unchecking blind bid - clear the bid
      onUpdate(index, -1, false);
    }
  }

  function handleBlindBidChange(index: number, bid: number) {
    onUpdate(index, bid, true);
  }

  function proceedToRegularBidding() {
    // Ensure all blind bid decisions are applied
    blindBidDecisions.forEach((blindBid, i) => {
      if (blindBid && round.scores[i].bid >= 0) {
        onUpdate(i, round.scores[i].bid, true);
      }
    });

    // If all players bid blind, skip regular bidding and complete
    if (allPlayersBlind) {
      onComplete();
    } else {
      // Update localBids to include the blind bids from the round
      setLocalBids(round.scores.map(ps => ps.bid));

      // Set the first active bidder before changing phase
      const orderedIndices = getOrderedPlayerIndices(
        round.firstBidderIndex,
        round.scores.length
      );
      const firstNonBlindBidder = getNextBidder(
        orderedIndices,
        round.scores,
        blindBidDecisions
      );
      setActiveBidderIndex(firstNonBlindBidder);

      setBiddingPhase("regular-bid-entry");
      onPhaseChange?.("regular-bid-entry");
    }
  }

  function handleRegularBidChange(index: number, bid: number) {
    // Clear existing timer first
    if (bidTimerRef.current) {
      clearTimeout(bidTimerRef.current);
      bidTimerRef.current = null;
    }

    // Update local bid state (not saved to Firebase yet)
    const updatedBids = [...localBids];
    updatedBids[index] = bid;
    setLocalBids(updatedBids);

    // Always start timer when a valid bid is entered
    // The timer allows 2 seconds for adjustments before saving and advancing
    if (bid >= 0) {
      bidTimerRef.current = setTimeout(() => {
        // Save the bid to Firebase
        onUpdate(index, bid, false);

        // Find next player who needs to bid using updated bids
        const updatedScores = round.scores.map((ps, i) => ({
          ...ps,
          bid: updatedBids[i],
        }));

        const orderedIndices = getOrderedPlayerIndices(
          round.firstBidderIndex,
          round.scores.length
        );

        const nextBidder = getNextBidder(
          orderedIndices,
          updatedScores,
          blindBidDecisions
        );

        setActiveBidderIndex(nextBidder);
        bidTimerRef.current = null;
      }, BID_ADVANCE_DELAY_MS);
    }
  }

  // PHASE 1: Blind Bid Declaration and Entry (Combined)
  if (biddingPhase === "blind-declaration-and-entry") {
    return (
      <BlindBiddingPhase
        round={round}
        tricksAvailable={tricksAvailable}
        blindBidDecisions={blindBidDecisions}
        onToggleBlind={toggleBlindBid}
        onBidChange={handleBlindBidChange}
        onProceed={proceedToRegularBidding}
      />
    );
  }

  // PHASE 2: Regular Bid Entry (non-blind bidders)
  // Create a modified round with local bids for display
  const roundWithLocalBids = {
    ...round,
    scores: round.scores.map((ps, i) => ({
      ...ps,
      bid: localBids[i],
    })),
  };

  return (
    <RegularBiddingPhase
      round={roundWithLocalBids}
      tricksAvailable={tricksAvailable}
      blindBidDecisions={blindBidDecisions}
      currentBidderIndex={activeBidderIndex}
      onBidChange={handleRegularBidChange}
      onComplete={onComplete}
    />
  );
}
