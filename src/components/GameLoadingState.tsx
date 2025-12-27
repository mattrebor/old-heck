import Header from "./Header";

export default function GameLoadingState() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Header />
      <div className="text-center py-12">
        <div className="text-xl font-semibold">Loading game...</div>
      </div>
    </div>
  );
}
