import type { PlayerScore } from "../../types";
import PlayerAvatar from "../PlayerAvatar";

type ResultPlayerCardProps = {
  player: PlayerScore;
  index: number;
  onUpdate: (index: number, madeBid: boolean) => void;
};

export default function ResultPlayerCard({
  player,
  index,
  onUpdate,
}: ResultPlayerCardProps) {
  return (
    <div className="mb-5 p-6 bg-white rounded-xl border-3 border-gray-300 hover:border-gold-500 transition-all shadow-card hover:shadow-card-hover">
      <div className="flex flex-col gap-4">
        {/* Player info */}
        <div className="flex items-center gap-4">
          <PlayerAvatar name={player.name} size="lg" showName={true} />
          <div className="flex flex-col gap-1 flex-1">
            {/* Badge container - always reserves space */}
            <div className="h-6">
              {player.blindBid && (
                <span className="px-2 py-1 bg-purple-600 text-white rounded-lg text-xs sm:text-sm font-bold inline-block">
                  ⚡ BLIND
                </span>
              )}
            </div>
            <div className="text-sm sm:text-base text-gray-600 font-semibold">
              Bid: {player.bid}
            </div>
          </div>
        </div>

        {/* Radio buttons - stacked on mobile, side by side on larger screens */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <label className="flex items-center gap-3 cursor-pointer px-4 py-3 rounded-xl bg-success-50 hover:bg-success-500 hover:text-white border-2 border-success-500 transition-all flex-1">
            <input
              type="radio"
              name={`player-${index}`}
              checked={player.met}
              onChange={() => onUpdate(index, true)}
              className="w-5 h-5 sm:w-6 sm:h-6 text-success-500"
            />
            <span className="text-sm sm:text-base font-bold">✓ Made it</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer px-4 py-3 rounded-xl bg-danger-50 hover:bg-danger-500 hover:text-white border-2 border-danger-500 transition-all flex-1">
            <input
              type="radio"
              name={`player-${index}`}
              checked={player.tricks >= 0 && !player.met}
              onChange={() => onUpdate(index, false)}
              className="w-5 h-5 sm:w-6 sm:h-6 text-danger-500"
            />
            <span className="text-sm sm:text-base font-bold">✗ Missed it</span>
          </label>
        </div>

        {/* Score display */}
        {player.tricks >= 0 && (
          <div className="text-center sm:text-right pt-2 border-t-2 border-gray-200">
            <div
              className={`font-mono text-3xl sm:text-4xl font-bold ${
                player.score < 0 ? "text-danger-500" : "text-success-500"
              }`}
            >
              {player.score > 0 ? "+" : ""}
              {player.score}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
