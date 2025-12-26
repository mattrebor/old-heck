import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import GameSetupPage from "./pages/GameSetupPage";
import GamePlayPage from "./pages/GamePlayPage";
import GameViewPage from "./pages/GameViewPage";
import MyGamesPage from "./pages/MyGamesPage";
import "./index.css";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<GameSetupPage />} />
          <Route path="/my-games" element={<MyGamesPage />} />
          <Route path="/game/:gameId" element={<GamePlayPage />} />
          <Route path="/game/:gameId/shared/:token" element={<GamePlayPage isSharedAccess={true} />} />
          <Route path="/game/:gameId/view" element={<GameViewPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
