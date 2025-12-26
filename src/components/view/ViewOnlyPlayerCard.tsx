import type { PlayerScore } from "../../types";
import { hasResultRecorded } from "../../types";
import PlayerAvatar from "../PlayerAvatar";
import BidDisplay from "../BidDisplay";

type ViewOnlyPlayerCardProps = {
  player: PlayerScore;
  currentPhase: string | null;
  hasChange?: boolean;
};

export default function ViewOnlyPlayerCard({
  player,
  currentPhase,
  hasChange = false,
}: ViewOnlyPlayerCardProps) {
  return (
    <div
      className={`flex items-center gap-3 text-sm bg-white p-4 rounded-lg border-2 border-blue-200 justify-between transition-all ${
        hasChange ? "animate-pulse ring-4 ring-yellow-400 shadow-lg" : ""
      }`}
    >
      <PlayerAvatar name={player.name} size="md" showName={true} />

      <BidDisplay
        bid={player.bid}
        isBlind={player.blindBid}
        size="md"
        waiting={player.bid < 0}
      />

      {/* Always reserve space for results to maintain consistent layout */}
      <div className="flex items-center gap-2 min-w-[120px] justify-end">
        {currentPhase === "results" && hasResultRecorded(player) ? (
          <>
            <span
              className={`font-medium ${
                player.met ? "text-green-700" : "text-red-600"
              }`}
            >
              {player.met ? "✓ Met" : "✗ Missed"}
            </span>
            <span
              className={`font-mono font-bold ${
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
