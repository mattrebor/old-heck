import { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import type { GameSetup, Round, Game } from "../types";
import { calculateOldHeckScore } from "../scoring";
import { assignSuit } from "../utils/suits";
import Header from "../components/Header";
import BidCollector from "../components/BidCollector";
import RoundEditor from "../components/RoundEditor";
import Totals from "../components/Totals";

type RoundPhase = "bidding" | "results" | "completed";

export default function GamePlayPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const setup = location.state as GameSetup;

  // Initialize first round automatically
  const initialRound = setup
    ? {
        roundNumber: 1,
        scores: setup.players.map((name, index) => ({
          name,
          suit: assignSuit(index),
          bid: -1, // -1 means bid not entered yet
          tricks: 0,
          met: false,
          score: 0,
        })),
      }
    : null;

  const [completedRounds, setCompletedRounds] = useState<Round[]>([]);
  const [currentRound, setCurrentRound] = useState<Round | null>(initialRound);
  const [currentPhase, setCurrentPhase] = useState<RoundPhase>(
    initialRound ? "bidding" : "completed"
  );
  const [saving, setSaving] = useState(false);
  const autoCompleteTimerRef = useRef<number | null>(null);

  // Redirect if no setup provided
  if (!setup) {
    navigate("/");
    return null;
  }

  function createNewRound(roundNumber: number): Round {
    return {
      roundNumber,
      scores: setup.players.map((name, index) => ({
        name,
        suit: assignSuit(index),
        bid: -1, // -1 means bid not entered yet
        tricks: 0,
        met: false,
        score: 0,
      })),
    };
  }

  function handleUpdateBid(playerIndex: number, bid: number) {
    if (!currentRound) return;

    const updatedScores = currentRound.scores.map((ps, i) => {
      if (i === playerIndex) {
        return { ...ps, bid };
      }
      return ps;
    });

    setCurrentRound({ ...currentRound, scores: updatedScores });
  }

  function handleBidsComplete() {
    if (!currentRound) return;

    // Reset tricks to -1 (not entered yet) for results phase
    const scoresWithResetTricks = currentRound.scores.map((ps) => ({
      ...ps,
      tricks: -1,
      met: false,
      score: 0,
    }));

    setCurrentRound({ ...currentRound, scores: scoresWithResetTricks });
    setCurrentPhase("results");
  }

  function handleUpdateResult(playerIndex: number, madeBid: boolean) {
    if (!currentRound) return;

    const updatedScores = currentRound.scores.map((ps, i) => {
      if (i === playerIndex) {
        // Use bid value for tricks in both cases (for scoring calculation)
        const tricks = ps.bid;
        const score = calculateOldHeckScore(tricks, madeBid);
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

  function handleCompleteRound() {
    if (!currentRound) return;

    // Safety check - should never happen since button is disabled
    const allPlayersMarked = currentRound.scores.every((ps) => ps.tricks >= 0);
    if (!allPlayersMarked) {
      return; // Silently ignore if called when not ready
    }

    const newCompletedRounds = [...completedRounds, currentRound];
    setCompletedRounds(newCompletedRounds);
    setCurrentRound(null);
    setCurrentPhase("completed");

    // Auto-start next round if not at max
    const nextRoundNumber = newCompletedRounds.length + 1;
    if (nextRoundNumber <= setup.maxRounds) {
      setTimeout(() => {
        setCurrentRound(createNewRound(nextRoundNumber));
        setCurrentPhase("bidding");
      }, 500); // Brief delay for user to see completion
    }
  }

  async function handleSaveGame() {
    if (completedRounds.length === 0) {
      alert("Please complete at least one round before saving");
      return;
    }

    setSaving(true);
    try {
      const game: Game = {
        createdAt: Timestamp.now(),
        setup,
        rounds: completedRounds,
      };

      const docRef = await addDoc(collection(db, "games"), game);
      navigate(`/game/${docRef.id}`);
    } catch (error) {
      console.error("Error saving game:", error);
      alert("Failed to save game. Please try again.");
      setSaving(false);
    }
  }

  const nextRoundNumber = completedRounds.length + 1;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Header />

      <div className="bg-gradient-to-r from-card-bid-100 to-card-accent-purple/20 border-3 border-card-bid-400 rounded-xl p-6 mb-8 shadow-card">
        <div className="text-base font-semibold mb-2">
          <strong className="text-card-bid-700">Players:</strong> <span className="text-gray-800">{setup.players.join(", ")}</span>
        </div>
        <div className="text-base font-semibold mb-2">
          <strong className="text-card-bid-700">Decks:</strong> <span className="text-gray-800">{setup.decks}</span> · <strong className="text-card-bid-700">Max Rounds:</strong>{" "}
          <span className="text-gray-800">{setup.maxRounds}</span>
        </div>
        <div className="text-base font-semibold">
          <strong className="text-card-bid-700">Completed Rounds:</strong> <span className="text-gray-800">{completedRounds.length} /{" "}
          {setup.maxRounds}</span>
        </div>
      </div>

      {/* Completed Rounds */}
      {completedRounds.map((round) => (
        <div key={round.roundNumber} className="border rounded p-4 mb-4 bg-gray-50">
          <h3 className="font-semibold mb-3">
            Round {round.roundNumber} - Completed
          </h3>
          <div className="space-y-2">
            {round.scores.map((ps, i) => (
              <div key={i} className="grid grid-cols-6 gap-2 items-center text-sm">
                <span className="font-medium">{ps.name}</span>
                <span className="text-gray-600">Bid: {ps.bid}</span>
                <span className="text-gray-600">Took: {ps.tricks}</span>
                <span
                  className={`font-medium ${
                    ps.met ? "text-green-700" : "text-red-600"
                  }`}
                >
                  {ps.met ? "✓ Met" : "✗ Missed"}
                </span>
                <span
                  className={`font-mono text-right font-bold ${
                    ps.score < 0 ? "text-red-600" : "text-green-700"
                  }`}
                >
                  {ps.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

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
          <div className="mb-6 p-5 bg-card-felt-100 border-2 border-card-felt-400 rounded-xl text-base text-gray-700 font-semibold">
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
            className="mb-6 bg-gradient-to-r from-card-result-success to-card-result-successLight text-white px-8 py-4 rounded-xl text-lg font-bold hover:shadow-card-hover hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all w-full"
          >
            Complete Round Now
          </button>
        </div>
      )}

      {/* Running Totals */}
      {completedRounds.length > 0 && <Totals rounds={completedRounds} />}

      {/* Action Buttons */}
      <div className="mt-8 flex gap-4 flex-wrap">
        {completedRounds.length > 0 && !currentRound && (
          <button
            onClick={handleSaveGame}
            disabled={saving}
            className="bg-gradient-to-r from-card-felt-green to-card-felt-400 text-white px-8 py-4 rounded-xl text-lg font-bold hover:shadow-card-hover hover:scale-105 disabled:bg-gray-400 disabled:hover:scale-100 transition-all flex-1 min-w-[200px]"
          >
            {saving ? "💾 Saving..." : "💾 Save Game"}
          </button>
        )}

        <button
          onClick={() => navigate("/")}
          className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:shadow-card-hover hover:scale-105 transition-all flex-1 min-w-[200px]"
        >
          ❌ Cancel
        </button>
      </div>

      {/* Max rounds warning */}
      {nextRoundNumber > setup.maxRounds && !currentRound && (
        <div className="mt-6 bg-gradient-to-r from-yellow-100 to-yellow-200 border-3 border-yellow-500 rounded-xl p-5 text-base text-yellow-900 font-semibold">
          ⚠️ Maximum rounds ({setup.maxRounds}) reached. Save the game to finish.
        </div>
      )}

      {/* In progress info */}
      {currentRound && currentPhase === "bidding" && (
        <div className="mt-6 bg-gradient-to-r from-card-bid-100 to-card-bid-200 border-3 border-card-bid-400 rounded-xl p-5 text-base text-card-bid-800 font-semibold">
          ℹ️ Game will automatically continue to results phase once all bids are entered.
        </div>
      )}
      {currentRound && currentPhase === "results" && (
        <div className="mt-6 bg-gradient-to-r from-card-felt-100 to-card-felt-200 border-3 border-card-felt-400 rounded-xl p-5 text-base text-card-felt-dark font-semibold">
          ℹ️ Next round will start automatically after completing this one.
        </div>
      )}
    </div>
  );
}
