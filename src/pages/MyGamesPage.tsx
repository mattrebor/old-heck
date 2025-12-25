import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import type { Game } from "../types";
import Header from "../components/Header";

export default function MyGamesPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/");
      return;
    }

    const gamesRef = collection(db, "games");
    const q = query(
      gamesRef,
      where("createdBy.uid", "==", user.uid),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const gamesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Game[];
      setGames(gamesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Header />
        <div className="text-center py-12">
          <div className="text-xl font-semibold">Loading your games...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Header />

      <div className="bg-gradient-to-br from-felt-300 to-felt-200 rounded-2xl p-6 mb-8 border-4 border-felt-500 shadow-card-hover">
        <h2 className="text-2xl sm:text-3xl font-bold text-felt-600 mb-2 flex items-center gap-2 sm:gap-3">
          <span className="text-3xl sm:text-4xl">🎮</span>
          My Games
        </h2>
        <p className="text-gray-700">Games you've created</p>
      </div>

      {games.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-card p-8">
          <div className="text-xl font-semibold text-gray-600 mb-4">
            No games yet
          </div>
          <p className="text-gray-500 mb-6">
            Create your first game to get started!
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-gradient-to-r from-bid-600 to-bid-400 text-white px-8 py-4 rounded-xl text-lg font-bold hover:shadow-card-hover hover:scale-105 transition-all"
          >
            🎮 New Game
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {games.map((game) => {
            const isCompleted = game.status === 'completed';
            const targetPath = isCompleted
              ? `/game/${game.id}/view`
              : `/game/${game.id}`;

            return (
              <div
                key={game.id}
                onClick={() => navigate(targetPath)}
                className="bg-white rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all cursor-pointer border-2 border-gray-200 hover:border-bid-400"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">
                        Game {game.id?.substring(0, 8)}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-lg text-sm font-bold ${
                          isCompleted
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {isCompleted ? '✓ Completed' : '▶ In Progress'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                      <div>
                        <strong>Players:</strong> {game.setup.players.length}
                      </div>
                      <div>
                        <strong>Decks:</strong> {game.setup.decks}
                      </div>
                      <div>
                        <strong>Rounds:</strong> {game.rounds?.length || 0}/{game.setup.maxRounds}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">
                      {game.updatedAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Players: {game.setup.players.join(", ")}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
