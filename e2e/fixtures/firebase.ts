import { doc, setDoc, deleteDoc, getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import type { GameSetup } from '../../src/types';

const USE_EMULATOR = process.env.VITE_USE_FIREBASE_EMULATOR === 'true';

// Initialize Firebase for E2E tests
const testApp = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo-auth-domain',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-bucket',
});

const db = getFirestore(testApp);

// Connect to emulator if enabled
if (USE_EMULATOR) {
  const firestoreHost = process.env.VITE_FIRESTORE_EMULATOR_HOST || '127.0.0.1';
  const firestorePort = parseInt(process.env.VITE_FIRESTORE_EMULATOR_PORT || '8080', 10);
  connectFirestoreEmulator(db, firestoreHost, firestorePort);
}

/**
 * Create a test game in Firestore (emulator or real)
 */
export async function createTestGame(setup: GameSetup, userId: string): Promise<string> {
  const gameId = `test-game-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const gameRef = doc(db, 'games', gameId);

  const gameData = {
    setup,
    rounds: [],
    inProgressRound: null,
    currentPhase: null,
    biddingPhase: null,
    status: 'in_progress',
    createdBy: {
      uid: userId,
      displayName: 'Test User',
      email: 'test@example.com',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await setDoc(gameRef, gameData);

  console.log(`✅ Created test game: ${gameRef.id} (${USE_EMULATOR ? 'emulator' : 'real Firebase'})`);
  return gameId;
}

/**
 * Delete a test game (cleanup)
 * Note: This may fail due to Firestore security rules requiring ownership.
 * Failures are logged but don't throw to avoid breaking tests.
 */
export async function deleteTestGame(gameId: string) {
  // Only allow deletion in emulator mode
  if (!USE_EMULATOR) {
    console.warn('⚠️  Skipping game deletion in real Firebase mode');
    return;
  }

  try {
    const gameRef = doc(db, 'games', gameId);
    await deleteDoc(gameRef);
    console.log(`🗑️  Deleted test game: ${gameId}`);
  } catch {
    // Deletion may fail due to security rules - games created by different users
    // This is expected behavior, games will be cleaned up when emulator restarts
    console.log(`ℹ️  Could not delete game ${gameId} (will be cleaned up with emulator)`);
  }
}

// Alias for convenience
export { deleteTestGame as deleteGame };

/**
 * Clear all test data (emulator only)
 */
export async function clearAllTestData() {
  if (!USE_EMULATOR) {
    console.warn('⚠️  Cannot clear data in real Firebase mode');
    return;
  }

  try {
    // Clear Firestore data
    const firestoreResponse = await fetch(
      'http://localhost:8080/emulator/v1/projects/demo-project/databases/(default)/documents',
      { method: 'DELETE' }
    );

    if (firestoreResponse.ok) {
      console.log('🧹 Cleared Firestore emulator data');
    }

    // Clear Auth data
    const authResponse = await fetch(
      'http://localhost:9099/emulator/v1/projects/demo-project/accounts',
      { method: 'DELETE' }
    );

    if (authResponse.ok) {
      console.log('🧹 Cleared Auth emulator data');
    }
  } catch (error) {
    console.error('❌ Failed to clear emulator data:', error);
  }
}
