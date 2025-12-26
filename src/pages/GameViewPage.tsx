import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import type { Game, GameSetup, Round } from "../types";
import { hasResultRecorded } from "../types";
import Header from "../components/Header";
import Totals from "../components/Totals";
import ViewOnlyPlayerCard from "../components/view/ViewOnlyPlayerCard";
import BidTrackerCard from "../components/bid/BidTrackerCard";

export default function GameViewPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [setup, setSetup] = useState<GameSetup | null>(null);
  const [completedRounds, setCompletedRounds] = useState<Round[]>([]);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [currentPhase, setCurrentPhase] = useState<string | null>(null);
  const [biddingPhase, setBiddingPhase] = useState<"blind-declaration-and-entry" | "regular-bid-entry" | null>(null);
  const [gameStatus, setGameStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playersExpanded, setPlayersExpanded] = useState(false);

  // Track previous values to detect changes
  const prevRoundRef = useRef<Round | null>(null);
  const prevPhaseRef = useRef<string | null>(null);
  const [changedBids, setChangedBids] = useState<Set<number>>(new Set());
  const [changedResults, setChangedResults] = useState<Set<number>>(new Set());
  const [phaseChanged, setPhaseChanged] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Load game with real-time updates
  useEffect(() => {
    if (!gameId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("No game ID provided");
      setLoading(false);
      return;
    }

    const gameRef = doc(db, "games", gameId);

    const unsubscribe = onSnapshot(
      gameRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setError("Game not found");
          setLoading(false);
          return;
        }

        const game = { id: snapshot.id, ...snapshot.data() } as Game;

        setSetup(game.setup);
        setCompletedRounds(game.rounds || []);
        setCurrentRound(game.inProgressRound || null);
        setCurrentPhase(game.currentPhase || null);
        setBiddingPhase(game.biddingPhase || null);
        setGameStatus(game.status);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading game:", err);
        setError("Failed to load game");
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [gameId]);

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

    // Navigate to setup page with prefilled settings
    navigate("/", { state: { setup } });
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Header />
        <div className="text-center py-12">
          <div className="text-xl font-semibold">Loading game...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !setup) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Header />
        <div className="text-center py-12">
          <div className="text-xl font-semibold text-red-600 mb-4">
            {error || "Game not found"}
          </div>
        </div>
      </div>
    );
  }

  const nextRoundNumber = completedRounds.length + 1;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Header />

      {/* Game Info - Compact */}
      <div className="bg-gradient-to-r from-bid-100 to-accent-500/20 border-2 border-bid-400 rounded-lg p-3 mb-4 shadow-card">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm mb-2">
          <div className="font-semibold">
            <span className="text-blue-600">👁️</span>
            <span
              className={`ml-1 ${
                gameStatus === "completed" ? "text-green-700" : "text-blue-700"
              }`}
            >
              {gameStatus === "completed" ? "🎉 Complete" : "Live"}
            </span>
          </div>
          <div>
            <strong className="text-bid-700">Decks:</strong>{" "}
            <span className="text-gray-800">{setup.decks}</span>
          </div>
          <div>
            <strong className="text-bid-700">Rounds:</strong>{" "}
            <span className="text-gray-800">
              {completedRounds.length}/{setup.maxRounds}
            </span>
          </div>
        </div>
        <div className="border-t border-bid-300 pt-2">
          <button
            onClick={() => setPlayersExpanded(!playersExpanded)}
            className="flex items-center gap-2 text-sm font-semibold text-bid-700 hover:text-bid-800 transition-colors w-full"
          >
            <span className="text-xs">{playersExpanded ? "▼" : "▶"}</span>
            <span>Players ({setup.players.length})</span>
          </button>
          {playersExpanded && (
            <div className="mt-2 text-sm text-gray-800 pl-5">
              {setup.players.join(", ")}
            </div>
          )}
        </div>
      </div>

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
              // Calculate ordered player indices during bidding phase (like BidCollector)
              if (currentPhase === "bidding" && biddingPhase === "regular-bid-entry") {
                const playerIndices = Array.from({ length: currentRound.scores.length }, (_, i) => i);
                const orderedIndices = [
                  ...playerIndices.slice(currentRound.firstBidderIndex),
                  ...playerIndices.slice(0, currentRound.firstBidderIndex)
                ];

                // Calculate tricks available and total bids
                const tricksAvailable = currentRound.roundNumber;
                const totalBids = currentRound.scores.reduce(
                  (sum, ps) => sum + (ps.bid >= 0 ? ps.bid : 0),
                  0
                );

                // Separate blind bidders from regular bidders
                const blindBidders = currentRound.scores
                  .map((ps, i) => ({ ps, i }))
                  .filter(({ ps }) => ps.blindBid);

                const nonBlindOrderedIndices = orderedIndices.filter(
                  idx => !currentRound.scores[idx].blindBid
                );

                // Find next player who needs to bid (excluding blind bidders)
                const nextBidderIndex = nonBlindOrderedIndices.find(idx => {
                  return currentRound.scores[idx].bid === -1; // Find first player without a bid
                });

                // First bidder is the first non-blind player in order
                const firstNonBlindBidderIndex = nonBlindOrderedIndices[0];

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
                      const isFirstBidder = i === firstNonBlindBidderIndex;
                      const isCurrentBidder = i === nextBidderIndex;
                      const hasBid = ps.bid >= 0;

                      return (
                        <ViewOnlyPlayerCard
                          key={i}
                          player={ps}
                          currentPhase={currentPhase}
                          hasChange={hasAnyChange}
                          isFirstBidder={isFirstBidder}
                          isCurrentBidder={isCurrentBidder}
                          hasBid={hasBid}
                        />
                      );
                    })}
                  </>
                );
              }

              // Default rendering (blind bidding phase, results phase, etc.)
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
      {completedRounds.length > 0 && <Totals rounds={completedRounds} />}

      {/* Game Complete Message */}
      {gameStatus === "completed" && (
        <div className="mt-6 space-y-4">
          <div className="bg-gradient-to-r from-green-100 to-green-200 border-3 border-green-500 rounded-xl p-5 text-base text-green-900 font-semibold">
            🎉 Game complete! All rounds finished.
          </div>
          {user && (
            <button
              onClick={handleStartNewGameWithSameSettings}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-xl text-xl font-bold hover:shadow-card-hover hover:scale-105 transition-all"
            >
              🎮 New Game with Same Settings
            </button>
          )}
        </div>
      )}

      {/* Waiting for next round */}
      {!currentRound &&
        nextRoundNumber <= setup.maxRounds &&
        gameStatus !== "completed" && (
          <div className="mt-6 bg-gradient-to-r from-yellow-100 to-yellow-200 border-3 border-yellow-500 rounded-xl p-5 text-base text-yellow-900 font-semibold">
            ⏳ Waiting for round {nextRoundNumber} to start...
          </div>
        )}

      {/* Action Buttons - Only show for authenticated users */}
      {user && (
        <div className="mt-6">
          <button
            onClick={handleCopyLink}
            className={`bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:shadow-card-hover hover:scale-105 transition-all w-full ${
              linkCopied ? "animate-pulse ring-4 ring-green-400" : ""
            }`}
          >
            {linkCopied ? "✓ Link Copied!" : "📋 Copy Link"}
          </button>
        </div>
      )}
    </div>
  );
}
