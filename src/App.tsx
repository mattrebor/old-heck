import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import GameSetupPage from "./pages/GameSetupPage";
import GamePlayPage from "./pages/GamePlayPage";
import GameHistoryPage from "./pages/GameHistoryPage";
import "./index.css";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<GameSetupPage />} />
        <Route path="/game/new" element={<GamePlayPage />} />
        <Route path="/game/:gameId" element={<GameHistoryPage />} />
      </Routes>
    </Router>
  );
}
