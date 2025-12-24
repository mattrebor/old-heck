import type { Round } from "../types";

export default function RoundEditor({
  round,
  onUpdate,
}: {
  round: Round;
  onUpdate: (playerIndex: number, madeBid: boolean) => void;
}) {
  return (
    <div className="border-2 border-green-400 rounded p-4 mb-4 bg-green-50">
      <h3 className="font-semibold mb-3 text-green-900">
        Round {round.roundNumber} - Enter Results
      </h3>
      <p className="text-sm text-green-700 mb-3">
        For each player, check if they made their bid (or uncheck if they missed it):
      </p>
      {round.scores.map((ps, i) => (
        <div key={i} className="mb-3 p-4 bg-white rounded border border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-1">
                <div className="font-medium text-lg">{ps.name}</div>
                <div className="text-sm text-gray-600">Bid: {ps.bid}</div>
              </div>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`player-${i}`}
                    checked={ps.met}
                    onChange={() => onUpdate(i, true)}
                    className="w-5 h-5"
                  />
                  <span className="text-sm font-medium text-green-700">Made it</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`player-${i}`}
                    checked={ps.tricks >= 0 && !ps.met}
                    onChange={() => onUpdate(i, false)}
                    className="w-5 h-5"
                  />
                  <span className="text-sm font-medium text-red-600">Missed it</span>
                </label>
              </div>
            </div>

            <div className="text-right">
              {ps.tricks >= 0 && (
                <>
                  <div
                    className={`text-sm font-medium mb-1 ${
                      ps.met ? "text-green-700" : "text-red-600"
                    }`}
                  >
                    {ps.met ? "✓ Made" : "✗ Missed"}
                  </div>
                  <div
                    className={`font-mono text-2xl font-bold ${
                      ps.score < 0 ? "text-red-600" : "text-green-700"
                    }`}
                  >
                    {ps.score > 0 ? "+" : ""}
                    {ps.score}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
