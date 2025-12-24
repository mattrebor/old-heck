import type { Round } from "../types";

export default function Totals({ rounds }: { rounds: Round[] }) {
  const totals: Record<string, number> = {};

  rounds.forEach((r) =>
    r.scores.forEach((s) => {
      totals[s.name] = (totals[s.name] ?? 0) + s.score;
    })
  );

  return (
    <div className="bg-gray-100 rounded p-4 mt-4">
      <h3 className="font-semibold mb-2">Totals</h3>
      {Object.entries(totals).map(([name, score]) => (
        <div key={name} className="flex justify-between">
          <span>{name}</span>
          <span className="font-mono">{score}</span>
        </div>
      ))}
    </div>
  );
}
