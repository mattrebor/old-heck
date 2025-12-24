import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">Old Heck</h1>
      <Link to="/" className="text-blue-600 hover:underline">
        New Game
      </Link>
    </header>
  );
}
