import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/Header";
import PlayerAvatar from "../components/PlayerAvatar";
import { calculateMaxRounds } from "../utils/rounds";
import { createGame } from "../firebase";
import type { GameSetup } from "../types";

export default function GameSetupPage() {
  const navigate = useNavigate();
  const { user, signInWithGoogle, loading } = useAuth();
  const [decks, setDecks] = useState<number | "">(1);
  const [players, setPlayers] = useState<string[]>(["Player 1", "Player 2"]);

  function updatePlayer(index: number, name: string) {
    const copy = [...players];
    copy[index] = name;
    setPlayers(copy);
  }

  async function startGame() {
    // User is guaranteed to be authenticated at this point
    if (!user) return;

    const deckCount = typeof decks === "number" ? decks : 1;

    const setup: GameSetup = {
      decks: deckCount,
      players,
      maxRounds: calculateMaxRounds(deckCount, players.length),
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
          <div className="text-center py-12">
            <div className="text-xl font-semibold mb-6 text-gray-700">
              🔐 Sign in to create a new game
            </div>
            <button
              onClick={signInWithGoogle}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-5 rounded-xl text-xl font-bold shadow-card-hover hover:shadow-2xl hover:scale-105 transition-all"
            >
              Sign in with Google
            </button>
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

        <label className="block mb-8">
          <span className="text-base font-bold text-gray-800 mb-3 block">
            Number of decks
          </span>
          <input
            type="number"
            min={1}
            value={decks}
            onChange={(e) =>
              setDecks(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="border-3 border-felt-400 rounded-xl px-5 py-4 w-full text-lg font-semibold focus:border-gold-500 focus:outline-none focus:ring-4 focus:ring-gold-500/30 transition-all bg-white"
          />
        </label>

        <div className="mb-8">
          <p className="text-base font-bold text-gray-800 mb-4">Players</p>
          {players.map((p, i) => (
            <div key={i} className="flex items-center gap-4 mb-4">
              <PlayerAvatar name={p} size="lg" index={i} />
              <input
                value={p}
                onChange={(e) => updatePlayer(i, e.target.value)}
                className="border-3 border-felt-400 rounded-xl px-5 py-4 w-full text-lg font-semibold focus:border-gold-500 focus:outline-none focus:ring-4 focus:ring-gold-500/30 transition-all bg-white"
              />
            </div>
          ))}
          <button
            onClick={() =>
              setPlayers([...players, `Player ${players.length + 1}`])
            }
            className="text-bid-600 text-base font-bold hover:text-bid-700 mt-3 px-4 py-2 hover:bg-white/50 rounded-lg transition-all"
          >
            + Add player
          </button>
        </div>

        <button
          onClick={startGame}
          className="bg-gradient-to-r from-felt-500 to-felt-400 text-white px-8 py-5 rounded-xl text-xl font-bold shadow-card-hover hover:shadow-2xl hover:scale-105 transition-all w-full"
        >
          🎮 Start Game
        </button>
      </div>
    </div>
  );
}
