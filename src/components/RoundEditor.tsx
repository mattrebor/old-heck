import type { Round } from "../types";

export default function RoundEditor({
  round,
  onUpdate,
}: {
  round: Round;
  onUpdate: (playerIndex: number, tricks: number, met: boolean) => void;
}) {
  return (
    <div className="border rounded p-4 mb-4">
      <h3 className="font-semibold mb-3">Round {round.roundNumber}</h3>
      {round.scores.map((ps, i) => (
        <div key={i} className="grid grid-cols-4 gap-2 items-center mb-2">
          <span>{ps.name}</span>
          <input
            type="number"
            min={0}
            placeholder="Tricks"
            className="border rounded px-2 py-1"
            value={ps.tricks}
            onChange={(e) => onUpdate(i, Number(e.target.value), ps.met)}
          />
          <label className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              checked={ps.met}
              onChange={(e) => onUpdate(i, ps.tricks, e.target.checked)}
            />
            Met
          </label>
          <span
            className={`font-mono text-right ${
              ps.score < 0 ? "text-red-600" : "text-green-700"
            }`}
          >
            {ps.score}
          </span>
        </div>
      ))}
    </div>
  );
}
