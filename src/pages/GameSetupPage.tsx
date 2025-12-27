import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/Header";
import PlayerAvatar from "../components/PlayerAvatar";
import EmailPasswordSignIn from "../components/EmailPasswordSignIn";
import { calculateMaxRounds } from "../utils/rounds";
import { createGame } from "../firebase";
import type { GameSetup } from "../types";

export default function GameSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signInWithGoogle, loading } = useAuth();

  // Check if we received prefill data from location state
  const prefillSetup = location.state?.setup as GameSetup | undefined;

  const [decks, setDecks] = useState<number | "">(prefillSetup?.decks ?? 1);
  const [players, setPlayers] = useState<string[]>(
    prefillSetup?.players ?? ["Player 1", "Player 2"]
  );
  const [firstPlayerIndex, setFirstPlayerIndex] = useState<number>(
    prefillSetup?.firstPlayerIndex ?? 0
  );

  function updatePlayer(index: number, name: string) {
    const copy = [...players];
    copy[index] = name;
    setPlayers(copy);
  }

  function movePlayerUp(index: number) {
    if (index === 0) return; // Already at the top
    const copy = [...players];
    [copy[index - 1], copy[index]] = [copy[index], copy[index - 1]];
    setPlayers(copy);

    // Adjust firstPlayerIndex if needed
    if (firstPlayerIndex === index) {
      setFirstPlayerIndex(index - 1);
    } else if (firstPlayerIndex === index - 1) {
      setFirstPlayerIndex(index);
    }
  }

  function movePlayerDown(index: number) {
    if (index === players.length - 1) return; // Already at the bottom
    const copy = [...players];
    [copy[index], copy[index + 1]] = [copy[index + 1], copy[index]];
    setPlayers(copy);

    // Adjust firstPlayerIndex if needed
    if (firstPlayerIndex === index) {
      setFirstPlayerIndex(index + 1);
    } else if (firstPlayerIndex === index + 1) {
      setFirstPlayerIndex(index);
    }
  }

  async function startGame() {
    // User is guaranteed to be authenticated at this point
    if (!user) return;

    // Validate that all player names are non-empty after trimming
    const trimmedPlayers = players.map(p => p.trim());
    if (trimmedPlayers.some(p => p === "")) {
      alert("All player names must be filled in. Please provide names for all players.");
      return;
    }

    const deckCount = typeof decks === "number" ? decks : 1;

    const setup: GameSetup = {
      decks: deckCount,
      players: trimmedPlayers,
      maxRounds: calculateMaxRounds(deckCount, players.length),
      firstPlayerIndex,
    };

    try {
      const gameId = await createGame(setup, {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
      });
      navigate(`/game/${gameId}`);
    } catch (error) {
      console.error("Error creating game:", error);
      alert("Failed to create game. Please try again.");
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <Header />
        <div className="text-center py-12">
          <div className="text-xl font-semibold">Loading...</div>
        </div>
      </div>
    );
  }

  // Show sign-in prompt for unauthenticated users
  if (!user) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <Header />
        <div className="bg-gradient-to-br from-felt-200 to-felt-300 rounded-2xl p-8 shadow-card-hover mb-8 border-4 border-felt-500">
          <h2 className="text-2xl sm:text-3xl font-bold text-felt-600 mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3">
            <span className="text-3xl sm:text-5xl">🃏</span>
            Set Up Your Game
          </h2>
          <div className="py-6">
            <div className="text-xl font-semibold mb-8 text-center text-gray-700">
              🔐 Sign in to create a new game
            </div>

            {/* Email/Password Sign In */}
            <div className="flex justify-center mb-6">
              <EmailPasswordSignIn />
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 border-t-2 border-gray-300"></div>
              <span className="text-sm text-gray-500 font-medium">OR</span>
              <div className="flex-1 border-t-2 border-gray-300"></div>
            </div>

            {/* Google Sign In */}
            <div className="text-center">
              <button
                onClick={signInWithGoogle}
                data-testid="setup-signin-button"
                className="bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all inline-flex items-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <Header />

      <div className="bg-gradient-to-br from-felt-200 to-felt-300 rounded-2xl p-8 shadow-card-hover mb-8 border-4 border-felt-500">
        <h2 className="text-2xl sm:text-3xl font-bold text-felt-600 mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3">
          <span className="text-3xl sm:text-5xl">🃏</span>
          Set Up Your Game
        </h2>

        <div className="mb-8">
          <span className="text-base font-bold text-gray-800 mb-3 block">
            Number of decks
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDecks(Math.max(1, (typeof decks === "number" ? decks : 1) - 1))}
              data-testid="setup-decks-decrease-button"
              className="bg-felt-500 hover:bg-felt-600 text-white font-bold text-2xl w-14 h-14 rounded-xl transition-all shadow-card hover:shadow-card-hover"
            >
              −
            </button>
            <input
              type="number"
              min={1}
              value={decks}
              onChange={(e) =>
                setDecks(e.target.value === "" ? "" : Number(e.target.value))
              }
              data-testid="setup-decks-input"
              className="border-3 border-felt-400 rounded-xl px-5 py-4 w-20 text-center text-xl font-bold focus:border-gold-500 focus:outline-none focus:ring-4 focus:ring-gold-500/30 transition-all bg-white"
            />
            <button
              onClick={() => setDecks((typeof decks === "number" ? decks : 1) + 1)}
              data-testid="setup-decks-increase-button"
              className="bg-felt-500 hover:bg-felt-600 text-white font-bold text-2xl w-14 h-14 rounded-xl transition-all shadow-card hover:shadow-card-hover"
            >
              +
            </button>
          </div>
        </div>

        <div className="mb-8">
          <p className="text-base font-bold text-gray-800 mb-4">Players</p>
          {players.map((p, i) => {
            const isEmpty = p.trim() === "";
            return (
              <div key={i} className="flex items-center gap-3 mb-4">
                {players.length > 2 && (
                  <button
                    onClick={() => setPlayers(players.filter((_, idx) => idx !== i))}
                    data-testid={`setup-players-remove-${i}`}
                    className="text-red-600 hover:text-red-700 font-bold text-xl px-2"
                    title="Remove player"
                  >
                    ×
                  </button>
                )}
                <PlayerAvatar name={p || "?"} size="lg" />
                <input
                  value={p}
                  onChange={(e) => updatePlayer(i, e.target.value)}
                  data-testid={`setup-players-input-${i}`}
                  className={`border-3 ${
                    isEmpty
                      ? "border-red-400 focus:border-red-500 focus:ring-red-500/30"
                      : "border-felt-400 focus:border-gold-500 focus:ring-gold-500/30"
                  } rounded-xl px-5 py-4 w-full text-lg font-semibold focus:outline-none focus:ring-4 transition-all bg-white`}
                  placeholder="Enter player name"
                />
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => movePlayerUp(i)}
                    disabled={i === 0}
                    data-testid={`setup-players-moveup-${i}`}
                    className="text-felt-600 hover:text-felt-700 disabled:text-gray-300 disabled:cursor-not-allowed font-bold text-lg px-2 transition-colors"
                    title="Move up"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => movePlayerDown(i)}
                    disabled={i === players.length - 1}
                    data-testid={`setup-players-movedown-${i}`}
                    className="text-felt-600 hover:text-felt-700 disabled:text-gray-300 disabled:cursor-not-allowed font-bold text-lg px-2 transition-colors"
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
              setPlayers([...players, `Player ${players.length + 1}`])
            }
            data-testid="setup-players-add-button"
            className="text-bid-600 text-base font-bold hover:text-bid-700 mt-3 px-4 py-2 hover:bg-white/50 rounded-lg transition-all"
          >
            + Add player
          </button>
        </div>

        <div className="mb-8">
          <label className="block">
            <span className="text-base font-bold text-gray-800 mb-3 block">
              Who starts first?
            </span>
            <select
              value={firstPlayerIndex}
              onChange={(e) => setFirstPlayerIndex(Number(e.target.value))}
              data-testid="setup-firstplayer-select"
              className="border-3 border-felt-400 rounded-xl px-5 py-4 w-full text-lg font-semibold focus:border-gold-500 focus:outline-none focus:ring-4 focus:ring-gold-500/30 transition-all bg-white"
            >
              {players.map((player, index) => (
                <option key={index} value={index}>
                  {player || `Player ${index + 1}`}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          onClick={startGame}
          disabled={players.some(p => p.trim() === "") || typeof decks !== "number" || decks < 1}
          data-testid="setup-start-button"
          className="bg-gradient-to-r from-felt-500 to-felt-400 text-white px-8 py-5 rounded-xl text-xl font-bold shadow-card-hover hover:shadow-2xl hover:scale-105 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all w-full"
        >
          🎮 Start Game
        </button>
      </div>
    </div>
  );
}
