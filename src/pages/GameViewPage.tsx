import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import type { Game, GameSetup, Round } from "../types";
import { getSuitColor } from "../utils/suits";
import Header from "../components/Header";
import Totals from "../components/Totals";

export default function GameViewPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [setup, setSetup] = useState<GameSetup | null>(null);
  const [completedRounds, setCompletedRounds] = useState<Round[]>([]);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [currentPhase, setCurrentPhase] = useState<string | null>(null);
  const [gameStatus, setGameStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load game with real-time updates
  useEffect(() => {
    if (!gameId) {
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

      {/* View-only indicator */}
      <div className="mb-4 bg-gradient-to-r from-blue-100 to-blue-200 border-2 border-blue-400 rounded-xl p-4 text-center">
        <div className="text-lg font-bold text-blue-800 mb-1">
          👁️ View-Only Mode - Live Updates
        </div>
        <div className="text-sm text-blue-700">
          This page updates automatically as the game progresses
        </div>
      </div>

      {/* Game Info */}
      <div className="bg-gradient-to-r from-bid-100 to-accent-500/20 border-3 border-bid-400 rounded-xl p-6 mb-8 shadow-card">
        <div className="text-base font-semibold mb-2">
          <strong className="text-bid-700">Players:</strong>{" "}
          <span className="text-gray-800">{setup.players.join(", ")}</span>
        </div>
        <div className="text-base font-semibold mb-2">
          <strong className="text-bid-700">Decks:</strong>{" "}
          <span className="text-gray-800">{setup.decks}</span> ·{" "}
          <strong className="text-bid-700">Max Rounds:</strong>{" "}
          <span className="text-gray-800">{setup.maxRounds}</span>
        </div>
        <div className="text-base font-semibold mb-2">
          <strong className="text-bid-700">Completed Rounds:</strong>{" "}
          <span className="text-gray-800">
            {completedRounds.length} / {setup.maxRounds}
          </span>
        </div>
        <div className="text-base font-semibold">
          <strong className="text-bid-700">Status:</strong>{" "}
          <span className={`${gameStatus === 'completed' ? 'text-green-700' : 'text-blue-700'}`}>
            {gameStatus === 'completed' ? '🎉 Complete' : '🎮 In Progress'}
          </span>
        </div>
      </div>

      {/* Current Round - In Progress */}
      {currentRound && (
        <div className="border-4 border-blue-400 rounded-xl p-6 mb-6 bg-gradient-to-br from-blue-50 to-blue-100">
          <h3 className="font-bold text-2xl mb-4 text-blue-700 flex items-center gap-3">
            <span className="text-3xl">🎯</span>
            Round {currentRound.roundNumber} - In Progress
          </h3>

          {currentPhase && (
            <div className="mb-4 p-3 bg-blue-200 rounded-lg border-2 border-blue-400">
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
            {currentRound.scores.map((ps, i) => (
              <div
                key={i}
                className="flex flex-wrap items-center gap-3 text-sm bg-white p-4 rounded-lg border-2 border-blue-200"
              >
                <span className={`text-2xl ${getSuitColor(ps.suit)}`}>
                  {ps.suit}
                </span>
                <span className="font-medium min-w-[100px]">{ps.name}</span>
                {ps.blindBid && (
                  <span className="px-2 py-1 bg-purple-600 text-white rounded text-xs font-bold">
                    ⚡ BLIND
                  </span>
                )}

                {/* Show bid if entered */}
                {ps.bid >= 0 ? (
                  <span className="text-gray-700 font-semibold">
                    Bid: {ps.bid}
                  </span>
                ) : (
                  <span className="text-gray-400 italic">Bid: waiting...</span>
                )}

                {/* Show result if phase is results or completed */}
                {currentPhase === "results" && ps.tricks >= 0 && (
                  <>
                    <span className="text-gray-600">Books: {ps.tricks}</span>
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
            ))}
          </div>
        </div>
      )}

      {/* Running Totals */}
      {completedRounds.length > 0 && <Totals rounds={completedRounds} />}

      {/* Game Complete Message */}
      {gameStatus === 'completed' && (
        <div className="mt-6 bg-gradient-to-r from-green-100 to-green-200 border-3 border-green-500 rounded-xl p-5 text-base text-green-900 font-semibold">
          🎉 Game complete! All rounds finished.
        </div>
      )}

      {/* Waiting for next round */}
      {!currentRound && nextRoundNumber <= setup.maxRounds && gameStatus !== 'completed' && (
        <div className="mt-6 bg-gradient-to-r from-yellow-100 to-yellow-200 border-3 border-yellow-500 rounded-xl p-5 text-base text-yellow-900 font-semibold">
          ⏳ Waiting for round {nextRoundNumber} to start...
        </div>
      )}

      {/* Action Buttons - Only show for authenticated users */}
      {user && (
        <div className="mt-8">
          <button
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:shadow-card-hover hover:scale-105 transition-all w-full"
          >
            📋 Copy Link
          </button>
        </div>
      )}
    </div>
  );
}
