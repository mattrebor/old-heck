import { useState } from "react";
import type { GameSetup } from "../types";

interface GameInfoHeaderProps {
  setup: GameSetup;
  completedRounds: number;
  gameStatus: string | null;
}

export default function GameInfoHeader({
  setup,
  completedRounds,
  gameStatus,
}: GameInfoHeaderProps) {
  const [playersExpanded, setPlayersExpanded] = useState(false);

  return (
    <div className="bg-gradient-to-r from-bid-100 to-accent-500/20 border-2 border-bid-400 rounded-lg p-3 mb-4 shadow-card">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm mb-2">
        <div className="font-semibold">
          <span className="text-blue-600">👁️</span>
          <span
            className={`ml-1 ${
              gameStatus === "completed" ? "text-green-700" : "text-blue-700"
            }`}
          >
            {gameStatus === "completed" ? "🎉 Complete" : "Live"}
          </span>
        </div>
        <div>
          <strong className="text-bid-700">Decks:</strong>{" "}
          <span className="text-gray-800">{setup.decks}</span>
        </div>
        <div>
          <strong className="text-bid-700">Rounds:</strong>{" "}
          <span className="text-gray-800">
            {completedRounds}/{setup.maxRounds}
          </span>
        </div>
      </div>
      <div className="border-t border-bid-300 pt-2">
        <button
          onClick={() => setPlayersExpanded(!playersExpanded)}
          className="flex items-center gap-2 text-sm font-semibold text-bid-700 hover:text-bid-800 transition-colors w-full"
        >
          <span className="text-xs">{playersExpanded ? "▼" : "▶"}</span>
          <span>Players ({setup.players.length})</span>
        </button>
        {playersExpanded && (
          <div className="mt-2 text-sm text-gray-800 pl-5">
            {setup.players.join(", ")}
          </div>
        )}
      </div>
    </div>
  );
}
