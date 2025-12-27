import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');

    // Should show the Old Heck title in header
    await expect(page.getByText('Old Heck')).toBeVisible();

    // Should show sign-in button when not authenticated
    await expect(page.getByTestId('setup-signin-button')).toBeVisible();
  });

  test('should have correct page title', async ({ page }) => {
    await page.goto('/');

    // Check page title (matches index.html)
    await expect(page).toHaveTitle('old-heck');
  });

  test('should show sign-in prompt when not authenticated', async ({ page }) => {
    await page.goto('/');

    // Should show the setup header
    await expect(page.getByText('Set Up Your Game')).toBeVisible();

    // Should show sign-in instruction
    await expect(page.getByText('Sign in to create a new game')).toBeVisible();

    // Should have sign-in button
    await expect(page.getByTestId('setup-signin-button')).toBeVisible();

    // Form elements should NOT be visible when not signed in
    await expect(page.getByTestId('setup-decks-input')).not.toBeVisible();
    await expect(page.getByTestId('setup-start-button')).not.toBeVisible();
  });
});
