import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface HeaderProps {
  onShareClick?: () => void;
}

export default function Header({ onShareClick }: HeaderProps = {}) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    try {
      await signOut();
      setMenuOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  }

  return (
    <header className="mb-8 pb-6 border-b-4 border-felt-400">
      <div className="flex justify-between items-center">
        <h1 className="text-xl xs:text-2xl sm:text-4xl font-bold text-felt-600 flex items-center gap-1 xs:gap-2 sm:gap-3">
          <span className="text-2xl xs:text-3xl sm:text-5xl">🃏</span>
          Old Heck
        </h1>
        {user && (
          <>
            {/* Desktop navigation - hidden on small screens */}
            <div className="hidden sm:flex gap-2">
              {onShareClick && (
                <button
                  onClick={onShareClick}
                  data-testid="header-share-button"
                  className="px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-400 text-white rounded-xl hover:from-purple-600 hover:to-purple-500 transition-all font-bold shadow-card hover:shadow-card-hover hover:scale-105 text-base whitespace-nowrap"
                >
                  🔗 Share
                </button>
              )}
              <Link
                to="/my-games"
                data-testid="header-mygames-link"
                className="px-4 py-3 bg-gradient-to-r from-felt-500 to-felt-400 text-white rounded-xl hover:from-felt-600 hover:to-felt-500 transition-all font-bold shadow-card hover:shadow-card-hover hover:scale-105 text-base whitespace-nowrap"
              >
                📋 My Games
              </Link>
              <Link
                to="/"
                data-testid="header-newgame-link"
                className="px-6 py-3 bg-gradient-to-r from-bid-600 to-bid-400 text-white rounded-xl hover:from-bid-700 hover:to-bid-500 transition-all font-bold shadow-card hover:shadow-card-hover hover:scale-105 text-lg whitespace-nowrap"
              >
                🎮 New Game
              </Link>
              <button
                onClick={handleSignOut}
                data-testid="header-signout-button"
                className="px-4 py-3 bg-gradient-to-r from-gray-500 to-gray-400 text-white rounded-xl hover:from-gray-600 hover:to-gray-500 transition-all font-bold shadow-card hover:shadow-card-hover hover:scale-105 text-base whitespace-nowrap"
              >
                🚪 Sign Out
              </button>
            </div>

            {/* Hamburger menu button - visible on small screens */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              data-testid="header-menu-toggle"
              className="sm:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Menu"
            >
              <svg
                className="w-6 h-6 text-felt-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {menuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Mobile menu dropdown */}
      {user && menuOpen && (
        <div className="sm:hidden mt-4 flex flex-col gap-2">
          {onShareClick && (
            <button
              onClick={() => {
                onShareClick();
                setMenuOpen(false);
              }}
              data-testid="header-share-button-mobile"
              className="px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-400 text-white rounded-xl hover:from-purple-600 hover:to-purple-500 transition-all font-bold shadow-card text-center"
            >
              🔗 Share
            </button>
          )}
          <Link
            to="/my-games"
            onClick={() => setMenuOpen(false)}
            data-testid="header-mygames-link-mobile"
            className="px-4 py-3 bg-gradient-to-r from-felt-500 to-felt-400 text-white rounded-xl hover:from-felt-600 hover:to-felt-500 transition-all font-bold shadow-card text-center"
          >
            📋 My Games
          </Link>
          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            data-testid="header-newgame-link-mobile"
            className="px-4 py-3 bg-gradient-to-r from-bid-600 to-bid-400 text-white rounded-xl hover:from-bid-700 hover:to-bid-500 transition-all font-bold shadow-card text-center"
          >
            🎮 New Game
          </Link>
          <button
            onClick={handleSignOut}
            data-testid="header-signout-button-mobile"
            className="px-4 py-3 bg-gradient-to-r from-gray-500 to-gray-400 text-white rounded-xl hover:from-gray-600 hover:to-gray-500 transition-all font-bold shadow-card text-center"
          >
            🚪 Sign Out
          </button>
        </div>
      )}
    </header>
  );
}
