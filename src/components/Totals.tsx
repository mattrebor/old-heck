import type { Round, Suit } from "../types";
import { getSuitColor } from "../utils/suits";

export default function Totals({ rounds }: { rounds: Round[] }) {
  const totals: Record<string, number> = {};
  const playerSuits: Record<string, Suit> = {};

  rounds.forEach((r) =>
    r.scores.forEach((s) => {
      totals[s.name] = (totals[s.name] ?? 0) + s.score;
      if (!playerSuits[s.name]) {
        playerSuits[s.name] = s.suit;
      }
    })
  );

  // Sort by score (descending)
  const sortedPlayers = Object.entries(totals).sort((a, b) => b[1] - a[1]);

  return (
    <div className="bg-gradient-to-br from-card-felt-300 to-card-felt-200 rounded-2xl p-8 mt-8 border-4 border-card-felt-green shadow-card-hover">
      <h3 className="font-bold text-3xl mb-6 text-card-felt-dark flex items-center gap-3">
        <span className="text-4xl">📊</span>
        Score Totals
      </h3>
      <div className="space-y-4">
        {sortedPlayers.map(([name, score], index) => (
          <div
            key={name}
            className={`flex justify-between items-center p-5 rounded-xl transition-all ${
              index === 0
                ? 'bg-gradient-to-r from-card-accent-gold to-card-accent-orange border-4 border-card-accent-gold shadow-card-hover scale-105'
                : 'bg-white border-3 border-gray-300 hover:border-card-felt-green'
            }`}
          >
            <div className="flex items-center gap-4">
              {index === 0 && <span className="text-3xl">👑</span>}
              <span className={`text-4xl ${getSuitColor(playerSuits[name])}`}>
                {playerSuits[name]}
              </span>
              <span className={`font-bold text-xl ${index === 0 ? 'text-white' : 'text-gray-800'}`}>
                {name}
              </span>
            </div>
            <span className={`font-mono text-3xl font-bold ${
              index === 0
                ? 'text-white'
                : score < 0
                  ? 'text-card-result-danger'
                  : 'text-card-result-success'
            }`}>
              {score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
