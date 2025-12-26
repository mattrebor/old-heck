import { useState, useRef, useEffect } from "react";
import type { Round } from "../types";
import BidTrackerCard from "./bid/BidTrackerCard";
import BlindBidPlayerCard from "./bid/BlindBidPlayerCard";
import BlindBidSummary from "./bid/BlindBidSummary";
import RegularBidPlayerRow from "./bid/RegularBidPlayerRow";

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
  const [activeBidderIndex, setActiveBidderIndex] = useState<number | null>(null);
  const bidTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasBlindBidders = blindBidDecisions.some((b) => b);
  const allBidsEntered = round.scores.every((ps) => ps.bid >= 0);
  const totalBids = round.scores.reduce(
    (sum, ps) => sum + (ps.bid >= 0 ? ps.bid : 0),
    0
  );
  const bidsEqualTricks = totalBids === tricksAvailable;
  const canProceed = allBidsEntered && !bidsEqualTricks;

  // Check if all blind bidders have entered their bids (needed for phase transition)
  const allBlindBidsEntered = blindBidDecisions.every((isBlind, i) => {
    if (!isBlind) return true; // Non-blind bidders don't need to bid yet
    return round.scores[i].bid >= 0;
  });

  // Check if all players bid blind
  const allPlayersBlind = blindBidDecisions.every((b) => b);

  // If all players are blind, can only proceed if bids don't equal tricks
  const canProceedFromBlindPhase = allBlindBidsEntered && (!allPlayersBlind || !bidsEqualTricks);

  // Initialize active bidder when entering regular bidding phase
  useEffect(() => {
    if (biddingPhase === "regular-bid-entry" && activeBidderIndex === null) {
      // Find first player who needs to bid (excluding blind bidders)
      const playerIndices = Array.from({ length: round.scores.length }, (_, i) => i);
      const orderedIndices = [
        ...playerIndices.slice(round.firstBidderIndex),
        ...playerIndices.slice(0, round.firstBidderIndex)
      ];

      const firstNonBlindBidder = orderedIndices.find(idx => {
        if (blindBidDecisions[idx]) return false;
        return round.scores[idx].bid === -1;
      });

      if (firstNonBlindBidder !== undefined) {
        setActiveBidderIndex(firstNonBlindBidder);
      }
    }
  }, [biddingPhase, activeBidderIndex, round.scores, round.firstBidderIndex, blindBidDecisions]);

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

    // Clear the bid if unchecking blind bid
    if (!updated[index] && round.scores[index].bid >= 0) {
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
      setBiddingPhase("regular-bid-entry");
      onPhaseChange?.("regular-bid-entry");
    }
  }

  function handleRegularBidChange(index: number, bid: number) {
    onUpdate(index, bid, false);

    // Clear existing timer
    if (bidTimerRef.current) {
      clearTimeout(bidTimerRef.current);
      bidTimerRef.current = null;
    }

    // If this is the active bidder and they entered a valid bid, start delay timer
    if (index === activeBidderIndex && bid >= 0) {
      bidTimerRef.current = setTimeout(() => {
        // Find next player who needs to bid
        const playerIndices = Array.from({ length: round.scores.length }, (_, i) => i);
        const orderedIndices = [
          ...playerIndices.slice(round.firstBidderIndex),
          ...playerIndices.slice(0, round.firstBidderIndex)
        ];

        const nextBidder = orderedIndices.find(idx => {
          if (blindBidDecisions[idx]) return false;
          return round.scores[idx].bid === -1;
        });

        setActiveBidderIndex(nextBidder ?? null);
        bidTimerRef.current = null;
      }, BID_ADVANCE_DELAY_MS);
    }
  }

  // PHASE 1: Blind Bid Declaration and Entry (Combined)
  if (biddingPhase === "blind-declaration-and-entry") {
    // Create ordered list of player indices starting from firstBidderIndex
    // This shows players in the order they will bid during regular bidding phase
    const playerIndices = Array.from({ length: round.scores.length }, (_, i) => i);
    const orderedIndices = [
      ...playerIndices.slice(round.firstBidderIndex),
      ...playerIndices.slice(0, round.firstBidderIndex)
    ];

    return (
      <div className="border-4 border-accent-500 rounded-2xl p-8 mb-8 bg-gradient-to-br from-purple-100 to-purple-200 shadow-card-hover">
        <h3 className="font-bold text-xl sm:text-2xl md:text-3xl mb-4 md:mb-6 text-purple-700 flex items-center gap-2 md:gap-3">
          <span className="text-2xl sm:text-3xl md:text-4xl">👁️</span>
          Round {round.roundNumber} - Blind Bid Phase
        </h3>
        <p className="text-base text-purple-600 mb-6 font-semibold">
          Will any players bid blind (without seeing their cards)? Check "Blind
          Bid" and enter your bid now. Blind bids earn{" "}
          <span className="text-purple-800 font-bold">DOUBLE</span> points!
        </p>

        <BidTrackerCard
          tricksAvailable={tricksAvailable}
          totalBids={totalBids}
          variant="blind"
        />

        <div className="space-y-4 mb-6">
          {orderedIndices.map((i) => {
            const ps = round.scores[i];

            return (
              <BlindBidPlayerCard
                key={i}
                player={ps}
                index={i}
                tricksAvailable={tricksAvailable}
                isBlindBidder={blindBidDecisions[i]}
                onToggleBlind={toggleBlindBid}
                onBidChange={handleBlindBidChange}
              />
            );
          })}
        </div>

        {allPlayersBlind && allBlindBidsEntered && bidsEqualTricks && (
          <div className="mb-5 p-5 bg-red-100 border-3 border-red-500 rounded-xl text-base text-red-800 font-semibold">
            <strong>Rule violation:</strong> The total of all bids ({totalBids})
            cannot equal the number of books available ({tricksAvailable}). At least
            one player must adjust their bid to ensure someone will fail.
          </div>
        )}

        <button
          onClick={proceedToRegularBidding}
          disabled={!canProceedFromBlindPhase}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-400 text-white px-6 py-4 rounded-xl text-lg font-bold shadow-card-hover hover:shadow-2xl hover:scale-105 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
        >
          {!allBlindBidsEntered
            ? "Enter all blind bids to continue"
            : allPlayersBlind && bidsEqualTricks
            ? "Adjust bids - total cannot equal books available"
            : allPlayersBlind
            ? "Start Round →"
            : "Continue to Regular Bidding →"}
        </button>
      </div>
    );
  }

  // PHASE 2: Regular Bid Entry (non-blind bidders)
  // Create ordered list of player indices starting from firstBidderIndex
  const playerIndices = Array.from({ length: round.scores.length }, (_, i) => i);
  const orderedIndices = [
    ...playerIndices.slice(round.firstBidderIndex),
    ...playerIndices.slice(0, round.firstBidderIndex)
  ];

  // Use activeBidderIndex to control who can bid (with delay)
  // This stays on the current bidder even after they enter a bid, allowing them to adjust
  const currentBidderIndex = activeBidderIndex;

  return (
    <div className="border-4 border-bid-500 rounded-2xl p-8 mb-8 bg-gradient-to-br from-bid-100 to-bid-200 shadow-card-hover">
      <h3 className="font-bold text-xl sm:text-2xl md:text-3xl mb-4 md:mb-6 text-bid-700 flex items-center gap-2 md:gap-3">
        <span className="text-2xl sm:text-3xl md:text-4xl">🎴</span>
        Round {round.roundNumber} - Place Your Bids
      </h3>
      <p className="text-base text-bid-600 mb-6 font-semibold">
        {hasBlindBidders
          ? "Remaining players, enter your bids in order:"
          : "Enter your bids in order, starting with the first bidder:"}
      </p>

      <BidTrackerCard
        tricksAvailable={tricksAvailable}
        totalBids={totalBids}
        variant="regular"
      />

      <BlindBidSummary
        players={round.scores}
        blindBidDecisions={blindBidDecisions}
        tricksAvailable={tricksAvailable}
      />

      {/* Show regular bidders (in bidding order) */}
      {orderedIndices.map((i) => {
        if (blindBidDecisions[i]) return null; // Skip blind bidders

        const ps = round.scores[i];
        const isFirstBidder = i === round.firstBidderIndex;
        const isCurrentBidder = i === currentBidderIndex;
        const hasBid = ps.bid >= 0;

        return (
          <RegularBidPlayerRow
            key={i}
            player={ps}
            index={i}
            tricksAvailable={tricksAvailable}
            isFirstBidder={isFirstBidder}
            isCurrentBidder={isCurrentBidder}
            hasBid={hasBid}
            onBidChange={handleRegularBidChange}
          />
        );
      })}

      {bidsEqualTricks && allBidsEntered && (
        <div className="mb-5 p-5 bg-red-100 border-3 border-red-500 rounded-xl text-base text-red-800 font-semibold">
          <strong>Rule violation:</strong> The total of all bids ({totalBids})
          cannot equal the number of books available ({tricksAvailable}). The
          last player to bid must adjust their bid to ensure someone will fail.
        </div>
      )}

      <button
        onClick={onComplete}
        disabled={!canProceed}
        className="mt-6 bg-gradient-to-r from-bid-600 to-bid-400 text-white px-8 py-5 rounded-xl text-xl font-bold shadow-card-hover hover:shadow-2xl hover:scale-105 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all w-full"
      >
        {!allBidsEntered
          ? "Enter all bids to continue"
          : bidsEqualTricks
          ? "Adjust bids - total cannot equal books available"
          : "Start Round →"}
      </button>
    </div>
  );
}
