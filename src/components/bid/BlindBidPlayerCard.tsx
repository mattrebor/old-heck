import type { PlayerScore } from "../../types";
import PlayerAvatar from "../PlayerAvatar";

type BlindBidPlayerCardProps = {
  player: PlayerScore;
  index: number;
  tricksAvailable: number;
  isBlindBidder: boolean;
  onToggleBlind: (index: number) => void;
  onBidChange: (index: number, bid: number) => void;
};

export default function BlindBidPlayerCard({
  player,
  index,
  tricksAvailable,
  isBlindBidder,
  onToggleBlind,
  onBidChange,
}: BlindBidPlayerCardProps) {
  const bidTooHigh = isBlindBidder && player.bid >= 0 && player.bid > tricksAvailable;

  return (
    <div>
      <div
        className={`p-5 rounded-xl border-3 transition-all ${
          isBlindBidder
            ? "bg-purple-200 border-purple-500"
            : "bg-white border-purple-300"
        }`}
      >
        <div className="flex items-center justify-between mb-3 gap-4">
          <div className="flex items-center gap-2">
            <PlayerAvatar name={player.name} size="md" showName={true} />
            {isBlindBidder && (
              <span className="px-2 py-0.5 bg-purple-600 text-white rounded-lg text-xs font-bold whitespace-nowrap">
                ⚡ BLIND
              </span>
            )}
            {bidTooHigh && (
              <span className="px-1.5 py-0.5 bg-orange-500 text-white rounded text-xs font-bold whitespace-nowrap">
                ⚠
              </span>
            )}
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-base font-semibold text-gray-700">
                Blind Bid?
              </span>
              <input
                type="checkbox"
                checked={isBlindBidder}
                onChange={() => onToggleBlind(index)}
                className="w-6 h-6 text-purple-600 rounded focus:ring-purple-500"
              />
            </label>
          </div>
        </div>

        {isBlindBidder && (
          <div className="mt-4 pt-4 border-t-2 border-purple-400">
            <span className="text-base font-semibold text-purple-700 block mb-3">
              Enter your blind bid:
            </span>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() =>
                  onBidChange(index, Math.max(0, (player.bid >= 0 ? player.bid : 0) - 1))
                }
                className="bg-purple-500 hover:bg-purple-600 text-white font-bold text-lg w-9 h-9 rounded-lg transition-all"
              >
                −
              </button>
              <input
                type="number"
                min={0}
                placeholder="Bid"
                className="border-3 border-purple-400 rounded-xl px-2 py-2 w-14 text-center text-lg font-bold focus:border-purple-600 focus:outline-none focus:ring-4 focus:ring-purple-600/30 bg-white transition-all"
                value={player.bid >= 0 ? player.bid : ""}
                onChange={(e) =>
                  onBidChange(index, e.target.value === "" ? -1 : Number(e.target.value))
                }
              />
              <button
                onClick={() =>
                  onBidChange(index, (player.bid >= 0 ? player.bid : 0) + 1)
                }
                className="bg-purple-500 hover:bg-purple-600 text-white font-bold text-lg w-9 h-9 rounded-lg transition-all"
              >
                +
              </button>
            </div>
          </div>
        )}
      </div>
      {bidTooHigh && (
        <div className="mt-2 mb-2 px-3 py-2 bg-orange-100 border-2 border-orange-400 rounded-lg text-sm text-orange-800 font-semibold">
          ⚠ Warning: Bid ({player.bid}) exceeds cards in hand ({tricksAvailable})
        </div>
      )}
    </div>
  );
}
