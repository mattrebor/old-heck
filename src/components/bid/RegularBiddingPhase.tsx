import type { Round } from "../../types";
import BidTrackerCard from "./BidTrackerCard";
import BlindBidSummary from "./BlindBidSummary";
import RegularBidPlayerRow from "./RegularBidPlayerRow";
import { getOrderedPlayerIndices, calculateBiddingValidation } from "../../utils/bidding";

interface RegularBiddingPhaseProps {
  round: Round;
  tricksAvailable: number;
  blindBidDecisions: boolean[];
  currentBidderIndex: number | null;
  onBidChange: (index: number, bid: number) => void;
  onComplete: () => void;
}

export default function RegularBiddingPhase({
  round,
  tricksAvailable,
  blindBidDecisions,
  currentBidderIndex,
  onBidChange,
  onComplete,
}: RegularBiddingPhaseProps) {
  const hasBlindBidders = blindBidDecisions.some((b) => b);

  // Calculate validation state
  const validation = calculateBiddingValidation(
    round.scores,
    tricksAvailable,
    blindBidDecisions
  );
  const { allBidsEntered, totalBids, bidsEqualTricks, canProceed } = validation;

  // Get players in bidding order
  const orderedIndices = getOrderedPlayerIndices(
    round.firstBidderIndex,
    round.scores.length
  );

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
        const isCurrentBidder = i === currentBidderIndex;
        const hasBid = ps.bid >= 0;

        return (
          <RegularBidPlayerRow
            key={i}
            player={ps}
            index={i}
            tricksAvailable={tricksAvailable}
            isCurrentBidder={isCurrentBidder}
            hasBid={hasBid}
            onBidChange={onBidChange}
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
