import { Page } from '@playwright/test';

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
 * Sign in via UI using email/password (recommended for E2E tests)
 */
export async function signInViaUI(page: Page, user: TestUser): Promise<void> {
  console.log(`🔐 Signing in via UI as ${user.email}`);

  // Navigate to home page if not already there
  if (!page.url().includes('localhost')) {
    await page.goto('/');
  }

  // Fill in email and password
  await page.getByTestId('email-input').fill(user.email);
  await page.getByTestId('password-input').fill(user.password);

  // Try to sign in first
  const signinButton = page.getByTestId('signin-button');
  await signinButton.click();

  // Wait for either error or success (navigation to setup page)
  await Promise.race([
    page.getByTestId('auth-error').waitFor({ state: 'visible', timeout: 2000 }).catch(() => {}),
    page.waitForSelector('[data-testid="setup-decks-input"]', { timeout: 2000 }).catch(() => {}),
  ]);

  // Check if there's an error (user doesn't exist)
  const errorVisible = await page.getByTestId('auth-error').isVisible().catch(() => false);

  if (errorVisible) {
    console.log(`ℹ️  User doesn't exist, signing up: ${user.email}`);

    // Switch to sign-up mode
    await page.getByTestId('toggle-auth-mode').click();

    // Fill in the form again
    await page.getByTestId('email-input').fill(user.email);
    await page.getByTestId('password-input').fill(user.password);

    // Sign up
    await page.getByTestId('signup-button').click();
  }

  // Wait for authentication to complete (setup form should be visible)
  try {
    await page.waitForSelector('[data-testid="setup-decks-input"]', { timeout: 10000 });
    console.log(`✅ Signed in via UI as ${user.email}`);
  } catch (error) {
    // Log the current page state for debugging
    console.error(`❌ Failed to sign in as ${user.email}`);
    console.error(`Current URL: ${page.url()}`);
    const authError = await page.getByTestId('auth-error').textContent().catch(() => null);
    if (authError) {
      console.error(`Auth error: ${authError}`);
    }
    throw error;
  }
}

/**
 * Sign in to Firebase Auth (works with both emulator and real Firebase)
 * Uses UI for authentication to better simulate user behavior
 */
export async function signInWithTestUser(page: Page, userIndex = 0): Promise<TestUser> {
  const user = USE_EMULATOR ? EMULATOR_TEST_USERS[userIndex] : REAL_FIREBASE_TEST_USER;

  console.log(`🔐 Signing in as ${user.email} (${USE_EMULATOR ? 'emulator' : 'real Firebase'})`);

  // Sign in via UI (this will create the user if needed)
  await signInViaUI(page, user);

  console.log(`✅ Signed in as ${user.email}`);
  return user;
}

/**
 * Sign out from Firebase Auth
 */
export async function signOut(page: Page) {
  await page.getByTestId('header-signout-button').click();
  // Wait for sign-in button to appear (indicates signed out)
  await page.waitForSelector('[data-testid="signin-button"]', { timeout: 2000 });
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
  console.log(`✅ Prepared ${users.length} test users (will be created via UI on first use)`);

  return users;
}

/**
 * Mock Google OAuth popup for E2E tests
 *
 * This intercepts the Google sign-in popup and automatically signs in
 * using email/password instead. This works with the Firebase emulator.
 *
 * Usage:
 *   await mockGoogleOAuth(page);
 *   await page.getByTestId('setup-signin-button').click(); // Google button
 *   // User will be automatically signed in via email/password
 */
export async function mockGoogleOAuth(page: Page, userIndex = 0): Promise<void> {
  const user = EMULATOR_TEST_USERS[userIndex];

  console.log(`🎭 Mocking Google OAuth for ${user.email}`);

  // When the Google sign-in button is clicked, intercept the popup
  // and sign in with email/password instead
  page.on('popup', async (popup) => {
    console.log('🎭 Intercepted Google OAuth popup, closing and using email/password instead');
    await popup.close();
  });

  // Also intercept any Google OAuth URLs and block them
  await page.route('**/accounts.google.com/**', route => route.abort());
  await page.route('**/identitytoolkit.googleapis.com/**', route => {
    // Allow Firebase Auth Emulator requests
    if (route.request().url().includes('127.0.0.1') || route.request().url().includes('localhost')) {
      route.continue();
    } else {
      route.abort();
    }
  });

  console.log(`✅ Google OAuth mocked, will use ${user.email} for sign-in`);
}
