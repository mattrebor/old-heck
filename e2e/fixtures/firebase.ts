import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../src/firebase';
import type { GameSetup } from '../../src/types';

const USE_EMULATOR = process.env.VITE_USE_FIREBASE_EMULATOR === 'true';

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
 */
export async function deleteTestGame(gameId: string) {
  // Only allow deletion in emulator mode
  if (!USE_EMULATOR) {
    console.warn('⚠️  Skipping game deletion in real Firebase mode');
    return;
  }

  const gameRef = doc(db, 'games', gameId);
  await deleteDoc(gameRef);
  console.log(`🗑️  Deleted test game: ${gameId}`);
}

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
