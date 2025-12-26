import type { Round } from "../types";
import ResultPlayerCard from "./results/ResultPlayerCard";

export default function RoundEditor({
  round,
  onUpdate,
}: {
  round: Round;
  onUpdate: (playerIndex: number, madeBid: boolean) => void;
}) {
  return (
    <div className="border-4 border-success-500 rounded-2xl p-8 mb-8 bg-gradient-to-br from-felt-100 to-felt-200 shadow-card-hover">
      <h3 className="font-bold text-xl sm:text-2xl md:text-3xl mb-4 md:mb-6 text-success-500 flex items-center gap-2 md:gap-3">
        <span className="text-2xl sm:text-3xl md:text-4xl">🏆</span>
        Round {round.roundNumber} - Record Results
      </h3>
      <p className="text-base text-gray-700 mb-6 font-semibold">
        For each player, mark if they made their bid or missed it:
      </p>
      {round.scores.map((ps, i) => (
        <ResultPlayerCard
          key={i}
          player={ps}
          index={i}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
}
