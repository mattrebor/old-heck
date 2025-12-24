import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { calculateMaxRounds } from "../utils/rounds";
import type { GameSetup } from "../types";

export default function GameSetupPage() {
  const navigate = useNavigate();
  const [decks, setDecks] = useState(1);
  const [players, setPlayers] = useState<string[]>(["Player 1", "Player 2"]);

  function updatePlayer(index: number, name: string) {
    const copy = [...players];
    copy[index] = name;
    setPlayers(copy);
  }

  function startGame() {
    const setup: GameSetup = {
      decks,
      players,
      maxRounds: calculateMaxRounds(decks, players.length),
    };

    navigate("/game/new", { state: setup });
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <Header />

      <label className="block mb-3">
        <span className="text-sm">Number of decks</span>
        <input
          type="number"
          min={1}
          value={decks}
          onChange={(e) => setDecks(Number(e.target.value))}
          className="border rounded px-2 py-1 w-full"
        />
      </label>

      <div className="mb-4">
        <p className="text-sm mb-1">Players</p>
        {players.map((p, i) => (
          <input
            key={i}
            value={p}
            onChange={(e) => updatePlayer(i, e.target.value)}
            className="border rounded px-2 py-1 w-full mb-2"
          />
        ))}
        <button
          onClick={() =>
            setPlayers([...players, `Player ${players.length + 1}`])
          }
          className="text-blue-600 text-sm"
        >
          + Add player
        </button>
      </div>

      <button
        onClick={startGame}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Start Game
      </button>
    </div>
  );
}
