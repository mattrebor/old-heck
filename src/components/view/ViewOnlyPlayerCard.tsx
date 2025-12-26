import { useState, useEffect, useRef } from "react";
import type { PlayerScore } from "../../types";
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
  const [resultsAnimating, setResultsAnimating] = useState(false);
  const prevResultsRef = useRef<{ score: number; met: boolean; tricks: number } | null>(null);

  // Detect when results change
  useEffect(() => {
    if (currentPhase === "results" && player.tricks >= 0) {
      // Only animate if we have previous results and they've changed
      if (prevResultsRef.current) {
        const changed =
          prevResultsRef.current.score !== player.score ||
          prevResultsRef.current.met !== player.met ||
          prevResultsRef.current.tricks !== player.tricks;

        if (changed) {
          setResultsAnimating(true);
          const timeout = setTimeout(() => setResultsAnimating(false), 1000);

          // Update previous results
          prevResultsRef.current = {
            score: player.score,
            met: player.met,
            tricks: player.tricks,
          };

          return () => clearTimeout(timeout);
        }
      } else {
        // First time seeing results - store them but don't animate
        prevResultsRef.current = {
          score: player.score,
          met: player.met,
          tricks: player.tricks,
        };
      }
    } else {
      // Reset when not in results phase
      prevResultsRef.current = null;
    }
  }, [player.score, player.met, player.tricks, currentPhase]);

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
      <div
        className={`flex items-center gap-2 min-w-[120px] justify-end transition-all ${
          resultsAnimating ? "animate-pulse" : ""
        }`}
      >
        {currentPhase === "results" && player.tricks >= 0 ? (
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
