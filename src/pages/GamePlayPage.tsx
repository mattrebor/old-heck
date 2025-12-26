import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import {
  db,
  loadGame,
  updateGameRound,
  markGameComplete,
  generateShareToken,
  claimShareToken,
} from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import type { Game } from "../types";
import type { GameSetup, Round } from "../types";
import { hasResultRecorded } from "../types";
import { calculateOldHeckScore } from "../scoring";
import { debounce } from "../utils/debounce";
import { createRound } from "../utils/rounds";
import Header from "../components/Header";
import BidCollector from "../components/BidCollector";
import RoundEditor from "../components/RoundEditor";
import Totals from "../components/Totals";
import ShareModal from "../components/ShareModal";
import PlayerAvatar from "../components/PlayerAvatar";

type RoundPhase = "bidding" | "results" | "score-review" | "completed";

// Constants
const AUTO_SAVE_DEBOUNCE_MS = 500;
const NAVIGATION_DELAY_MS = 500;

export default function GamePlayPage({
  isSharedAccess = false,
}: {
  isSharedAccess?: boolean;
}) {
  const { gameId, token } = useParams<{ gameId: string; token?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Access control state
  const [hasAccess, setHasAccess] = useState(false);
  const [accessType, setAccessType] = useState<"owner" | "shared" | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Share link generation state
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const [setup, setSetup] = useState<GameSetup | null>(null);
  const [completedRounds, setCompletedRounds] = useState<Round[]>([]);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [currentPhase, setCurrentPhase] = useState<RoundPhase>("completed");
  const [biddingPhase, setBiddingPhase] = useState<"blind-declaration-and-entry" | "regular-bid-entry">("blind-declaration-and-entry");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [playersExpanded, setPlayersExpanded] = useState(false);
  const [showEndGameDialog, setShowEndGameDialog] = useState(false);
  const [showEditSetup, setShowEditSetup] = useState(false);
  const [editPlayers, setEditPlayers] = useState<string[]>([]);
  const [editDecks, setEditDecks] = useState<number | "">(1);
  const [editFirstPlayerIndex, setEditFirstPlayerIndex] = useState<number>(0);

  // Create debounced auto-save function for bid and result updates
  const debouncedSaveRef = useRef(
    debounce(async (gameId: string, round: Round, phase: "bidding" | "results", biddingPhase?: "blind-declaration-and-entry" | "regular-bid-entry") => {
      try {
        await updateGameRound(gameId, {
          inProgressRound: round,
          currentPhase: phase,
          ...(phase === "bidding" && biddingPhase && { biddingPhase }),
        });
      } catch (error) {
        console.error(`Failed to auto-save ${phase}:`, error);
      }
    }, AUTO_SAVE_DEBOUNCE_MS)
  );

  // Verify access and set up real-time game updates
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    async function verifyAccessAndSubscribe() {
      if (!gameId) {
        setTokenError("No game ID provided");
        setLoading(false);
        return;
      }

      try {
        // First, do one-time load to verify access
        const game = await loadGame(gameId);
        if (!game) {
          setTokenError("Game not found");
          setLoading(false);
          return;
        }

        // Check if user is owner
        if (user && game.createdBy?.uid === user.uid) {
          setHasAccess(true);
          setAccessType("owner");
        }
        // Check if accessing via share token
        else if (isSharedAccess && token) {
          const result = await claimShareToken(gameId, token);
          if (result.success) {
            setHasAccess(true);
            setAccessType("shared");
          } else {
            setTokenError(result.error || "Invalid or expired link");
            setLoading(false);
            return;
          }
        }
        // No access
        else {
          setTokenError("You don't have permission to edit this game");
          setLoading(false);
          return;
        }

        // Access granted - set up real-time subscription
        const gameRef = doc(db, "games", gameId);
        unsubscribe = onSnapshot(
          gameRef,
          async (snapshot) => {
            if (!snapshot.exists()) {
              setError("Game not found");
              setLoading(false);
              return;
            }

            const gameData = { id: snapshot.id, ...snapshot.data() } as Game;

            // Update game state
            setSetup(gameData.setup);
            setCompletedRounds(gameData.rounds || []);
            setCurrentRound(gameData.inProgressRound || null);
            setCurrentPhase(gameData.currentPhase || "completed");
            setBiddingPhase(gameData.biddingPhase || "blind-declaration-and-entry");

            // If no round in progress and not at max rounds, start first round
            // Only do this on initial load, not on subsequent updates
            if (!gameData.inProgressRound && gameData.rounds.length === 0 && loading) {
              const firstRound = createRound(gameData.setup, 1);
              setCurrentRound(firstRound);
              setCurrentPhase("bidding");
              setBiddingPhase("blind-declaration-and-entry");

              // Save initial round to Firestore
              await updateGameRound(gameId, {
                inProgressRound: firstRound,
                currentPhase: "bidding",
                biddingPhase: "blind-declaration-and-entry",
              });
            }

            setLoading(false);
          },
          (err) => {
            console.error("Error loading game:", err);
            setError("Failed to load game");
            setLoading(false);
          }
        );
      } catch (err) {
        console.error("Error verifying access:", err);
        setError("Failed to load game");
        setLoading(false);
      }
    }

    verifyAccessAndSubscribe();

    // Cleanup: unsubscribe from real-time updates
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [gameId, token, user, isSharedAccess]);

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Header />
        <div className="text-center py-12">
          <div className="text-xl font-semibold">
            {isSharedAccess ? "Verifying access..." : "Loading game..."}
          </div>
        </div>
      </div>
    );
  }

  // Show access denied state
  if (tokenError) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Header />
        <div className="mt-12 p-6 bg-red-50 border-2 border-red-300 rounded-lg text-center">
          <h2 className="text-2xl font-bold text-red-800 mb-2">
            Access Denied
          </h2>
          <p className="text-red-700 mb-4">{tokenError}</p>
          {isSharedAccess && (
            <p className="text-sm text-gray-600 mb-4">
              This link may have already been used or expired.
            </p>
          )}
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

  // Show general error state
  if (error || !setup || !hasAccess) {
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

  function createNewRound(roundNumber: number): Round {
    if (!setup) throw new Error("Setup not loaded");
    return createRound(setup, roundNumber);
  }

  function handleUpdateBid(
    playerIndex: number,
    bid: number,
    blindBid: boolean
  ) {
    if (!currentRound || !gameId) return;

    const updatedScores = currentRound.scores.map((ps, i) => {
      if (i === playerIndex) {
        return { ...ps, bid, blindBid };
      }
      return ps;
    });

    const updatedRound = { ...currentRound, scores: updatedScores };
    setCurrentRound(updatedRound);

    // Auto-save with debouncing
    debouncedSaveRef.current(gameId, updatedRound, currentPhase as "bidding" | "results", biddingPhase);
  }

  function handleBiddingPhaseChange(phase: "blind-declaration-and-entry" | "regular-bid-entry") {
    setBiddingPhase(phase);

    // Cancel any pending debounced saves
    debouncedSaveRef.current.cancel();

    // Immediately save both the phase change and current round state (not debounced)
    // This ensures blind bid flags are saved before viewers see the phase change
    if (gameId && currentRound) {
      updateGameRound(gameId, {
        inProgressRound: currentRound,
        currentPhase: "bidding",
        biddingPhase: phase,
      }).catch(err => console.error("Failed to save bidding phase:", err));
    }
  }

  async function handleBidsComplete() {
    if (!currentRound || !gameId) return;

    // Cancel any pending debounced saves to prevent overwriting the phase
    debouncedSaveRef.current.cancel();

    // Reset results to unrecorded (met: null) for results phase
    const scoresWithResetResults = currentRound.scores.map((ps) => ({
      ...ps,
      met: null,
      score: 0,
    }));

    const updatedRound = { ...currentRound, scores: scoresWithResetResults };
    setCurrentRound(updatedRound);
    setCurrentPhase("results");

    // Scroll to top when transitioning to results phase
    window.scrollTo({ top: 0, behavior: 'smooth' });

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
    if (!currentRound || !gameId) return;

    const updatedScores = currentRound.scores.map((ps, i) => {
      if (i === playerIndex) {
        // Calculate score based on whether they made their bid
        const score = calculateOldHeckScore(ps.bid, madeBid, ps.blindBid);
        return { ...ps, met: madeBid, score };
      }
      return ps;
    });

    const updatedRound = { ...currentRound, scores: updatedScores };
    setCurrentRound(updatedRound);

    // Auto-save with debouncing
    debouncedSaveRef.current(gameId, updatedRound, "results");
  }

  async function handleCompleteRound() {
    if (!currentRound || !gameId || !setup) return;

    // Safety check - should never happen since button is disabled
    const allPlayersMarked = currentRound.scores.every(hasResultRecorded);
    if (!allPlayersMarked) {
      return; // Silently ignore if called when not ready
    }

    const newCompletedRounds = [...completedRounds, currentRound];
    setCompletedRounds(newCompletedRounds);
    setCurrentRound(null);
    setCurrentPhase("completed");

    // Save completed round to Firestore and determine next step
    const nextRoundNumber = newCompletedRounds.length + 1;

    try {
      setIsSaving(true);
      await updateGameRound(gameId, {
        rounds: newCompletedRounds,
        inProgressRound: undefined,
        currentPhase: "completed",
      });

      // Check if game is complete
      if (nextRoundNumber > setup.maxRounds) {
        // Scroll to top to show game complete message
        window.scrollTo({ top: 0, behavior: 'smooth' });
        await markGameComplete(gameId);
      } else if (newCompletedRounds.length === 1) {
        // After round 1: Auto-start round 2 (skip score review)
        const newRound = createNewRound(nextRoundNumber);
        setCurrentRound(newRound);
        setCurrentPhase("bidding");
        setBiddingPhase("blind-declaration-and-entry");

        // Scroll to top when auto-starting next round
        window.scrollTo({ top: 0, behavior: 'smooth' });

        await updateGameRound(gameId, {
          inProgressRound: newRound,
          currentPhase: "bidding",
          biddingPhase: "blind-declaration-and-entry",
        });
      } else {
        // After round 2+: Show score review phase
        setCurrentPhase("score-review");

        // Scroll to top when entering score review phase
        window.scrollTo({ top: 0, behavior: 'smooth' });

        await updateGameRound(gameId, {
          currentPhase: "score-review",
        });
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
    const newRound = createNewRound(nextRoundNumber);

    setCurrentRound(newRound);
    setCurrentPhase("bidding");
    setBiddingPhase("blind-declaration-and-entry");

    // Scroll to top when starting next round
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      setIsSaving(true);
      await updateGameRound(gameId, {
        inProgressRound: newRound,
        currentPhase: "bidding",
        biddingPhase: "blind-declaration-and-entry",
      });
    } catch (error) {
      console.error("Error starting next round:", error);
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
      }, NAVIGATION_DELAY_MS);
    } catch (error) {
      console.error("Error ending game:", error);
      alert("Failed to end game. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleStartNewGameWithSameSettings() {
    if (!setup) return;

    // Navigate to setup page with prefilled settings
    navigate("/", { state: { setup } });
  }

  async function handleGenerateShareLink() {
    if (!gameId) return;

    setGeneratingLink(true);
    try {
      const generatedToken = await generateShareToken(gameId);
      const link = `${window.location.origin}/game/${gameId}/shared/${generatedToken}`;
      setShareLink(link);

      // Auto-copy to clipboard
      await navigator.clipboard.writeText(link);
      setShareLinkCopied(true);
      setTimeout(() => setShareLinkCopied(false), 3000);
    } catch (err) {
      console.error("Failed to generate share link:", err);
    } finally {
      setGeneratingLink(false);
    }
  }

  // Check if setup can be edited (round 1, bidding phase, no bids entered)
  const canEditSetup =
    completedRounds.length === 0 &&
    currentRound?.roundNumber === 1 &&
    currentPhase === "bidding" &&
    currentRound?.scores.every((s) => s.bid === -1);

  function openEditSetup() {
    if (!setup) return;
    setEditPlayers([...setup.players]);
    setEditDecks(setup.decks);
    setEditFirstPlayerIndex(setup.firstPlayerIndex || 0);
    setShowEditSetup(true);
  }

  function updateEditPlayer(index: number, name: string) {
    const copy = [...editPlayers];
    copy[index] = name;
    setEditPlayers(copy);
  }

  function moveEditPlayerUp(index: number) {
    if (index === 0) return; // Already at the top
    const copy = [...editPlayers];
    [copy[index - 1], copy[index]] = [copy[index], copy[index - 1]];
    setEditPlayers(copy);

    // Adjust editFirstPlayerIndex if needed
    if (editFirstPlayerIndex === index) {
      setEditFirstPlayerIndex(index - 1);
    } else if (editFirstPlayerIndex === index - 1) {
      setEditFirstPlayerIndex(index);
    }
  }

  function moveEditPlayerDown(index: number) {
    if (index === editPlayers.length - 1) return; // Already at the bottom
    const copy = [...editPlayers];
    [copy[index], copy[index + 1]] = [copy[index + 1], copy[index]];
    setEditPlayers(copy);

    // Adjust editFirstPlayerIndex if needed
    if (editFirstPlayerIndex === index) {
      setEditFirstPlayerIndex(index + 1);
    } else if (editFirstPlayerIndex === index + 1) {
      setEditFirstPlayerIndex(index);
    }
  }

  async function saveSetupChanges() {
    if (!gameId || !setup) return;

    // Validate player names
    const trimmedPlayers = editPlayers.map((p) => p.trim());
    if (trimmedPlayers.some((p) => p === "")) {
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
        firstPlayerIndex: editFirstPlayerIndex,
      };

      // Create new first round with updated players
      const newRound = createRound(newSetup, 1);

      await updateGameRound(gameId, {
        setup: newSetup,
        inProgressRound: newRound,
        currentPhase: "bidding",
        biddingPhase: "blind-declaration-and-entry",
      });

      // Update local state
      setSetup(newSetup);
      setCurrentRound(newRound);
      setBiddingPhase("blind-declaration-and-entry");
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
      <Header onShareClick={() => setShowShareModal(true)} />

      {/* Auto-save indicator */}
      {isSaving && (
        <div className="mb-4 bg-gradient-to-r from-blue-100 to-blue-200 border-2 border-blue-400 rounded-xl p-3 text-sm text-blue-800 font-semibold text-center">
          💾 Saving...
        </div>
      )}

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
              <span className="text-gray-800">
                {completedRounds.length}/{setup.maxRounds}
              </span>
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
                ⏹ End Game Early
              </button>
            )}
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

      {/* Current Round - Bidding Phase */}
      {currentRound && currentPhase === "bidding" && (
        <BidCollector
          round={currentRound}
          tricksAvailable={currentRound.roundNumber}
          onUpdate={handleUpdateBid}
          onComplete={handleBidsComplete}
          initialPhase={biddingPhase}
          onPhaseChange={handleBiddingPhaseChange}
        />
      )}

      {/* Current Round - Results Phase */}
      {currentRound && currentPhase === "results" && (
        <div>
          <RoundEditor round={currentRound} onUpdate={handleUpdateResult} />
          <div className="mb-6 p-5 bg-felt-100 border-2 border-felt-400 rounded-xl text-base text-gray-700 font-semibold">
            {currentRound.scores.every(hasResultRecorded)
              ? "✅ All players marked! Click 'Complete Round' to continue."
              : "⏳ Mark all players to continue."}
          </div>
          <button
            onClick={handleCompleteRound}
            disabled={!currentRound.scores.every(hasResultRecorded)}
            className="mb-6 bg-gradient-to-r from-success-500 to-success-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:shadow-card-hover hover:scale-105 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all w-full"
          >
            Complete Round
          </button>
        </div>
      )}

      {/* Score Review Phase - After Round 2+ */}
      {currentPhase === "score-review" && setup && (
        <div className="mt-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-100 to-green-200 border-3 border-green-500 rounded-xl p-5 mb-6">
            <h2 className="text-2xl font-bold text-green-900 mb-2">
              ✅ Round {completedRounds.length} Complete!
            </h2>
            <p className="text-green-800">
              {(() => {
                const nextRoundNumber = completedRounds.length + 1;
                const nextFirstBidderIndex = (setup.firstPlayerIndex + (nextRoundNumber - 1)) % setup.players.length;
                const nextFirstBidderName = setup.players[nextFirstBidderIndex];
                return (
                  <>
                    Review the scores below and click "Start Round {nextRoundNumber}" when ready.{" "}
                    <strong className="text-green-900">{nextFirstBidderName}</strong> will start the bidding.
                  </>
                );
              })()}
            </p>
          </div>

          {/* Start Next Round Button */}
          <button
            onClick={handleStartNextRound}
            disabled={isSaving}
            className="w-full bg-gradient-to-r from-bid-500 to-bid-600 text-white px-6 py-4 rounded-xl text-xl font-bold hover:shadow-card-hover hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            {isSaving ? "💾 Saving..." : `▶️ Start Round ${completedRounds.length + 1}`}
          </button>
        </div>
      )}

      {/* Running Totals */}
      {completedRounds.length > 0 && (
        <Totals
          rounds={completedRounds}
          showDeltas={currentPhase === "score-review"}
        />
      )}

      {/* Max rounds warning */}
      {nextRoundNumber > setup.maxRounds && !currentRound && (
        <div className="mt-6 space-y-4">
          <div className="bg-gradient-to-r from-green-100 to-green-200 border-3 border-green-500 rounded-xl p-5 text-base text-green-900 font-semibold">
            🎉 Game complete! Maximum rounds ({setup.maxRounds}) reached. Game has
            been saved automatically.
          </div>
          <button
            onClick={handleStartNewGameWithSameSettings}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-xl text-xl font-bold hover:shadow-card-hover hover:scale-105 transition-all"
          >
            🎮 New Game with Same Settings
          </button>
        </div>
      )}

      {/* In progress info */}
      {currentRound && currentPhase === "bidding" && (
        <div className="mt-6 bg-gradient-to-r from-bid-100 to-bid-200 border-3 border-bid-400 rounded-xl p-5 text-base text-bid-800 font-semibold">
          ℹ️ Game will automatically continue to results phase once all bids are
          entered.
        </div>
      )}
      {currentRound && currentPhase === "results" && (
        <div className="mt-6 bg-gradient-to-r from-felt-100 to-felt-200 border-3 border-felt-400 rounded-xl p-5 text-base text-felt-600 font-semibold">
          {completedRounds.length === 0
            ? "ℹ️ Round 2 will start automatically after completing this round."
            : "ℹ️ You'll review scores before starting the next round."}
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
                    setEditDecks(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="border-3 border-felt-400 rounded-xl px-4 py-3 w-full text-lg font-semibold focus:border-gold-500 focus:outline-none focus:ring-4 focus:ring-gold-500/30 transition-all bg-white"
                />
              </label>

              <div>
                <p className="text-base font-bold text-gray-800 mb-3">
                  Players
                </p>
                {editPlayers.map((p, i) => {
                  const isEmpty = p.trim() === "";
                  return (
                    <div key={i} className="flex items-center gap-3 mb-3">
                      {editPlayers.length > 2 && (
                        <button
                          onClick={() =>
                            setEditPlayers(
                              editPlayers.filter((_, idx) => idx !== i)
                            )
                          }
                          className="text-red-600 hover:text-red-700 font-bold text-xl px-2"
                          title="Remove player"
                        >
                          ×
                        </button>
                      )}
                      <PlayerAvatar name={p || "?"} size="md" />
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
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => moveEditPlayerUp(i)}
                          disabled={i === 0}
                          className="text-felt-600 hover:text-felt-700 disabled:text-gray-300 disabled:cursor-not-allowed font-bold text-base px-2 transition-colors"
                          title="Move up"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => moveEditPlayerDown(i)}
                          disabled={i === editPlayers.length - 1}
                          className="text-felt-600 hover:text-felt-700 disabled:text-gray-300 disabled:cursor-not-allowed font-bold text-base px-2 transition-colors"
                          title="Move down"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  );
                })}
                <button
                  onClick={() =>
                    setEditPlayers([
                      ...editPlayers,
                      `Player ${editPlayers.length + 1}`,
                    ])
                  }
                  className="text-bid-600 text-sm font-bold hover:text-bid-700 mt-2 px-3 py-2 hover:bg-white/50 rounded-lg transition-all"
                >
                  + Add player
                </button>
              </div>

              <div className="mt-4">
                <label className="block">
                  <span className="text-base font-bold text-gray-800 mb-2 block">
                    Who starts first?
                  </span>
                  <select
                    value={editFirstPlayerIndex}
                    onChange={(e) => setEditFirstPlayerIndex(Number(e.target.value))}
                    className="border-3 border-felt-400 rounded-xl px-4 py-3 w-full text-base font-semibold focus:border-gold-500 focus:outline-none focus:ring-4 focus:ring-gold-500/30 transition-all bg-white"
                  >
                    {editPlayers.map((player, index) => (
                      <option key={index} value={index}>
                        {player || `Player ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </label>
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
                disabled={
                  isSaving ||
                  editPlayers.some((p) => p.trim() === "") ||
                  typeof editDecks !== "number" ||
                  editDecks < 1
                }
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
              Are you sure you want to end this game now? The game will be
              marked as completed with the current scores. This action cannot be
              undone.
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

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        gameId={gameId!}
        accessType={accessType!}
        onGenerateEditLink={handleGenerateShareLink}
        shareLink={shareLink}
        generatingLink={generatingLink}
        shareLinkCopied={shareLinkCopied}
        setShareLinkCopied={setShareLinkCopied}
      />
    </div>
  );
}
