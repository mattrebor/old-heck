import type { Round } from "../types";
import { hasResultRecorded } from "../types";
import ResultPlayerCard from "./results/ResultPlayerCard";

export default function RoundEditor({
  round,
  onUpdate,
  onBatchUpdate,
}: {
  round: Round;
  onUpdate: (playerIndex: number, madeBid: boolean) => void;
  onBatchUpdate?: (updates: Array<{ playerIndex: number; madeBid: boolean }>) => void;
}) {
  // Check if there are any unrecorded results
  const hasUnrecordedResults = round.scores.some((ps) => !hasResultRecorded(ps));

  const handleSetAllToMade = () => {
    // Build list of all unrecorded players to update
    const updates: Array<{ playerIndex: number; madeBid: boolean }> = [];
    round.scores.forEach((ps, index) => {
      if (!hasResultRecorded(ps)) {
        updates.push({ playerIndex: index, madeBid: true });
      }
    });

    // Use batch update if available, otherwise fall back to individual updates
    if (onBatchUpdate && updates.length > 0) {
      onBatchUpdate(updates);
    } else {
      updates.forEach(({ playerIndex, madeBid }) => {
        onUpdate(playerIndex, madeBid);
      });
    }
  };

  return (
    <div className="border-4 border-success-500 rounded-2xl p-8 mb-8 bg-gradient-to-br from-felt-100 to-felt-200 shadow-card-hover">
      <h3 className="font-bold text-xl sm:text-2xl md:text-3xl mb-4 md:mb-6 text-success-500 flex items-center gap-2 md:gap-3">
        <span className="text-2xl sm:text-3xl md:text-4xl">🏆</span>
        Round {round.roundNumber} - Record Results
      </h3>
      <p className="text-base text-gray-700 mb-6 font-semibold">
        For each player, mark if they made their bid or missed it:
      </p>

      {/* Quick action button */}
      {hasUnrecordedResults && (
        <button
          onClick={handleSetAllToMade}
          data-testid="results-set-all-made"
          className="w-full mb-6 bg-gradient-to-r from-success-500 to-success-600 text-white px-6 py-4 rounded-xl text-lg font-bold shadow-card hover:shadow-card-hover hover:scale-105 transition-all"
        >
          ✓ Set All to Made
        </button>
      )}

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
