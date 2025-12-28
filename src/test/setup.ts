import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Mock Firebase to prevent network calls during tests
vi.mock('../firebase', () => ({
  app: {},
  db: {},
  auth: {},
  googleProvider: {},
  analytics: {},
  createGame: vi.fn(),
  updateGameRound: vi.fn(),
  loadGame: vi.fn(),
  updateInProgressRound: vi.fn(),
  markGameComplete: vi.fn(),
  deleteGame: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  signUpWithEmailAndPassword: vi.fn(),
  signInWithEmailPassword: vi.fn(),
  generateShareToken: vi.fn(),
  claimShareToken: vi.fn(),
}));

// Cleanup after each test
afterEach(() => {
  cleanup();
});
