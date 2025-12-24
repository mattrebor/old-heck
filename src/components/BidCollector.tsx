import type { Round } from "../types";

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
  const totalBids = round.scores.reduce((sum, ps) => sum + ps.bid, 0);
  const bidsEqualTricks = totalBids === tricksAvailable;
  const canProceed = allBidsEntered && !bidsEqualTricks;

  return (
    <div className="border-2 border-blue-400 rounded p-4 mb-4 bg-blue-50">
      <h3 className="font-semibold mb-3 text-blue-900">
        Round {round.roundNumber} - Enter Bids
      </h3>
      <p className="text-sm text-blue-700 mb-3">
        Each player, enter how many tricks you bid to take:
      </p>
      <div className="mb-3 p-2 bg-blue-100 rounded text-sm text-blue-900">
        <strong>Tricks available:</strong> {tricksAvailable} ·
        <strong className="ml-2">Total bids:</strong> {totalBids}
        {allBidsEntered && bidsEqualTricks && (
          <span className="ml-2 text-red-700 font-semibold">
            ⚠ Total bids cannot equal tricks available!
          </span>
        )}
      </div>
      {round.scores.map((ps, i) => (
        <div key={i} className="grid grid-cols-3 gap-2 items-center mb-2">
          <span className="font-medium">{ps.name}</span>
          <input
            type="number"
            min={0}
            placeholder="Bid"
            className="border-2 border-blue-300 rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
            value={ps.bid || ""}
            onChange={(e) => onUpdate(i, Number(e.target.value))}
          />
          <span className="text-sm text-gray-600">
            {ps.bid > 0 ? `Bid: ${ps.bid}` : ""}
          </span>
        </div>
      ))}
      {bidsEqualTricks && allBidsEntered && (
        <div className="mb-3 p-3 bg-red-50 border border-red-300 rounded text-sm text-red-800">
          <strong>Rule violation:</strong> The total of all bids ({totalBids}) cannot equal the number of tricks available ({tricksAvailable}).
          The last player to bid must adjust their bid to ensure someone will fail.
        </div>
      )}
      <button
        onClick={onComplete}
        disabled={!canProceed}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
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
