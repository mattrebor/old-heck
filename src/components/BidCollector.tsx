import type { Round } from "../types";

export default function BidCollector({
  round,
  onUpdate,
  onComplete,
}: {
  round: Round;
  onUpdate: (playerIndex: number, bid: number) => void;
  onComplete: () => void;
}) {
  const allBidsEntered = round.scores.every((ps) => ps.bid >= 0);

  return (
    <div className="border-2 border-blue-400 rounded p-4 mb-4 bg-blue-50">
      <h3 className="font-semibold mb-3 text-blue-900">
        Round {round.roundNumber} - Enter Bids
      </h3>
      <p className="text-sm text-blue-700 mb-3">
        Each player, enter how many tricks you bid to take:
      </p>
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
      <button
        onClick={onComplete}
        disabled={!allBidsEntered}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {allBidsEntered ? "Start Round →" : "Enter all bids to continue"}
      </button>
    </div>
  );
}
