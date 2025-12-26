import type { PlayerScore } from "../../types";
import { hasResultRecorded } from "../../types";
import PlayerAvatar from "../PlayerAvatar";
import BidDisplay from "../BidDisplay";

type ResultPlayerCardProps = {
  player: PlayerScore;
  index: number;
  onUpdate: (index: number, madeBid: boolean) => void;
};

export default function ResultPlayerCard({
  player,
  index,
  onUpdate,
}: ResultPlayerCardProps) {
  return (
    <div className="mb-5 p-6 bg-white rounded-xl border-3 border-gray-300 hover:border-gold-500 transition-all shadow-card hover:shadow-card-hover">
      <div className="flex flex-col gap-4">
        {/* Player info */}
        <div className="flex items-center gap-4">
          <PlayerAvatar name={player.name} size="lg" showName={true} />
          <BidDisplay bid={player.bid} isBlind={player.blindBid} size="lg" />
        </div>

        {/* Radio buttons - side by side on all screen sizes */}
        <div className="flex flex-row gap-3">
          <label className="flex items-center justify-center cursor-pointer px-4 py-3 rounded-xl bg-success-50 hover:bg-success-500 hover:text-white border-2 border-success-500 transition-all flex-1">
            <input
              type="radio"
              name={`player-${index}`}
              checked={player.met === true}
              onChange={() => onUpdate(index, true)}
              className="sr-only"
            />
            <span className="text-sm sm:text-base font-bold">✓ Made</span>
          </label>
          <label className="flex items-center justify-center cursor-pointer px-4 py-3 rounded-xl bg-danger-50 hover:bg-danger-500 hover:text-white border-2 border-danger-500 transition-all flex-1">
            <input
              type="radio"
              name={`player-${index}`}
              checked={player.met === false}
              onChange={() => onUpdate(index, false)}
              className="sr-only"
            />
            <span className="text-sm sm:text-base font-bold">✗ Missed</span>
          </label>
        </div>

        {/* Score display */}
        {hasResultRecorded(player) && (
          <div className="text-center sm:text-right pt-2 border-t-2 border-gray-200">
            <div
              className={`font-mono text-3xl sm:text-4xl font-bold ${
                player.score < 0 ? "text-danger-500" : "text-success-500"
              }`}
            >
              {player.score > 0 ? "+" : ""}
              {player.score}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
