import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import type { Game, GameSetup, Round } from "../types";

export interface GameSubscriptionState {
  setup: GameSetup | null;
  completedRounds: Round[];
  currentRound: Round | null;
  currentPhase: string | null;
  biddingPhase: "blind-declaration-and-entry" | "regular-bid-entry" | null;
  gameStatus: string | null;
  loading: boolean;
  error: string | null;
}

export function useGameSubscription(gameId: string | undefined): GameSubscriptionState {
  const [setup, setSetup] = useState<GameSetup | null>(null);
  const [completedRounds, setCompletedRounds] = useState<Round[]>([]);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [currentPhase, setCurrentPhase] = useState<string | null>(null);
  const [biddingPhase, setBiddingPhase] = useState<"blind-declaration-and-entry" | "regular-bid-entry" | null>(null);
  const [gameStatus, setGameStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) {
      setError("No game ID provided");
      setLoading(false);
      return;
    }

    const gameRef = doc(db, "games", gameId);

    const unsubscribe = onSnapshot(
      gameRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setError("Game not found");
          setLoading(false);
          return;
        }

        const game = { id: snapshot.id, ...snapshot.data() } as Game;

        setSetup(game.setup);
        setCompletedRounds(game.rounds || []);
        setCurrentRound(game.inProgressRound || null);
        setCurrentPhase(game.currentPhase || null);
        setBiddingPhase(game.biddingPhase || null);
        setGameStatus(game.status);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading game:", err);
        setError("Failed to load game");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [gameId]);

  return {
    setup,
    completedRounds,
    currentRound,
    currentPhase,
    biddingPhase,
    gameStatus,
    loading,
    error,
  };
}
