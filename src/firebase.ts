import { initializeApp } from "firebase/app";
import {
  getFirestore,
  connectFirestoreEmulator,
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
  connectAuthEmulator,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import type { Game, GameSetup, Round, ShareToken } from "./types";
import { getAnalytics } from "firebase/analytics";
import { nanoid } from "nanoid";
import { getShareSession, createShareSession } from "./utils/shareAccess";

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

// Connect to Firebase Emulator if enabled
if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  const authEmulatorUrl = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL || 'http://127.0.0.1:9099';
  const firestoreHost = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST || '127.0.0.1';
  const firestorePort = parseInt(import.meta.env.VITE_FIRESTORE_EMULATOR_PORT || '8080', 10);

  console.log('🔧 Using Firebase Emulator');
  console.log(`   Auth: ${authEmulatorUrl}`);
  console.log(`   Firestore: ${firestoreHost}:${firestorePort}`);

  connectAuthEmulator(auth, authEmulatorUrl, { disableWarnings: true });
  connectFirestoreEmulator(db, firestoreHost, firestorePort);
}

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
 * Update the in-progress round (auto-save during bidding/results phase)
 */
export async function updateInProgressRound(
  gameId: string,
  round: Round,
  phase: "bidding" | "results"
): Promise<void> {
  await updateGameRound(gameId, {
    inProgressRound: round,
    currentPhase: phase,
  });
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

/**
 * Generate a one-time use share token for collaborative editing.
 * Creates a cryptographically random 32-character token and stores it in the game document.
 * Returns the token string for use in the share link.
 */
export async function generateShareToken(gameId: string): Promise<string> {
  const gameRef = doc(db, "games", gameId);

  // Generate cryptographically random 32-char token
  const token = nanoid(32);

  const shareToken: ShareToken = {
    token,
    createdAt: Date.now(),
    usedAt: null,
    usedBy: null,
  };

  await updateDoc(gameRef, {
    shareToken,
    updatedAt: Timestamp.now(),
  });

  return token;
}

/**
 * Claim a share token for the current browser session.
 * Validates the token and marks it as used by storing the session ID.
 * Returns success: true if the token is valid and claimed, or false with an error message.
 *
 * Token claim rules:
 * 1. If this browser already claimed it (session ID matches), allow access
 * 2. If token is unused, claim it for this browser
 * 3. If token was claimed by a different browser, deny access
 */
export async function claimShareToken(
  gameId: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  const gameRef = doc(db, "games", gameId);
  const gameSnap = await getDoc(gameRef);

  if (!gameSnap.exists()) {
    return { success: false, error: "Game not found" };
  }

  const game = gameSnap.data() as Game;

  // Validate token exists and matches
  if (!game.shareToken || game.shareToken.token !== token) {
    return { success: false, error: "Invalid token" };
  }

  // Check if this browser already claimed the token
  const existingSession = getShareSession(gameId);
  if (
    existingSession &&
    existingSession.sessionId === game.shareToken.usedBy
  ) {
    // This browser already claimed it - allow access
    return { success: true };
  }

  // Check if token already used by different session
  if (game.shareToken.usedAt !== null && game.shareToken.usedBy !== null) {
    return { success: false, error: "This link has already been used" };
  }

  // Claim the token for this browser
  const session = createShareSession(gameId, token);

  await updateDoc(gameRef, {
    "shareToken.usedAt": Date.now(),
    "shareToken.usedBy": session.sessionId,
    updatedAt: Timestamp.now(),
  });

  return { success: true };
}
