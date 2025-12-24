import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="flex justify-between items-center mb-8 pb-6 border-b-4 border-card-felt-400">
      <h1 className="text-4xl font-bold text-card-felt-dark flex items-center gap-3">
        <span className="text-5xl">🃏</span>
        Old Heck
      </h1>
      <Link
        to="/"
        className="px-6 py-3 bg-gradient-to-r from-card-bid-600 to-card-bid-400 text-white rounded-xl hover:from-card-bid-700 hover:to-card-bid-500 transition-all font-bold shadow-card hover:shadow-card-hover hover:scale-105 text-lg"
      >
        🎮 New Game
      </Link>
    </header>
  );
}
