import type { PlayerScore } from "../../types";
import PlayerAvatar from "../PlayerAvatar";

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
      className={`flex flex-wrap items-center gap-3 text-sm bg-white p-4 rounded-lg border-2 border-blue-200 justify-between transition-all ${
        hasChange ? "animate-pulse ring-4 ring-yellow-400 shadow-lg" : ""
      }`}
    >
      <PlayerAvatar name={player.name} size="md" showName={true} />

      {/* Bid display with inline blind indicator */}
      <div className="flex items-center gap-2 flex-wrap">
        {player.bid >= 0 ? (
          <span className="text-gray-700 font-semibold">Bid: {player.bid}</span>
        ) : (
          <span className="text-gray-400 italic">Bid: waiting...</span>
        )}
        {player.blindBid && player.bid >= 0 && (
          <span className="px-2 py-0.5 bg-purple-600 text-white rounded text-xs font-bold">
            ⚡ BLIND
          </span>
        )}
      </div>

      {/* Show result if phase is results or completed */}
      {currentPhase === "results" && player.tricks >= 0 && (
        <>
          <span
            className={`font-medium ${
              player.met ? "text-green-700" : "text-red-600"
            }`}
          >
            {player.met ? "✓ Met" : "✗ Missed"}
          </span>
          <span
            className={`font-mono font-bold ml-auto ${
              player.score < 0 ? "text-red-600" : "text-green-700"
            }`}
          >
            {player.score > 0 ? "+" : ""}
            {player.score}
          </span>
        </>
      )}
    </div>
  );
}
