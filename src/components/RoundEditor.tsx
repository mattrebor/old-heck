import type { Round } from "../types";
import { getSuitColor } from "../utils/suits";

export default function RoundEditor({
  round,
  onUpdate,
}: {
  round: Round;
  onUpdate: (playerIndex: number, madeBid: boolean) => void;
}) {
  return (
    <div className="border-4 border-card-result-success rounded-2xl p-8 mb-8 bg-gradient-to-br from-card-felt-100 to-card-felt-200 shadow-card-hover">
      <h3 className="font-bold text-3xl mb-6 text-card-result-success flex items-center gap-3">
        <span className="text-4xl">🏆</span>
        Round {round.roundNumber} - Record Results
      </h3>
      <p className="text-base text-gray-700 mb-6 font-semibold">
        For each player, mark if they made their bid or missed it:
      </p>
      {round.scores.map((ps, i) => (
        <div key={i} className="mb-5 p-6 bg-white rounded-xl border-3 border-gray-300 hover:border-card-accent-gold transition-all shadow-card hover:shadow-card-hover">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <span className={`text-5xl ${getSuitColor(ps.suit)}`}>
                {ps.suit}
              </span>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-xl text-gray-800">{ps.name}</span>
                  {ps.blindBid && (
                    <span className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm font-bold">
                      ⚡ BLIND 2X
                    </span>
                  )}
                </div>
                <div className="text-base text-gray-600 font-semibold">
                  Bid: {ps.bid} tricks {ps.blindBid && <span className="text-purple-600 font-bold">(Blind)</span>}
                </div>
              </div>

              <div className="flex gap-4 ml-6">
                <label className="flex items-center gap-3 cursor-pointer px-5 py-3 rounded-xl bg-card-result-successBg hover:bg-card-result-success hover:text-white border-2 border-card-result-success transition-all">
                  <input
                    type="radio"
                    name={`player-${i}`}
                    checked={ps.met}
                    onChange={() => onUpdate(i, true)}
                    className="w-6 h-6 text-card-result-success"
                  />
                  <span className="text-base font-bold">✓ Made it</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer px-5 py-3 rounded-xl bg-card-result-dangerBg hover:bg-card-result-danger hover:text-white border-2 border-card-result-danger transition-all">
                  <input
                    type="radio"
                    name={`player-${i}`}
                    checked={ps.tricks >= 0 && !ps.met}
                    onChange={() => onUpdate(i, false)}
                    className="w-6 h-6 text-card-result-danger"
                  />
                  <span className="text-base font-bold">✗ Missed it</span>
                </label>
              </div>
            </div>

            <div className="text-right">
              {ps.tricks >= 0 && (
                <div className={`font-mono text-5xl font-bold ${
                  ps.score < 0 ? 'text-card-result-danger' : 'text-card-result-success'
                }`}>
                  {ps.score > 0 ? '+' : ''}{ps.score}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
