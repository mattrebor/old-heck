import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import GameSetupPage from "./pages/GameSetupPage";
import GamePlayPage from "./pages/GamePlayPage";
import GameViewPage from "./pages/GameViewPage";
import "./index.css";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<GameSetupPage />} />
          <Route path="/game/:gameId" element={<GamePlayPage />} />
          <Route path="/game/:gameId/view" element={<GameViewPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
