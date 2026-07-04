import { defineConfig } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Run serially on CI and whenever using the Firebase emulator: the E2E
   * suite shares a small set of emulator auth users (alice/bob/charlie), so
   * parallel workers race to create the same accounts. Serial keeps both the
   * local `test:e2e:local` run and CI deterministic. */
  workers: process.env.CI || process.env.VITE_USE_FIREBASE_EMULATOR === 'true' ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:5173',

    /* Bound every action (click/fill/etc.) so a missing/non-actionable element
     * fails fast with a clear "waiting for locator" error instead of inheriting
     * the whole-test timeout and hanging. Without this, Playwright's default of
     * 0 (no limit) lets an un-timed action consume the entire test budget. */
    actionTimeout: 15000,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure - helps debug CI issues */
    video: 'retain-on-failure',

    /* Mobile-first: Use iPhone 12 viewport (most users play on mobile) */
    viewport: { width: 390, height: 844 },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        // Use Chromium browser with custom mobile viewport from global config
        // Don't spread devices['Desktop Chrome'] as it overrides viewport
      },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    // In emulator mode, start Vite with `--mode emulator` so it loads the
    // committed demo config from `.env.emulator` and points the app at the
    // local Auth/Firestore emulators (no real credentials, no real data).
    command: process.env.VITE_USE_FIREBASE_EMULATOR === 'true'
      ? 'cross-env VITE_USE_FIREBASE_EMULATOR=true npm run dev -- --mode emulator'
      : 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
