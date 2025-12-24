import type { Round } from "../types";
import { getSuitColor } from "../utils/suits";

export default function BidCollector({
  round,
  tricksAvailable,
  onUpdate,
  onComplete,
}: {
  round: Round;
  tricksAvailable: number;
  onUpdate: (playerIndex: number, bid: number) => void;
  onComplete: () => void;
}) {
  const allBidsEntered = round.scores.every((ps) => ps.bid >= 0);
  const totalBids = round.scores.reduce((sum, ps) => sum + (ps.bid >= 0 ? ps.bid : 0), 0);
  const bidsEqualTricks = totalBids === tricksAvailable;
  const canProceed = allBidsEntered && !bidsEqualTricks;

  return (
    <div className="border-4 border-card-bid-500 rounded-2xl p-8 mb-8 bg-gradient-to-br from-card-bid-100 to-card-bid-200 shadow-card-hover">
      <h3 className="font-bold text-3xl mb-6 text-card-bid-700 flex items-center gap-3">
        <span className="text-4xl">🎴</span>
        Round {round.roundNumber} - Place Your Bids
      </h3>
      <p className="text-base text-card-bid-600 mb-6 font-semibold">
        Each player, enter how many tricks you bid to take:
      </p>
      <div className="mb-6 p-5 bg-card-bid-300 rounded-xl border-2 border-card-bid-500">
        <div className="text-base text-white font-bold">
          <strong>Tricks available:</strong> {tricksAvailable} ·
          <strong className="ml-2">Total bids:</strong> {totalBids}
          {allBidsEntered && bidsEqualTricks && (
            <span className="ml-2 text-yellow-300 font-bold">
              ⚠ Total bids cannot equal tricks available!
            </span>
          )}
        </div>
      </div>
      {round.scores.map((ps, i) => (
        <div key={i} className="grid grid-cols-[auto_1fr_auto] gap-4 items-center mb-5 p-5 bg-white rounded-xl border-3 border-card-bid-300 hover:border-card-accent-gold hover:shadow-card transition-all">
          <span className={`text-4xl ${getSuitColor(ps.suit)}`}>
            {ps.suit}
          </span>
          <span className="font-bold text-lg text-gray-800">{ps.name}</span>
          <input
            type="number"
            min={0}
            placeholder="Bid"
            className="border-3 border-card-bid-400 rounded-xl px-5 py-3 w-28 text-center text-xl font-bold focus:border-card-accent-gold focus:outline-none focus:ring-4 focus:ring-card-accent-gold/30 bg-card-bid-50 transition-all"
            value={ps.bid >= 0 ? ps.bid : ""}
            onChange={(e) => onUpdate(i, Number(e.target.value))}
          />
        </div>
      ))}
      {bidsEqualTricks && allBidsEntered && (
        <div className="mb-5 p-5 bg-red-100 border-3 border-red-500 rounded-xl text-base text-red-800 font-semibold">
          <strong>Rule violation:</strong> The total of all bids ({totalBids}) cannot equal the number of tricks available ({tricksAvailable}).
          The last player to bid must adjust their bid to ensure someone will fail.
        </div>
      )}
      <button
        onClick={onComplete}
        disabled={!canProceed}
        className="mt-6 bg-gradient-to-r from-card-bid-600 to-card-bid-400 text-white px-8 py-5 rounded-xl text-xl font-bold shadow-card-hover hover:shadow-2xl hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all w-full"
      >
        {!allBidsEntered
          ? "Enter all bids to continue"
          : bidsEqualTricks
          ? "Adjust bids - total cannot equal tricks available"
          : "Start Round →"}
      </button>
    </div>
  );
}
