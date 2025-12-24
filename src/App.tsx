import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import GameSetupPage from "./pages/GameSetupPage";
import GameHistoryPage from "./pages/GameHistoryPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<GameSetupPage />} />
        <Route path="/game/new" element={<GameSetupPage />} />
        <Route path="/game/:gameId" element={<GameHistoryPage />} />
      </Routes>
    </Router>
  );
}
