import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import GameSetupPage from "./pages/GameSetupPage";
import GamePlayPage from "./pages/GamePlayPage";
import "./index.css";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<GameSetupPage />} />
        <Route path="/game/:gameId" element={<GamePlayPage />} />
      </Routes>
    </Router>
  );
}
