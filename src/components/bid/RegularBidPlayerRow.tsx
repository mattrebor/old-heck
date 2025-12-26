import type { PlayerScore } from "../../types";
import PlayerAvatar from "../PlayerAvatar";

type RegularBidPlayerRowProps = {
  player: PlayerScore;
  index: number;
  tricksAvailable: number;
  isCurrentBidder: boolean;
  hasBid: boolean;
  onBidChange: (index: number, bid: number) => void;
};

export default function RegularBidPlayerRow({
  player,
  index,
  tricksAvailable,
  isCurrentBidder,
  hasBid,
  onBidChange,
}: RegularBidPlayerRowProps) {
  const canBid = isCurrentBidder || hasBid;
  const bidTooHigh = hasBid && player.bid > tricksAvailable;

  return (
    <div>
      <div
        className={`flex items-center justify-between gap-1 mb-2 p-2 rounded-xl border-3 transition-all ${
          isCurrentBidder
            ? "bg-green-50 border-green-500 shadow-lg"
            : hasBid
            ? "bg-white border-bid-300"
            : "bg-gray-50 border-gray-300 opacity-60"
        }`}
      >
        <div className="flex items-center gap-1 min-w-0">
          <div className="flex items-center flex-shrink-0 w-6">
            {isCurrentBidder && !hasBid ? (
              <span className="px-1.5 py-0.5 bg-green-600 text-white rounded text-xs font-bold whitespace-nowrap">
                👉
              </span>
            ) : hasBid && !bidTooHigh ? (
              <span className="px-1.5 py-0.5 bg-gray-500 text-white rounded text-xs font-bold whitespace-nowrap">
                ✓
              </span>
            ) : bidTooHigh ? (
              <span className="px-1.5 py-0.5 bg-orange-500 text-white rounded text-xs font-bold whitespace-nowrap">
                ⚠
              </span>
            ) : (
              <span className="w-6"></span>
            )}
          </div>
          <PlayerAvatar name={player.name} size="md" showName={true} />
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() =>
              onBidChange(index, Math.max(0, (player.bid >= 0 ? player.bid : 0) - 1))
            }
            disabled={!canBid}
            className={`font-bold text-lg w-9 h-9 rounded-lg transition-all ${
              canBid
                ? "bg-bid-500 hover:bg-bid-600 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            −
          </button>
          <input
            type="number"
            min={0}
            placeholder={canBid ? "Bid" : "Wait"}
            disabled={!canBid}
            className={`border-3 rounded-xl px-2 py-2 w-14 text-center text-lg font-bold transition-all ${
              canBid
                ? "border-bid-400 focus:border-gold-500 focus:outline-none focus:ring-4 focus:ring-gold-500/30 bg-bid-50"
                : "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
            value={player.bid >= 0 ? player.bid : ""}
            onChange={(e) =>
              onBidChange(index, e.target.value === "" ? -1 : Number(e.target.value))
            }
          />
          <button
            onClick={() => onBidChange(index, (player.bid >= 0 ? player.bid : 0) + 1)}
            disabled={!canBid}
            className={`font-bold text-lg w-9 h-9 rounded-lg transition-all ${
              canBid
                ? "bg-bid-500 hover:bg-bid-600 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            +
          </button>
        </div>
      </div>
      {bidTooHigh && (
        <div className="mb-3 px-3 py-2 bg-orange-100 border-2 border-orange-400 rounded-lg text-sm text-orange-800 font-semibold">
          ⚠ Warning: Bid ({player.bid}) exceeds cards in hand ({tricksAvailable})
        </div>
      )}
    </div>
  );
}
