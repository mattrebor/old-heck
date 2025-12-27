import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { Round } from "../types";
import { hasResultRecorded } from "../types";
import { useGameSubscription } from "../hooks/useGameSubscription";
import { useBiddingViewModel } from "../hooks/useBiddingViewModel";
import { navigateToNewGameWithSetup } from "../utils/navigation";
import Header from "../components/Header";
import GameLoadingState from "../components/GameLoadingState";
import GameErrorState from "../components/GameErrorState";
import GameInfoHeader from "../components/GameInfoHeader";
import GameCompleteSection from "../components/GameCompleteSection";
import Totals from "../components/Totals";
import ViewOnlyPlayerCard from "../components/view/ViewOnlyPlayerCard";
import BidTrackerCard from "../components/bid/BidTrackerCard";

export default function GameViewPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Use custom hook for game subscription
  const {
    setup,
    completedRounds,
    currentRound,
    currentPhase,
    biddingPhase,
    gameStatus,
    loading,
    error,
  } = useGameSubscription(gameId);

  // Track previous values to detect changes
  const prevRoundRef = useRef<Round | null>(null);
  const prevPhaseRef = useRef<string | null>(null);
  const [changedBids, setChangedBids] = useState<Set<number>>(new Set());
  const [changedResults, setChangedResults] = useState<Set<number>>(new Set());
  const [phaseChanged, setPhaseChanged] = useState(false);


  // Detect changes and trigger animations
  useEffect(() => {
    if (!currentRound || loading) return;

    const newChangedBids = new Set<number>();
    const newChangedResults = new Set<number>();

    // Detect bid changes
    if (prevRoundRef.current && prevRoundRef.current.roundNumber === currentRound.roundNumber) {
      currentRound.scores.forEach((score, idx) => {
        const prevScore = prevRoundRef.current?.scores[idx];
        if (prevScore && prevScore.bid !== score.bid && score.bid >= 0) {
          newChangedBids.add(idx);
        }
        // Detect any result changes (score or met status)
        if (prevScore && (
          prevScore.score !== score.score ||
          prevScore.met !== score.met
        ) && hasResultRecorded(score)) {
          newChangedResults.add(idx);
        }
      });
    }

    // Detect phase change
    if (prevPhaseRef.current !== currentPhase && currentPhase) {
      setPhaseChanged(true);
      setTimeout(() => setPhaseChanged(false), 2000);
    }

    if (newChangedBids.size > 0) {
      setChangedBids(newChangedBids);
      setTimeout(() => setChangedBids(new Set()), 2000);
    }

    if (newChangedResults.size > 0) {
      setChangedResults(newChangedResults);
      setTimeout(() => setChangedResults(new Set()), 2000);
    }

    prevRoundRef.current = currentRound;
    prevPhaseRef.current = currentPhase;
  }, [currentRound, currentPhase, loading]);

  function handleStartNewGameWithSameSettings() {
    if (!setup) return;
    navigateToNewGameWithSetup(navigate, setup);
  }

  // Show loading state
  if (loading) {
    return <GameLoadingState />;
  }

  // Show error state
  if (error || !setup) {
    return <GameErrorState error={error || "Game not found"} />;
  }

  const nextRoundNumber = completedRounds.length + 1;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Header />

      {/* Game Info - Compact */}
      <GameInfoHeader
        setup={setup}
        completedRounds={completedRounds.length}
        gameStatus={gameStatus}
      />

      {/* Score Review Phase - View Only */}
      {currentPhase === "score-review" && !currentRound && (
        <div className="border-4 border-green-400 rounded-xl p-6 mb-6 bg-gradient-to-br from-green-50 to-green-100">
          <h3 className="font-bold text-xl sm:text-2xl mb-4 text-green-700 flex items-center gap-2 sm:gap-3">
            <span className="text-2xl sm:text-3xl">📊</span>
            Round {completedRounds.length} Complete - Reviewing Scores
          </h3>
          <p className="text-green-800">
            The game owner is reviewing scores before starting the next round.
          </p>
        </div>
      )}

      {/* Current Round - In Progress */}
      {currentRound && (
        <div className="border-4 border-blue-400 rounded-xl p-6 mb-6 bg-gradient-to-br from-blue-50 to-blue-100">
          <h3 className="font-bold text-xl sm:text-2xl mb-4 text-blue-700 flex items-center gap-2 sm:gap-3">
            <span className="text-2xl sm:text-3xl">🎯</span>
            Round {currentRound.roundNumber} - In Progress
          </h3>

          {currentPhase && (
            <div className={`mb-4 p-3 bg-blue-200 rounded-lg border-2 border-blue-400 transition-all ${
              phaseChanged ? "animate-pulse ring-4 ring-blue-400" : ""
            }`}>
              <div className="text-sm font-bold text-blue-800">
                Current Phase:{" "}
                <span className="capitalize">
                  {currentPhase === "bidding" && "📝 Bidding"}
                  {currentPhase === "results" && "🏆 Recording Results"}
                  {currentPhase === "completed" && "✅ Completing Round"}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {(() => {
              // Use bidding view model hook for consistent logic
              const biddingViewModel = useBiddingViewModel(
                currentRound,
                currentPhase,
                biddingPhase
              );

              // Regular bidding phase
              if (currentPhase === "bidding" && biddingPhase === "regular-bid-entry" && biddingViewModel) {
                const {
                  blindBidders,
                  nonBlindOrderedIndices,
                  nextBidderIndex,
                  tricksAvailable,
                  totalBids,
                } = biddingViewModel;

                return (
                  <>
                    {/* Bid tracker card */}
                    <BidTrackerCard
                      tricksAvailable={tricksAvailable}
                      totalBids={totalBids}
                      variant="regular"
                    />
                    {/* Show blind bidders separately */}
                    {blindBidders.length > 0 && (
                      <div className="mb-4 p-4 bg-purple-100 rounded-xl border-2 border-purple-400">
                        <p className="text-sm font-bold text-purple-700 mb-3">
                          Blind Bids (already submitted):
                        </p>
                        <div className="space-y-2">
                          {blindBidders.map(({ ps, i }) => {
                            const hasBidChange = changedBids.has(i);
                            const hasResultChange = changedResults.has(i);
                            const hasAnyChange = hasBidChange || hasResultChange;

                            return (
                              <ViewOnlyPlayerCard
                                key={i}
                                player={ps}
                                currentPhase={currentPhase}
                                hasChange={hasAnyChange}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Show non-blind bidders in order */}
                    {nonBlindOrderedIndices.map((i) => {
                      const ps = currentRound.scores[i];
                      const hasBidChange = changedBids.has(i);
                      const hasResultChange = changedResults.has(i);
                      const hasAnyChange = hasBidChange || hasResultChange;
                      const isCurrentBidder = i === nextBidderIndex;
                      const hasBid = ps.bid >= 0;

                      return (
                        <ViewOnlyPlayerCard
                          key={i}
                          player={ps}
                          currentPhase={currentPhase}
                          hasChange={hasAnyChange}
                          isCurrentBidder={isCurrentBidder}
                          hasBid={hasBid}
                        />
                      );
                    })}
                  </>
                );
              }

              // Blind bidding phase
              if (currentPhase === "bidding" && biddingPhase === "blind-declaration-and-entry" && biddingViewModel) {
                const { orderedIndices, tricksAvailable, totalBids } = biddingViewModel;

                return (
                  <>
                    {/* Bid tracker card */}
                    <BidTrackerCard
                      tricksAvailable={tricksAvailable}
                      totalBids={totalBids}
                      variant="blind"
                    />
                    {orderedIndices.map((i) => {
                      const ps = currentRound.scores[i];
                      const hasBidChange = changedBids.has(i);
                      const hasResultChange = changedResults.has(i);
                      const hasAnyChange = hasBidChange || hasResultChange;

                      return (
                        <ViewOnlyPlayerCard
                          key={i}
                          player={ps}
                          currentPhase={currentPhase}
                          hasChange={hasAnyChange}
                        />
                      );
                    })}
                  </>
                );
              }

              // Default rendering (results phase, etc.)
              return currentRound.scores.map((ps, i) => {
                const hasBidChange = changedBids.has(i);
                const hasResultChange = changedResults.has(i);
                const hasAnyChange = hasBidChange || hasResultChange;

                return (
                  <ViewOnlyPlayerCard
                    key={i}
                    player={ps}
                    currentPhase={currentPhase}
                    hasChange={hasAnyChange}
                  />
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Running Totals */}
      {completedRounds.length > 0 && (
        <Totals
          rounds={completedRounds}
          showDeltas={currentPhase === "score-review"}
        />
      )}

      {/* Game Complete Message */}
      {gameStatus === "completed" && (
        <GameCompleteSection
          onStartNewGame={handleStartNewGameWithSameSettings}
          showButton={!!user}
        />
      )}

      {/* Waiting for next round */}
      {!currentRound &&
        nextRoundNumber <= setup.maxRounds &&
        gameStatus !== "completed" && (
          <div className="mt-6 bg-gradient-to-r from-yellow-100 to-yellow-200 border-3 border-yellow-500 rounded-xl p-5 text-base text-yellow-900 font-semibold">
            ⏳ Waiting for round {nextRoundNumber} to start...
          </div>
        )}
    </div>
  );
}
