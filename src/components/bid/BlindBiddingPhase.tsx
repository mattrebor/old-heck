import type { Round } from "../../types";
import BidTrackerCard from "./BidTrackerCard";
import BlindBidPlayerCard from "./BlindBidPlayerCard";
import { getOrderedPlayerIndices, calculateBiddingValidation } from "../../utils/bidding";

interface BlindBiddingPhaseProps {
  round: Round;
  tricksAvailable: number;
  blindBidDecisions: boolean[];
  onToggleBlind: (index: number) => void;
  onBidChange: (index: number, bid: number) => void;
  onProceed: () => void;
}

export default function BlindBiddingPhase({
  round,
  tricksAvailable,
  blindBidDecisions,
  onToggleBlind,
  onBidChange,
  onProceed,
}: BlindBiddingPhaseProps) {
  // Calculate validation state
  const validation = calculateBiddingValidation(
    round.scores,
    tricksAvailable,
    blindBidDecisions
  );
  const { totalBids, bidsEqualTricks } = validation;
  const { allBlindBidsEntered, allPlayersBlind, canProceedFromBlindPhase } = validation;

  // Get players in bidding order
  const orderedIndices = getOrderedPlayerIndices(
    round.firstBidderIndex,
    round.scores.length
  );

  return (
    <div className="border-4 border-accent-500 rounded-2xl p-8 mb-8 bg-gradient-to-br from-purple-100 to-purple-200 shadow-card-hover">
      <h3 className="font-bold text-xl sm:text-2xl md:text-3xl mb-4 md:mb-6 text-purple-700 flex items-center gap-2 md:gap-3">
        <span className="text-2xl sm:text-3xl md:text-4xl">👁️</span>
        Round {round.roundNumber} - Blind Bid Phase
      </h3>
      <p className="text-base text-purple-600 mb-4 font-semibold">
        Will any players bid blind (without seeing their cards)? Check "Blind
        Bid" and enter your bid now. Blind bids earn{" "}
        <span className="text-purple-800 font-bold">DOUBLE</span> points!
      </p>

      <button
        onClick={onProceed}
        disabled={!canProceedFromBlindPhase}
        data-testid="bidding-blind-continue-button"
        className="w-full bg-gradient-to-r from-purple-600 to-purple-400 text-white px-6 py-4 rounded-xl text-lg font-bold shadow-card-hover hover:shadow-2xl hover:scale-105 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all mb-6"
      >
        {!allBlindBidsEntered
          ? "Enter all blind bids to continue"
          : allPlayersBlind && bidsEqualTricks
          ? "Adjust bids - total cannot equal books available"
          : allPlayersBlind
          ? "Start Round →"
          : "Continue to Regular Bidding →"}
      </button>

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
              onToggleBlind={onToggleBlind}
              onBidChange={onBidChange}
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
        onClick={onProceed}
        disabled={!canProceedFromBlindPhase}
        data-testid="bidding-blind-continue-button"
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
