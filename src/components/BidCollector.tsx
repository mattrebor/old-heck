import { useState } from "react";
import type { Round } from "../types";
import { getSuitColor } from "../utils/suits";
import PlayerAvatar from "./PlayerAvatar";

export default function BidCollector({
  round,
  tricksAvailable,
  onUpdate,
  onComplete,
}: {
  round: Round;
  tricksAvailable: number;
  onUpdate: (playerIndex: number, bid: number, blindBid: boolean) => void;
  onComplete: () => void;
}) {
  const [biddingPhase, setBiddingPhase] = useState<
    "blind-declaration-and-entry" | "regular-bid-entry"
  >("blind-declaration-and-entry");
  const [blindBidDecisions, setBlindBidDecisions] = useState<boolean[]>(
    round.scores.map((ps) => ps.blindBid)
  );

  const hasBlindBidders = blindBidDecisions.some((b) => b);
  const allBidsEntered = round.scores.every((ps) => ps.bid >= 0);
  const totalBids = round.scores.reduce(
    (sum, ps) => sum + (ps.bid >= 0 ? ps.bid : 0),
    0
  );
  const bidsEqualTricks = totalBids === tricksAvailable;
  const canProceed = allBidsEntered && !bidsEqualTricks;

  // Check if all blind bidders have entered their bids (needed for phase transition)
  const allBlindBidsEntered = blindBidDecisions.every((isBlind, i) => {
    if (!isBlind) return true; // Non-blind bidders don't need to bid yet
    return round.scores[i].bid >= 0;
  });

  function toggleBlindBid(index: number) {
    const updated = [...blindBidDecisions];
    updated[index] = !updated[index];
    setBlindBidDecisions(updated);
  }

  function handleBlindBidChange(index: number, bid: number) {
    onUpdate(index, bid, true);
  }

  function proceedToRegularBidding() {
    // Ensure all blind bid decisions are applied
    blindBidDecisions.forEach((blindBid, i) => {
      if (blindBid && round.scores[i].bid >= 0) {
        onUpdate(i, round.scores[i].bid, true);
      }
    });

    setBiddingPhase("regular-bid-entry");
  }

  function handleRegularBidChange(index: number, bid: number) {
    onUpdate(index, bid, false);
  }

  // PHASE 1: Blind Bid Declaration and Entry (Combined)
  if (biddingPhase === "blind-declaration-and-entry") {
    return (
      <div className="border-4 border-accent-500 rounded-2xl p-8 mb-8 bg-gradient-to-br from-purple-100 to-purple-200 shadow-card-hover">
        <h3 className="font-bold text-3xl mb-6 text-purple-700 flex items-center gap-3">
          <span className="text-4xl">👁️</span>
          Round {round.roundNumber} - Blind Bid Phase
        </h3>
        <p className="text-base text-purple-600 mb-6 font-semibold">
          Will any players bid blind (without seeing their cards)? Check "Blind
          Bid" and enter your bid now. Blind bids earn{" "}
          <span className="text-purple-800 font-bold">DOUBLE</span> points!
        </p>

        <div className="mb-6 p-5 bg-purple-300 rounded-xl border-2 border-purple-500">
          <div className="text-base text-purple-900 font-bold">
            <strong>Books available:</strong> {tricksAvailable}
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {round.scores.map((ps, i) => (
            <div
              key={i}
              className={`p-5 rounded-xl border-3 transition-all ${
                blindBidDecisions[i]
                  ? "bg-purple-200 border-purple-500"
                  : "bg-white border-purple-300"
              }`}
            >
              <div className="flex items-center justify-between mb-3 gap-4">
                <div className="flex items-center gap-2">
                  <PlayerAvatar name={ps.name} size="lg" showName={true} />
                  {blindBidDecisions[i] && (
                    <span className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm font-bold">
                      ⚡ BLIND 2X
                    </span>
                  )}
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-base font-semibold text-gray-700">
                      Blind Bid?
                    </span>
                    <input
                      type="checkbox"
                      checked={blindBidDecisions[i]}
                      onChange={() => toggleBlindBid(i)}
                      className="w-6 h-6 text-purple-600 rounded focus:ring-purple-500"
                    />
                  </label>
                </div>
              </div>

              {blindBidDecisions[i] && (
                <div className="flex items-center gap-6 mt-4 pt-4 border-t-2 border-purple-400">
                  <span className="text-base font-semibold text-purple-700">
                    Enter your blind bid:
                  </span>
                  <input
                    type="number"
                    min={0}
                    placeholder="Blind Bid"
                    className="border-3 border-purple-400 rounded-xl px-5 py-3 w-28 text-center text-xl font-bold focus:border-purple-600 focus:outline-none focus:ring-4 focus:ring-purple-600/30 bg-white transition-all"
                    value={ps.bid >= 0 ? ps.bid : ""}
                    onChange={(e) =>
                      handleBlindBidChange(i, e.target.value === "" ? -1 : Number(e.target.value))
                    }
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={proceedToRegularBidding}
          disabled={!allBlindBidsEntered}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-400 text-white px-6 py-4 rounded-xl text-lg font-bold shadow-card-hover hover:shadow-2xl hover:scale-105 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
        >
          {allBlindBidsEntered
            ? "Continue to Regular Bidding →"
            : "Enter all blind bids to continue"}
        </button>
      </div>
    );
  }

  // PHASE 2: Regular Bid Entry (non-blind bidders)
  return (
    <div className="border-4 border-bid-500 rounded-2xl p-8 mb-8 bg-gradient-to-br from-bid-100 to-bid-200 shadow-card-hover">
      <h3 className="font-bold text-3xl mb-6 text-bid-700 flex items-center gap-3">
        <span className="text-4xl">🎴</span>
        Round {round.roundNumber} - Place Your Bids
      </h3>
      <p className="text-base text-bid-600 mb-6 font-semibold">
        {hasBlindBidders
          ? "Remaining players, enter your bids:"
          : "Each player, enter how many books you bid to take:"}
      </p>
      <div className="mb-6 p-5 bg-bid-300 rounded-xl border-2 border-bid-500">
        <div className="text-base text-white font-bold">
          <strong>Books available:</strong> {tricksAvailable} ·
          <strong className="ml-2">Total bids:</strong> {totalBids}
          {allBidsEntered && bidsEqualTricks && (
            <span className="ml-2 text-yellow-300 font-bold">
              ⚠ Total bids cannot equal books available!
            </span>
          )}
        </div>
      </div>

      {/* Show blind bidders (read-only) */}
      {hasBlindBidders && (
        <div className="mb-6">
          <p className="text-sm font-bold text-purple-700 mb-3">
            Blind Bids (already submitted):
          </p>
          {round.scores.map((ps, i) => {
            if (!blindBidDecisions[i]) return null;

            return (
              <div
                key={i}
                className="flex items-center justify-between mb-3 p-4 bg-purple-100 rounded-xl border-2 border-purple-400"
              >
                <div className="flex items-center gap-2">
                  <PlayerAvatar name={ps.name} size="md" showName={true} />
                  <span className="px-2 py-1 bg-purple-600 text-white rounded text-xs font-bold">
                    ⚡ BLIND
                  </span>
                </div>
                <span className="text-xl font-bold text-purple-700">
                  Bid: {ps.bid}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Show regular bidders (editable) */}
      {round.scores.map((ps, i) => {
        if (blindBidDecisions[i]) return null; // Skip blind bidders

        return (
          <div
            key={i}
            className="flex items-center justify-between mb-5 p-5 bg-white rounded-xl border-3 border-bid-300 hover:border-gold-500 hover:shadow-card transition-all"
          >
            <PlayerAvatar name={ps.name} size="lg" showName={true} />
            <input
              type="number"
              min={0}
              placeholder="Bid"
              className="border-3 border-bid-400 rounded-xl px-5 py-3 w-28 text-center text-xl font-bold focus:border-gold-500 focus:outline-none focus:ring-4 focus:ring-gold-500/30 bg-bid-50 transition-all"
              value={ps.bid >= 0 ? ps.bid : ""}
              onChange={(e) =>
                handleRegularBidChange(i, e.target.value === "" ? -1 : Number(e.target.value))
              }
            />
          </div>
        );
      })}
      {bidsEqualTricks && allBidsEntered && (
        <div className="mb-5 p-5 bg-red-100 border-3 border-red-500 rounded-xl text-base text-red-800 font-semibold">
          <strong>Rule violation:</strong> The total of all bids ({totalBids})
          cannot equal the number of books available ({tricksAvailable}). The
          last player to bid must adjust their bid to ensure someone will fail.
        </div>
      )}
      <button
        onClick={onComplete}
        disabled={!canProceed}
        className="mt-6 bg-gradient-to-r from-bid-600 to-bid-400 text-white px-8 py-5 rounded-xl text-xl font-bold shadow-card-hover hover:shadow-2xl hover:scale-105 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all w-full"
      >
        {!allBidsEntered
          ? "Enter all bids to continue"
          : bidsEqualTricks
          ? "Adjust bids - total cannot equal books available"
          : "Start Round →"}
      </button>
    </div>
  );
}
