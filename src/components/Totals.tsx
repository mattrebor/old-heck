import type { Round, Suit } from "../types";
import { getSuitColor } from "../utils/suits";

export default function Totals({ rounds }: { rounds: Round[] }) {
  if (rounds.length === 0) return null;

  // Get players from first round (maintains order)
  const players = rounds[0].scores.map(s => s.name);
  const playerSuits: Record<string, Suit> = {};

  rounds[0].scores.forEach(s => {
    playerSuits[s.name] = s.suit;
  });

  // Calculate totals for each player
  const totals: Record<string, number> = {};
  rounds.forEach((r) =>
    r.scores.forEach((s) => {
      totals[s.name] = (totals[s.name] ?? 0) + s.score;
    })
  );

  // Find the winner(s)
  const maxScore = Math.max(...Object.values(totals));

  return (
    <div className="bg-gradient-to-br from-card-felt-300 to-card-felt-200 rounded-2xl p-8 mt-8 border-4 border-card-felt-green shadow-card-hover">
      <h3 className="font-bold text-3xl mb-6 text-card-felt-dark flex items-center gap-3">
        <span className="text-4xl">📊</span>
        Score Breakdown
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-card-felt-green">
              <th className="text-left p-4 text-white font-bold text-lg border-2 border-card-felt-dark rounded-tl-xl">
                Round
              </th>
              {players.map((name) => (
                <th key={name} className="p-4 text-center text-white font-bold text-lg border-2 border-card-felt-dark last:rounded-tr-xl">
                  <div className="flex flex-col items-center gap-2">
                    <span className={`text-3xl ${getSuitColor(playerSuits[name])}`}>
                      {playerSuits[name]}
                    </span>
                    <span>{name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rounds.map((round) => (
              <tr key={round.roundNumber} className="bg-white hover:bg-gray-50 transition-colors">
                <td className="p-4 font-bold text-gray-700 border-2 border-gray-300">
                  Round {round.roundNumber}
                </td>
                {players.map((name) => {
                  const playerScore = round.scores.find(s => s.name === name);
                  if (!playerScore) return <td key={name} className="p-4 text-center border-2 border-gray-300">-</td>;

                  return (
                    <td key={name} className="p-4 text-center border-2 border-gray-300">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`font-mono text-xl font-bold ${
                          playerScore.score < 0 ? 'text-card-result-danger' : 'text-card-result-success'
                        }`}>
                          {playerScore.score > 0 ? '+' : ''}{playerScore.score}
                        </span>
                        <span className="text-xs text-gray-600">
                          Bid: {playerScore.bid}
                          {playerScore.blindBid && <span className="text-purple-600 font-bold ml-1">⚡</span>}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="bg-gradient-to-r from-card-felt-400 to-card-felt-300">
              <td className="p-4 font-bold text-white text-lg border-2 border-card-felt-dark rounded-bl-xl">
                TOTAL
              </td>
              {players.map((name) => {
                const isWinner = totals[name] === maxScore;
                return (
                  <td key={name} className={`p-4 text-center border-2 border-card-felt-dark last:rounded-br-xl ${
                    isWinner ? 'bg-gradient-to-br from-card-accent-gold to-card-accent-orange' : ''
                  }`}>
                    <div className="flex flex-col items-center gap-1">
                      {isWinner && <span className="text-2xl">👑</span>}
                      <span className={`font-mono text-2xl font-bold ${
                        isWinner ? 'text-white' : totals[name] < 0 ? 'text-card-result-danger' : 'text-white'
                      }`}>
                        {totals[name]}
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
