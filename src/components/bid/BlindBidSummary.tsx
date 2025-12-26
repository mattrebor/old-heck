import type { PlayerScore } from "../../types";
import PlayerAvatar from "../PlayerAvatar";
import BidDisplay from "../BidDisplay";

type BlindBidSummaryProps = {
  players: PlayerScore[];
  blindBidDecisions: boolean[];
  tricksAvailable: number;
};

export default function BlindBidSummary({
  players,
  blindBidDecisions,
  tricksAvailable,
}: BlindBidSummaryProps) {
  const hasBlindBids = blindBidDecisions.some((b) => b);

  if (!hasBlindBids) return null;

  return (
    <div className="mb-6">
      <p className="text-sm font-bold text-purple-700 mb-3">
        Blind Bids (already submitted):
      </p>
      {players.map((player, i) => {
        if (!blindBidDecisions[i]) return null;

        const bidTooHigh = player.bid > tricksAvailable;

        return (
          <div key={i}>
            <div className="flex items-center justify-between mb-2 p-4 bg-purple-100 rounded-xl border-2 border-purple-400">
              <div className="flex items-center gap-2">
                <PlayerAvatar name={player.name} size="md" showName={true} />
                {bidTooHigh && (
                  <span className="px-1.5 py-0.5 bg-orange-500 text-white rounded text-xs font-bold whitespace-nowrap">
                    ⚠
                  </span>
                )}
              </div>
              <BidDisplay bid={player.bid} isBlind={true} size="md" />
            </div>
            {bidTooHigh && (
              <div className="mb-3 px-3 py-2 bg-orange-100 border-2 border-orange-400 rounded-lg text-sm text-orange-800 font-semibold">
                ⚠ Warning: Bid ({player.bid}) exceeds cards in hand ({tricksAvailable})
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
