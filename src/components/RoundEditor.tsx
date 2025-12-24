import type { Round } from "../types";

export default function RoundEditor({
  round,
  onUpdate,
}: {
  round: Round;
  onUpdate: (playerIndex: number, tricks: number) => void;
}) {
  return (
    <div className="border-2 border-green-400 rounded p-4 mb-4 bg-green-50">
      <h3 className="font-semibold mb-3 text-green-900">
        Round {round.roundNumber} - Enter Results
      </h3>
      <p className="text-sm text-green-700 mb-3">
        Enter how many tricks each player actually took:
      </p>
      {round.scores.map((ps, i) => (
        <div key={i} className="grid grid-cols-5 gap-2 items-center mb-2">
          <span className="font-medium">{ps.name}</span>
          <span className="text-sm text-gray-600">Bid: {ps.bid}</span>
          <input
            type="number"
            min={0}
            placeholder="Tricks"
            className="border-2 border-green-300 rounded px-3 py-2 focus:border-green-500 focus:outline-none"
            value={ps.tricks || ""}
            onChange={(e) => onUpdate(i, Number(e.target.value))}
          />
          <span
            className={`text-sm font-medium ${
              ps.met ? "text-green-700" : "text-red-600"
            }`}
          >
            {ps.tricks > 0
              ? ps.met
                ? "✓ Met"
                : "✗ Missed"
              : ""}
          </span>
          <span
            className={`font-mono text-right font-bold ${
              ps.score < 0 ? "text-red-600" : "text-green-700"
            }`}
          >
            {ps.tricks > 0 ? ps.score : ""}
          </span>
        </div>
      ))}
    </div>
  );
}
