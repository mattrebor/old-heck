import type { PlayerScore } from "../../types";
import { hasResultRecorded } from "../../types";
import PlayerAvatar from "../PlayerAvatar";
import BidDisplay from "../BidDisplay";

type ViewOnlyPlayerCardProps = {
  player: PlayerScore;
  currentPhase: string | null;
  hasChange?: boolean;
  isCurrentBidder?: boolean;
  hasBid?: boolean;
};

export default function ViewOnlyPlayerCard({
  player,
  currentPhase,
  hasChange = false,
  isCurrentBidder = false,
  hasBid = false,
}: ViewOnlyPlayerCardProps) {
  const showBiddingIndicators = currentPhase === "bidding" && (isCurrentBidder || hasBid);

  return (
    <div
      className={`flex items-center gap-2 text-sm bg-white p-4 rounded-lg border-2 border-blue-200 transition-all ${
        hasChange ? "animate-pulse ring-4 ring-yellow-400 shadow-lg" : ""
      }`}
    >
      <div className="flex items-center gap-2 flex-shrink-0 min-w-0">
        {/* Only reserve space for bidding indicator during bidding phase */}
        {currentPhase === "bidding" && (
          <div className="flex items-center flex-shrink-0 w-6">
            {showBiddingIndicators ? (
              <>
                {isCurrentBidder && !hasBid ? (
                  <span className="px-1.5 py-0.5 bg-green-600 text-white rounded text-xs font-bold whitespace-nowrap">
                    👉
                  </span>
                ) : hasBid ? (
                  <span className="px-1.5 py-0.5 bg-gray-500 text-white rounded text-xs font-bold whitespace-nowrap">
                    ✓
                  </span>
                ) : null}
              </>
            ) : null}
          </div>
        )}
        <PlayerAvatar name={player.name} size="md" showName={true} />
      </div>

      <div className="flex-shrink-0">
        <BidDisplay
          bid={player.bid}
          isBlind={player.blindBid}
          size="md"
          waiting={player.bid < 0}
        />
      </div>

      {/* Always reserve space for results to maintain consistent layout */}
      <div className="flex items-center gap-2 justify-end flex-shrink-0 ml-auto" style={{ minWidth: '100px' }}>
        {currentPhase === "results" && hasResultRecorded(player) ? (
          <>
            <span
              className={`font-medium text-xs ${
                player.met ? "text-green-700" : "text-red-600"
              }`}
            >
              {player.met ? "✓ Met" : "✗ Missed"}
            </span>
            <span
              className={`font-mono font-bold text-sm ${
                player.score < 0 ? "text-red-600" : "text-green-700"
              }`}
            >
              {player.score > 0 ? "+" : ""}
              {player.score}
            </span>
          </>
        ) : (
          <span className="opacity-0">placeholder</span>
        )}
      </div>
    </div>
  );
}
