import { Page } from '@playwright/test';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../src/firebase';

const USE_EMULATOR = process.env.VITE_USE_FIREBASE_EMULATOR === 'true';

export interface TestUser {
  email: string;
  password: string;
  displayName: string;
  uid?: string;
}

// Test users for emulator (created on-demand)
export const EMULATOR_TEST_USERS: TestUser[] = [
  { email: 'alice@test.com', password: 'password123', displayName: 'Alice' },
  { email: 'bob@test.com', password: 'password123', displayName: 'Bob' },
  { email: 'charlie@test.com', password: 'password123', displayName: 'Charlie' },
];

// Test user for real Firebase (must exist in your Firebase project)
export const REAL_FIREBASE_TEST_USER: TestUser = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'test-password',
  displayName: 'Test User',
};

/**
 * Sign in to Firebase Auth (works with both emulator and real Firebase)
 *
 * NOTE: Currently uses Firebase SDK directly. For production, you may need to:
 * 1. Mock the Google sign-in popup in Playwright
 * 2. Use email/password auth for testing
 * 3. Use test accounts in your Firebase project
 */
export async function signInWithTestUser(page: Page, userIndex = 0): Promise<TestUser> {
  const user = USE_EMULATOR ? EMULATOR_TEST_USERS[userIndex] : REAL_FIREBASE_TEST_USER;

  console.log(`🔐 Signing in as ${user.email} (${USE_EMULATOR ? 'emulator' : 'real Firebase'})`);

  // For emulator: Create user if it doesn't exist
  if (USE_EMULATOR) {
    try {
      await createUserWithEmailAndPassword(auth, user.email, user.password);
      console.log(`✅ Created emulator user: ${user.email}`);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`ℹ️  Emulator user already exists: ${user.email}`);
      } else {
        throw error;
      }
    }
  }

  // Sign in via Firebase SDK (sets auth cookie)
  const userCredential = await signInWithEmailAndPassword(auth, user.email, user.password);
  user.uid = userCredential.user.uid;

  console.log(`✅ Signed in as ${user.email} (uid: ${user.uid})`);
  return user;
}

/**
 * Sign out from Firebase Auth
 */
export async function signOut(page: Page) {
  await page.getByTestId('header-signout-button').click();
  await page.waitForTimeout(1000);
}

/**
 * Create multiple authenticated users (for multi-user tests)
 */
export async function createMultipleTestUsers(count: number): Promise<TestUser[]> {
  if (!USE_EMULATOR) {
    console.warn('⚠️  Multi-user tests require emulator. Using single test user for real Firebase.');
    return [REAL_FIREBASE_TEST_USER];
  }

  const users = EMULATOR_TEST_USERS.slice(0, count);

  for (const user of users) {
    try {
      await createUserWithEmailAndPassword(auth, user.email, user.password);
      console.log(`✅ Created emulator user: ${user.email}`);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`ℹ️  Emulator user already exists: ${user.email}`);
      } else {
        throw error;
      }
    }
  }

  return users;
}
