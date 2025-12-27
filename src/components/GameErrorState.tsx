import Header from "./Header";

interface GameErrorStateProps {
  error: string;
}

export default function GameErrorState({ error }: GameErrorStateProps) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Header />
      <div className="text-center py-12">
        <div className="text-xl font-semibold text-red-600 mb-4">
          {error}
        </div>
      </div>
    </div>
  );
}
