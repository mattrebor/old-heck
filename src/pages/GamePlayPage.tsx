import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { loadGame, updateGameRound, markGameComplete } from "../firebase";
import type { GameSetup, Round } from "../types";
import { calculateOldHeckScore } from "../scoring";
import { assignSuit } from "../utils/suits";
import Header from "../components/Header";
import BidCollector from "../components/BidCollector";
import RoundEditor from "../components/RoundEditor";
import Totals from "../components/Totals";

type RoundPhase = "bidding" | "results" | "completed";

export default function GamePlayPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();

  const [setup, setSetup] = useState<GameSetup | null>(null);
  const [completedRounds, setCompletedRounds] = useState<Round[]>([]);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [currentPhase, setCurrentPhase] = useState<RoundPhase>("completed");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const autoCompleteTimerRef = useRef<number | null>(null);

  // Load game from Firestore on mount
  useEffect(() => {
    async function load() {
      if (!gameId) {
        setError("No game ID provided");
        setLoading(false);
        return;
      }

      try {
        const game = await loadGame(gameId);
        if (!game) {
          setError("Game not found");
          setLoading(false);
          return;
        }

        setSetup(game.setup);
        setCompletedRounds(game.rounds || []);
        setCurrentRound(game.inProgressRound || null);
        setCurrentPhase(game.currentPhase || "completed");

        // If no round in progress and not at max rounds, start first round
        if (!game.inProgressRound && game.rounds.length === 0) {
          const firstRound = createNewRoundFromSetup(game.setup, 1);
          setCurrentRound(firstRound);
          setCurrentPhase("bidding");

          // Save initial round to Firestore
          await updateGameRound(gameId, {
            inProgressRound: firstRound,
            currentPhase: "bidding",
          });
        }

        setLoading(false);
      } catch (err) {
        console.error("Error loading game:", err);
        setError("Failed to load game");
        setLoading(false);
      }
    }

    load();
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
          <button
            onClick={() => navigate("/")}
            className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:shadow-card-hover hover:scale-105 transition-all"
          >
            ← Back to Setup
          </button>
        </div>
      </div>
    );
  }

  function createNewRoundFromSetup(gameSetup: GameSetup, roundNumber: number): Round {
    return {
      roundNumber,
      scores: gameSetup.players.map((name, index) => ({
        name,
        suit: assignSuit(index),
        bid: -1, // -1 means bid not entered yet
        tricks: 0,
        met: false,
        score: 0,
        blindBid: false,
      })),
    };
  }

  function createNewRound(roundNumber: number): Round {
    if (!setup) throw new Error("Setup not loaded");
    return createNewRoundFromSetup(setup, roundNumber);
  }

  function handleUpdateBid(playerIndex: number, bid: number, blindBid: boolean) {
    if (!currentRound) return;

    const updatedScores = currentRound.scores.map((ps, i) => {
      if (i === playerIndex) {
        return { ...ps, bid, blindBid };
      }
      return ps;
    });

    setCurrentRound({ ...currentRound, scores: updatedScores });
  }

  async function handleBidsComplete() {
    if (!currentRound || !gameId) return;

    // Reset tricks to -1 (not entered yet) for results phase
    const scoresWithResetTricks = currentRound.scores.map((ps) => ({
      ...ps,
      tricks: -1,
      met: false,
      score: 0,
    }));

    const updatedRound = { ...currentRound, scores: scoresWithResetTricks };
    setCurrentRound(updatedRound);
    setCurrentPhase("results");

    // Save to Firestore
    try {
      setIsSaving(true);
      await updateGameRound(gameId, {
        inProgressRound: updatedRound,
        currentPhase: "results",
      });
    } catch (error) {
      console.error("Error saving bidding phase:", error);
    } finally {
      setIsSaving(false);
    }
  }

  function handleUpdateResult(playerIndex: number, madeBid: boolean) {
    if (!currentRound) return;

    const updatedScores = currentRound.scores.map((ps, i) => {
      if (i === playerIndex) {
        // Use bid value for tricks in both cases (for scoring calculation)
        const tricks = ps.bid;
        const score = calculateOldHeckScore(tricks, madeBid, ps.blindBid);
        return { ...ps, tricks, met: madeBid, score };
      }
      return ps;
    });

    const updatedRound = { ...currentRound, scores: updatedScores };
    setCurrentRound(updatedRound);

    // Clear any existing timer
    if (autoCompleteTimerRef.current) {
      clearTimeout(autoCompleteTimerRef.current);
    }

    // Auto-complete round when all players have answered
    const allPlayersAnswered = updatedScores.every((ps) => ps.tricks >= 0);

    if (allPlayersAnswered) {
      autoCompleteTimerRef.current = window.setTimeout(() => {
        handleCompleteRound();
        autoCompleteTimerRef.current = null;
      }, 1500); // Brief delay to review scores
    }
  }

  async function handleCompleteRound() {
    if (!currentRound || !gameId || !setup) return;

    // Safety check - should never happen since button is disabled
    const allPlayersMarked = currentRound.scores.every((ps) => ps.tricks >= 0);
    if (!allPlayersMarked) {
      return; // Silently ignore if called when not ready
    }

    const newCompletedRounds = [...completedRounds, currentRound];
    setCompletedRounds(newCompletedRounds);
    setCurrentRound(null);
    setCurrentPhase("completed");

    // Save completed round to Firestore
    try {
      setIsSaving(true);
      await updateGameRound(gameId, {
        rounds: newCompletedRounds,
        inProgressRound: undefined,
        currentPhase: "completed",
      });

      // Check if game is complete
      const nextRoundNumber = newCompletedRounds.length + 1;
      if (nextRoundNumber > setup.maxRounds) {
        await markGameComplete(gameId);
      }
    } catch (error) {
      console.error("Error saving completed round:", error);
    } finally {
      setIsSaving(false);
    }

    // Auto-start next round if not at max
    const nextRoundNumber = newCompletedRounds.length + 1;
    if (nextRoundNumber <= setup.maxRounds) {
      setTimeout(async () => {
        const newRound = createNewRound(nextRoundNumber);
        setCurrentRound(newRound);
        setCurrentPhase("bidding");

        // Save new round to Firestore
        try {
          setIsSaving(true);
          await updateGameRound(gameId, {
            inProgressRound: newRound,
            currentPhase: "bidding",
          });
        } catch (error) {
          console.error("Error saving new round:", error);
        } finally {
          setIsSaving(false);
        }
      }, 500); // Brief delay for user to see completion
    }
  }

  const nextRoundNumber = completedRounds.length + 1;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Header />

      {/* Auto-save indicator */}
      {isSaving && (
        <div className="mb-4 bg-gradient-to-r from-blue-100 to-blue-200 border-2 border-blue-400 rounded-xl p-3 text-sm text-blue-800 font-semibold text-center">
          💾 Saving...
        </div>
      )}

      {/* View-only link */}
      <div className="mb-4 bg-gradient-to-r from-purple-100 to-purple-200 border-2 border-purple-400 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">👁️</span>
            <span className="text-sm font-semibold text-purple-800">
              Share live view-only link with others
            </span>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => navigate(`/game/${gameId}/view`)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex-1 sm:flex-none"
            >
              Open View
            </button>
            <button
              onClick={() => {
                const viewUrl = `${window.location.origin}/game/${gameId}/view`;
                navigator.clipboard.writeText(viewUrl);
                alert("View-only link copied to clipboard!");
              }}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all flex-1 sm:flex-none"
            >
              📋 Copy Link
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-bid-100 to-accent-500/20 border-3 border-bid-400 rounded-xl p-6 mb-8 shadow-card">
        <div className="text-base font-semibold mb-2">
          <strong className="text-bid-700">Players:</strong> <span className="text-gray-800">{setup.players.join(", ")}</span>
        </div>
        <div className="text-base font-semibold mb-2">
          <strong className="text-bid-700">Decks:</strong> <span className="text-gray-800">{setup.decks}</span> · <strong className="text-bid-700">Max Rounds:</strong>{" "}
          <span className="text-gray-800">{setup.maxRounds}</span>
        </div>
        <div className="text-base font-semibold">
          <strong className="text-bid-700">Completed Rounds:</strong> <span className="text-gray-800">{completedRounds.length} /{" "}
          {setup.maxRounds}</span>
        </div>
      </div>

      {/* Current Round - Bidding Phase */}
      {currentRound && currentPhase === "bidding" && (
        <BidCollector
          round={currentRound}
          tricksAvailable={currentRound.roundNumber}
          onUpdate={handleUpdateBid}
          onComplete={handleBidsComplete}
        />
      )}

      {/* Current Round - Results Phase */}
      {currentRound && currentPhase === "results" && (
        <div>
          <RoundEditor round={currentRound} onUpdate={handleUpdateResult} />
          <div className="mb-6 p-5 bg-felt-100 border-2 border-felt-400 rounded-xl text-base text-gray-700 font-semibold">
            {currentRound.scores.every((ps) => ps.tricks >= 0)
              ? "✅ All players marked! Round will auto-complete in a moment..."
              : "⏳ Mark all players to continue. Round will auto-complete when done."}
          </div>
          <button
            onClick={() => {
              if (autoCompleteTimerRef.current) {
                clearTimeout(autoCompleteTimerRef.current);
                autoCompleteTimerRef.current = null;
              }
              handleCompleteRound();
            }}
            disabled={!currentRound.scores.every((ps) => ps.tricks >= 0)}
            className="mb-6 bg-gradient-to-r from-success-500 to-success-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:shadow-card-hover hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all w-full"
          >
            Complete Round Now
          </button>
        </div>
      )}

      {/* Running Totals */}
      {completedRounds.length > 0 && <Totals rounds={completedRounds} />}

      {/* Action Buttons */}
      <div className="mt-8 flex gap-4 flex-wrap">
        <button
          onClick={() => navigate("/")}
          className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:shadow-card-hover hover:scale-105 transition-all flex-1 min-w-[200px]"
        >
          ← Back to Home
        </button>
      </div>

      {/* Max rounds warning */}
      {nextRoundNumber > setup.maxRounds && !currentRound && (
        <div className="mt-6 bg-gradient-to-r from-green-100 to-green-200 border-3 border-green-500 rounded-xl p-5 text-base text-green-900 font-semibold">
          🎉 Game complete! Maximum rounds ({setup.maxRounds}) reached. Game has been saved automatically.
        </div>
      )}

      {/* In progress info */}
      {currentRound && currentPhase === "bidding" && (
        <div className="mt-6 bg-gradient-to-r from-bid-100 to-bid-200 border-3 border-bid-400 rounded-xl p-5 text-base text-bid-800 font-semibold">
          ℹ️ Game will automatically continue to results phase once all bids are entered.
        </div>
      )}
      {currentRound && currentPhase === "results" && (
        <div className="mt-6 bg-gradient-to-r from-felt-100 to-felt-200 border-3 border-felt-400 rounded-xl p-5 text-base text-felt-600 font-semibold">
          ℹ️ Next round will start automatically after completing this one.
        </div>
      )}
    </div>
  );
}
