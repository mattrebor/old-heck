import { useState } from "react";
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

  const [completedRounds, setCompletedRounds] = useState<Round[]>([]);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [currentPhase, setCurrentPhase] = useState<RoundPhase>("completed");
  const [saving, setSaving] = useState(false);

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
        bid: 0,
        tricks: 0,
        met: false,
        score: 0,
      })),
    };
  }

  function handleStartNewRound() {
    const roundNumber = completedRounds.length + 1;
    setCurrentRound(createNewRound(roundNumber));
    setCurrentPhase("bidding");
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
    setCurrentPhase("results");
  }

  function handleUpdateTricks(playerIndex: number, tricks: number) {
    if (!currentRound) return;

    const updatedScores = currentRound.scores.map((ps, i) => {
      if (i === playerIndex) {
        const met = ps.bid === tricks;
        const score = calculateOldHeckScore(tricks, met);
        return { ...ps, tricks, met, score };
      }
      return ps;
    });

    setCurrentRound({ ...currentRound, scores: updatedScores });
  }

  function handleCompleteRound() {
    if (!currentRound) return;

    // Verify all tricks are entered
    const allTricksEntered = currentRound.scores.every((ps) => ps.tricks >= 0);
    if (!allTricksEntered) {
      alert("Please enter tricks for all players");
      return;
    }

    setCompletedRounds([...completedRounds, currentRound]);
    setCurrentRound(null);
    setCurrentPhase("completed");
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
  const canAddMoreRounds = nextRoundNumber <= setup.maxRounds && !currentRound;

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
          onUpdate={handleUpdateBid}
          onComplete={handleBidsComplete}
        />
      )}

      {/* Current Round - Results Phase */}
      {currentRound && currentPhase === "results" && (
        <div>
          <RoundEditor round={currentRound} onUpdate={handleUpdateTricks} />
          <button
            onClick={handleCompleteRound}
            className="mb-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Complete Round
          </button>
        </div>
      )}

      {/* No rounds yet */}
      {completedRounds.length === 0 && !currentRound && (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-4">No rounds yet. Click "Start Round 1" to begin!</p>
        </div>
      )}

      {/* Running Totals */}
      {completedRounds.length > 0 && <Totals rounds={completedRounds} />}

      {/* Action Buttons */}
      <div className="mt-6 flex gap-3 flex-wrap">
        {canAddMoreRounds && (
          <button
            onClick={handleStartNewRound}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Start Round {nextRoundNumber}
          </button>
        )}

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

      {/* In progress warning */}
      {currentRound && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
          Complete the current round before starting a new one or saving the game.
        </div>
      )}
    </div>
  );
}
