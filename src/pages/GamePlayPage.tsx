import { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import type { GameSetup, Round, Game } from "../types";
import { calculateOldHeckScore } from "../scoring";
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
        scores: setup.players.map((name) => ({
          name,
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
      scores: setup.players.map((name) => ({
        name,
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
    <div className="max-w-4xl mx-auto p-4">
      <Header />

      <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
        <div className="text-sm">
          <strong>Players:</strong> {setup.players.join(", ")}
        </div>
        <div className="text-sm">
          <strong>Decks:</strong> {setup.decks} · <strong>Max Rounds:</strong>{" "}
          {setup.maxRounds}
        </div>
        <div className="text-sm">
          <strong>Completed Rounds:</strong> {completedRounds.length} /{" "}
          {setup.maxRounds}
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
          <div className="mb-4 text-sm text-gray-600">
            {currentRound.scores.every((ps) => ps.tricks >= 0)
              ? "All players marked! Round will auto-complete in a moment..."
              : "Mark all players to continue. Round will auto-complete when done."}
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
            className="mb-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Complete Round Now
          </button>
        </div>
      )}

      {/* Running Totals */}
      {completedRounds.length > 0 && <Totals rounds={completedRounds} />}

      {/* Action Buttons */}
      <div className="mt-6 flex gap-3 flex-wrap">
        {completedRounds.length > 0 && !currentRound && (
          <button
            onClick={handleSaveGame}
            disabled={saving}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            {saving ? "Saving..." : "Save Game"}
          </button>
        )}

        <button
          onClick={() => navigate("/")}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>

      {/* Max rounds warning */}
      {nextRoundNumber > setup.maxRounds && !currentRound && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
          Maximum rounds ({setup.maxRounds}) reached. Save the game to finish.
        </div>
      )}

      {/* In progress info */}
      {currentRound && currentPhase === "bidding" && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
          Game will automatically continue to results phase once all bids are entered.
        </div>
      )}
      {currentRound && currentPhase === "results" && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
          Next round will start automatically after completing this one.
        </div>
      )}
    </div>
  );
}
