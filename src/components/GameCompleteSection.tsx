interface GameCompleteSectionProps {
  onStartNewGame: () => void;
  showButton: boolean;
}

export default function GameCompleteSection({
  onStartNewGame,
  showButton,
}: GameCompleteSectionProps) {
  return (
    <div className="mt-6 space-y-4">
      <div className="bg-gradient-to-r from-green-100 to-green-200 border-3 border-green-500 rounded-xl p-5 text-base text-green-900 font-semibold">
        🎉 Game complete! All rounds finished.
      </div>
      {showButton && (
        <button
          onClick={onStartNewGame}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-xl text-xl font-bold hover:shadow-card-hover hover:scale-105 transition-all"
        >
          🎮 New Game with Same Settings
        </button>
      )}
    </div>
  );
}
