import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { Game } from "../types";
import Header from "../components/Header";

export default function GameHistoryPage() {
  const { gameId } = useParams();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!gameId) {
        setError("No game ID provided");
        setLoading(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "games", gameId));
        if (snap.exists()) {
          setGame({ id: snap.id, ...(snap.data() as Game) });
        } else {
          setError("Game not found");
        }
      } catch (err) {
        console.error("Error loading game:", err);
        setError("Failed to load game. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [gameId]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto p-4">
        <Header />
        <div className="text-center py-8 text-gray-600">Loading game...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto p-4">
        <Header />
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!game) return <div className="p-4">Loading…</div>;

  return (
    <div className="max-w-xl mx-auto p-4">
      <Header />
      <p className="text-sm text-gray-600 mb-3">
        Decks: {game.setup.decks} · Players: {game.setup.players.length} · Max
        rounds: {game.setup.maxRounds}
      </p>

      {game.rounds.map((r) => (
        <div key={r.roundNumber} className="border rounded p-4 mb-3">
          <h3 className="font-semibold mb-2">Round {r.roundNumber}</h3>
          <div className="space-y-1">
            {r.scores.map((s, i) => (
              <div key={i} className="grid grid-cols-5 gap-2 text-sm">
                <span className="font-medium">{s.name}</span>
                <span className="text-gray-600">Bid: {s.bid}</span>
                <span className="text-gray-600">Took: {s.tricks}</span>
                <span
                  className={`${s.met ? "text-green-700" : "text-red-600"}`}
                >
                  {s.met ? "✓ Met" : "✗ Missed"}
                </span>
                <span className="font-mono text-right">{s.score}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
