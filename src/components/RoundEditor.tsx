import type { Round } from "../types";
import PlayerAvatar from "./PlayerAvatar";

export default function RoundEditor({
  round,
  onUpdate,
}: {
  round: Round;
  onUpdate: (playerIndex: number, madeBid: boolean) => void;
}) {
  return (
    <div className="border-4 border-success-500 rounded-2xl p-8 mb-8 bg-gradient-to-br from-felt-100 to-felt-200 shadow-card-hover">
      <h3 className="font-bold text-xl sm:text-2xl md:text-3xl mb-4 md:mb-6 text-success-500 flex items-center gap-2 md:gap-3">
        <span className="text-2xl sm:text-3xl md:text-4xl">🏆</span>
        Round {round.roundNumber} - Record Results
      </h3>
      <p className="text-base text-gray-700 mb-6 font-semibold">
        For each player, mark if they made their bid or missed it:
      </p>
      {round.scores.map((ps, i) => (
        <div
          key={i}
          className="mb-5 p-6 bg-white rounded-xl border-3 border-gray-300 hover:border-gold-500 transition-all shadow-card hover:shadow-card-hover"
        >
          <div className="flex flex-col gap-4">
            {/* Player info */}
            <div className="flex items-center gap-4">
              <PlayerAvatar name={ps.name} size="lg" showName={true} />
              <div className="flex flex-col gap-1 flex-1">
                {ps.blindBid && (
                  <span className="px-2 py-1 bg-purple-600 text-white rounded-lg text-xs sm:text-sm font-bold w-fit">
                    ⚡ BLIND 2X
                  </span>
                )}
                <div className="text-sm sm:text-base text-gray-600 font-semibold">
                  Bid: {ps.bid} books{" "}
                  {ps.blindBid && (
                    <span className="text-purple-600 font-bold">(Blind)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Radio buttons - stacked on mobile, side by side on larger screens */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <label className="flex items-center gap-3 cursor-pointer px-4 py-3 rounded-xl bg-success-50 hover:bg-success-500 hover:text-white border-2 border-success-500 transition-all flex-1">
                <input
                  type="radio"
                  name={`player-${i}`}
                  checked={ps.met}
                  onChange={() => onUpdate(i, true)}
                  className="w-5 h-5 sm:w-6 sm:h-6 text-success-500"
                />
                <span className="text-sm sm:text-base font-bold">
                  ✓ Made it
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer px-4 py-3 rounded-xl bg-danger-50 hover:bg-danger-500 hover:text-white border-2 border-danger-500 transition-all flex-1">
                <input
                  type="radio"
                  name={`player-${i}`}
                  checked={ps.tricks >= 0 && !ps.met}
                  onChange={() => onUpdate(i, false)}
                  className="w-5 h-5 sm:w-6 sm:h-6 text-danger-500"
                />
                <span className="text-sm sm:text-base font-bold">
                  ✗ Missed it
                </span>
              </label>
            </div>

            {/* Score display */}
            {ps.tricks >= 0 && (
              <div className="text-center sm:text-right pt-2 border-t-2 border-gray-200">
                <div
                  className={`font-mono text-3xl sm:text-4xl font-bold ${
                    ps.score < 0 ? "text-danger-500" : "text-success-500"
                  }`}
                >
                  {ps.score > 0 ? "+" : ""}
                  {ps.score}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
