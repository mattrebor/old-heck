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
  const [playersExpanded, setPlayersExpanded] = useState(false);
  const [showEndGameDialog, setShowEndGameDialog] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showEditSetup, setShowEditSetup] = useState(false);
  const [editPlayers, setEditPlayers] = useState<string[]>([]);
  const [editDecks, setEditDecks] = useState<number | "">(1);
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
    // Rotate the first bidder each round
    const firstBidderIndex = (roundNumber - 1) % gameSetup.players.length;

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
      firstBidderIndex,
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
  }

  async function handleStartNextRound() {
    if (!gameId || !setup) return;

    const nextRoundNumber = completedRounds.length + 1;
    if (nextRoundNumber > setup.maxRounds) return;

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
  }

  async function handleEndGameEarly() {
    if (!gameId) return;

    try {
      setIsSaving(true);

      // If there's a current round in progress, we need to clear it
      await updateGameRound(gameId, {
        inProgressRound: undefined,
        currentPhase: undefined,
      });

      // Mark the game as completed
      await markGameComplete(gameId);

      setShowEndGameDialog(false);

      // Navigate to view page after a brief delay
      setTimeout(() => {
        navigate(`/game/${gameId}/view`);
      }, 500);
    } catch (error) {
      console.error("Error ending game:", error);
      alert("Failed to end game. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  // Check if setup can be edited (round 1, bidding phase, no bids entered)
  const canEditSetup =
    completedRounds.length === 0 &&
    currentRound?.roundNumber === 1 &&
    currentPhase === "bidding" &&
    currentRound?.scores.every(s => s.bid === -1);

  function openEditSetup() {
    if (!setup) return;
    setEditPlayers([...setup.players]);
    setEditDecks(setup.decks);
    setShowEditSetup(true);
  }

  function updateEditPlayer(index: number, name: string) {
    const copy = [...editPlayers];
    copy[index] = name;
    setEditPlayers(copy);
  }

  async function saveSetupChanges() {
    if (!gameId || !setup) return;

    // Validate player names
    const trimmedPlayers = editPlayers.map(p => p.trim());
    if (trimmedPlayers.some(p => p === "")) {
      alert("All player names must be filled in.");
      return;
    }

    const deckCount = typeof editDecks === "number" ? editDecks : 1;
    if (deckCount < 1) {
      alert("Number of decks must be at least 1.");
      return;
    }

    try {
      setIsSaving(true);

      // Import calculateMaxRounds
      const { calculateMaxRounds } = await import("../utils/rounds");
      const maxRounds = calculateMaxRounds(deckCount, trimmedPlayers.length);

      const newSetup: GameSetup = {
        decks: deckCount,
        players: trimmedPlayers,
        maxRounds,
      };

      // Create new first round with updated players
      const newRound = createNewRoundFromSetup(newSetup, 1);

      await updateGameRound(gameId, {
        setup: newSetup,
        inProgressRound: newRound,
        currentPhase: "bidding",
      });

      // Update local state
      setSetup(newSetup);
      setCurrentRound(newRound);
      setShowEditSetup(false);
    } catch (error) {
      console.error("Error updating setup:", error);
      alert("Failed to update game setup. Please try again.");
    } finally {
      setIsSaving(false);
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

      {/* View-only link - Compact */}
      <div className="mb-3 bg-gradient-to-r from-purple-100 to-purple-200 border-2 border-purple-400 rounded-lg p-2">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-800">
            <span>👁️</span>
            <span>Share view-only link</span>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => navigate(`/game/${gameId}/view`)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs font-bold transition-all flex-1 sm:flex-none"
            >
              Open View
            </button>
            <button
              onClick={() => {
                const viewUrl = `${window.location.origin}/game/${gameId}/view`;
                navigator.clipboard.writeText(viewUrl);
                setLinkCopied(true);
                setTimeout(() => setLinkCopied(false), 2000);
              }}
              className={`${
                linkCopied
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-purple-500 hover:bg-purple-600"
              } text-white px-3 py-1 rounded text-xs font-bold transition-all flex-1 sm:flex-none`}
            >
              {linkCopied ? "✓ Copied!" : "📋 Copy"}
            </button>
          </div>
        </div>
      </div>

      {/* Game Info - Compact */}
      <div className="bg-gradient-to-r from-bid-100 to-accent-500/20 border-2 border-bid-400 rounded-lg p-3 mb-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm mb-2">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <div>
              <strong className="text-bid-700">Decks:</strong>{" "}
              <span className="text-gray-800">{setup.decks}</span>
            </div>
            <div>
              <strong className="text-bid-700">Rounds:</strong>{" "}
              <span className="text-gray-800">{completedRounds.length}/{setup.maxRounds}</span>
            </div>
          </div>
          <div className="flex gap-3">
            {canEditSetup && (
              <button
                onClick={openEditSetup}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                ✏️ Edit Setup
              </button>
            )}
            {nextRoundNumber <= setup.maxRounds && (
              <button
                onClick={() => setShowEndGameDialog(true)}
                className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline transition-colors"
              >
                End Game Early
              </button>
            )}
          </div>
        </div>
        <div className="border-t border-bid-300 pt-2">
          <button
            onClick={() => setPlayersExpanded(!playersExpanded)}
            className="flex items-center gap-2 text-sm font-semibold text-bid-700 hover:text-bid-800 transition-colors w-full"
          >
            <span className="text-xs">{playersExpanded ? '▼' : '▶'}</span>
            <span>Players ({setup.players.length})</span>
          </button>
          {playersExpanded && (
            <div className="mt-2 text-sm text-gray-800 pl-5">
              {setup.players.join(", ")}
            </div>
          )}
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
            className="mb-6 bg-gradient-to-r from-success-500 to-success-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:shadow-card-hover hover:scale-105 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all w-full"
          >
            Complete Round Now
          </button>
        </div>
      )}

      {/* Running Totals */}
      {completedRounds.length > 0 && <Totals rounds={completedRounds} />}


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

      {/* Start Next Round button */}
      {!currentRound && currentPhase === "completed" && nextRoundNumber <= setup.maxRounds && (
        <div className="mt-6">
          <button
            onClick={handleStartNextRound}
            disabled={isSaving}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-6 rounded-xl text-xl font-bold shadow-card-hover hover:shadow-2xl hover:scale-105 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
          >
            {isSaving ? "Starting..." : `🎯 Start Round ${nextRoundNumber}`}
          </button>
        </div>
      )}

      {/* Edit Setup Dialog */}
      {showEditSetup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full shadow-2xl my-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Edit Game Setup
            </h3>
            <p className="text-gray-600 mb-6 text-sm">
              You can edit the game setup since no bids have been entered yet.
            </p>

            <div className="mb-6">
              <label className="block mb-4">
                <span className="text-base font-bold text-gray-800 mb-2 block">
                  Number of decks
                </span>
                <input
                  type="number"
                  min={1}
                  value={editDecks}
                  onChange={(e) =>
                    setEditDecks(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="border-3 border-felt-400 rounded-xl px-4 py-3 w-full text-lg font-semibold focus:border-gold-500 focus:outline-none focus:ring-4 focus:ring-gold-500/30 transition-all bg-white"
                />
              </label>

              <div>
                <p className="text-base font-bold text-gray-800 mb-3">Players</p>
                {editPlayers.map((p, i) => {
                  const isEmpty = p.trim() === "";
                  return (
                    <div key={i} className="flex items-center gap-3 mb-3">
                      <input
                        value={p}
                        onChange={(e) => updateEditPlayer(i, e.target.value)}
                        className={`border-3 ${
                          isEmpty
                            ? "border-red-400 focus:border-red-500 focus:ring-red-500/30"
                            : "border-felt-400 focus:border-gold-500 focus:ring-gold-500/30"
                        } rounded-xl px-4 py-3 w-full text-base font-semibold focus:outline-none focus:ring-4 transition-all bg-white`}
                        placeholder="Enter player name"
                      />
                      {editPlayers.length > 2 && (
                        <button
                          onClick={() => setEditPlayers(editPlayers.filter((_, idx) => idx !== i))}
                          className="text-red-600 hover:text-red-700 font-bold text-xl px-2"
                          title="Remove player"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
                <button
                  onClick={() => setEditPlayers([...editPlayers, `Player ${editPlayers.length + 1}`])}
                  className="text-bid-600 text-sm font-bold hover:text-bid-700 mt-2 px-3 py-2 hover:bg-white/50 rounded-lg transition-all"
                >
                  + Add player
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowEditSetup(false)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-bold hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={saveSetupChanges}
                disabled={isSaving || editPlayers.some(p => p.trim() === "") || typeof editDecks !== "number" || editDecks < 1}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Game Early Confirmation Dialog */}
      {showEndGameDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              End Game Early?
            </h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to end this game now? The game will be marked as
              completed with the current scores. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndGameDialog(false)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-bold hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleEndGameEarly}
                disabled={isSaving}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-400 transition-all"
              >
                {isSaving ? "Ending..." : "End Game"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
