import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="flex justify-between items-center mb-8 pb-6 border-b-4 border-felt-400">
      <h1 className="text-2xl sm:text-4xl font-bold text-felt-600 flex items-center gap-2 sm:gap-3">
        <span className="text-3xl sm:text-5xl">🃏</span>
        Old Heck
      </h1>
      {user && (
        <div className="flex gap-2">
          <Link
            to="/my-games"
            className="px-3 py-2 sm:px-4 sm:py-3 bg-gradient-to-r from-felt-500 to-felt-400 text-white rounded-xl hover:from-felt-600 hover:to-felt-500 transition-all font-bold shadow-card hover:shadow-card-hover hover:scale-105 text-sm sm:text-base whitespace-nowrap"
          >
            📋 My Games
          </Link>
          <Link
            to="/"
            className="px-3 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-bid-600 to-bid-400 text-white rounded-xl hover:from-bid-700 hover:to-bid-500 transition-all font-bold shadow-card hover:shadow-card-hover hover:scale-105 text-sm sm:text-lg whitespace-nowrap"
          >
            🎮 New Game
          </Link>
        </div>
      )}
    </header>
  );
}
