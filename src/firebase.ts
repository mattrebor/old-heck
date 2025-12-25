import { initializeApp } from "firebase/app";
import {
  getFirestore,
  updateDoc,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  deleteField,
  Timestamp,
} from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import type { Game, GameSetup } from "./types";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const analytics = getAnalytics(app);

/**
 * Generate a short 8-character alphanumeric game ID
 */
function generateGameId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Create a new game in Firestore and return its ID
 */
export async function createGame(
  setup: GameSetup,
  createdBy?: {
    uid: string;
    displayName: string | null;
    email: string | null;
  }
): Promise<string> {
  const gameId = generateGameId();

  const game: Partial<Game> = {
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    status: "in_progress",
    setup,
    rounds: [],
    ...(createdBy && { createdBy }),
  };

  const gameRef = doc(db, "games", gameId);
  await setDoc(gameRef, game);
  return gameId;
}

/**
 * Update game state in Firestore
 * Converts undefined values to deleteField() to remove them from the document
 */
export async function updateGameRound(
  gameId: string,
  updates: Partial<Game>
): Promise<void> {
  const gameRef = doc(db, "games", gameId);

  // Convert undefined values to deleteField()
  const processedUpdates: Record<string, unknown> = {
    updatedAt: Timestamp.now(),
  };

  for (const [key, value] of Object.entries(updates)) {
    processedUpdates[key] = value === undefined ? deleteField() : value;
  }

  await updateDoc(gameRef, processedUpdates);
}

/**
 * Load a game from Firestore by ID
 */
export async function loadGame(gameId: string): Promise<Game | null> {
  const gameRef = doc(db, "games", gameId);
  const snap = await getDoc(gameRef);

  if (!snap.exists()) {
    return null;
  }

  return { id: snap.id, ...snap.data() } as Game;
}

/**
 * Mark a game as completed
 */
export async function markGameComplete(gameId: string): Promise<void> {
  const gameRef = doc(db, "games", gameId);
  await updateDoc(gameRef, {
    status: "completed",
    updatedAt: Timestamp.now(),
  });
}

/**
 * Delete a game from Firestore
 */
export async function deleteGame(gameId: string): Promise<void> {
  const gameRef = doc(db, "games", gameId);
  await deleteDoc(gameRef);
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
}

/**
 * Sign out
 */
export async function signOut() {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
}
