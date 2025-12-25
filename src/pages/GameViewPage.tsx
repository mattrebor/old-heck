import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import type { Game, GameSetup, Round } from "../types";
import Header from "../components/Header";
import Totals from "../components/Totals";
import PlayerAvatar from "../components/PlayerAvatar";

export default function GameViewPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const { user } = useAuth();

  const [setup, setSetup] = useState<GameSetup | null>(null);
  const [completedRounds, setCompletedRounds] = useState<Round[]>([]);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [currentPhase, setCurrentPhase] = useState<string | null>(null);
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
        if (prevScore && prevScore.tricks !== score.tricks && score.tricks >= 0) {
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
            {currentRound.scores.map((ps, i) => {
              const hasBidChange = changedBids.has(i);
              const hasResultChange = changedResults.has(i);
              const hasAnyChange = hasBidChange || hasResultChange;

              return (
              <div
                key={i}
                className={`flex flex-wrap items-center gap-3 text-sm bg-white p-4 rounded-lg border-2 border-blue-200 justify-between transition-all ${
                  hasAnyChange ? "animate-pulse ring-4 ring-yellow-400 shadow-lg" : ""
                }`}
              >
                <PlayerAvatar name={ps.name} size="md" showName={true} />

                {/* Bid display with blind indicator above */}
                <div className="flex flex-col items-center gap-1">
                  {ps.blindBid && (
                    <span className="px-2 py-0.5 bg-purple-600 text-white rounded text-xs font-bold">
                      ⚡ BLIND
                    </span>
                  )}
                  {ps.bid >= 0 ? (
                    <span className="text-gray-700 font-semibold">
                      Bid: {ps.bid}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">Bid: waiting...</span>
                  )}
                </div>

                {/* Show result if phase is results or completed */}
                {currentPhase === "results" && ps.tricks >= 0 && (
                  <>
                    <span
                      className={`font-medium ${
                        ps.met ? "text-green-700" : "text-red-600"
                      }`}
                    >
                      {ps.met ? "✓ Met" : "✗ Missed"}
                    </span>
                    <span
                      className={`font-mono font-bold ml-auto ${
                        ps.score < 0 ? "text-red-600" : "text-green-700"
                      }`}
                    >
                      {ps.score > 0 ? "+" : ""}
                      {ps.score}
                    </span>
                  </>
                )}
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Running Totals */}
      {completedRounds.length > 0 && <Totals rounds={completedRounds} />}

      {/* Game Complete Message */}
      {gameStatus === "completed" && (
        <div className="mt-6 bg-gradient-to-r from-green-100 to-green-200 border-3 border-green-500 rounded-xl p-5 text-base text-green-900 font-semibold">
          🎉 Game complete! All rounds finished.
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
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:shadow-card-hover hover:scale-105 transition-all w-full"
          >
            📋 Copy Link
          </button>
        </div>
      )}
    </div>
  );
}
