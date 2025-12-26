import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getShareSession,
  createShareSession,
  hasShareAccess,
  type ShareSession,
} from "./shareAccess";
import type { Game } from "../types";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock crypto.randomUUID
const mockUUID = "test-uuid-1234";
Object.defineProperty(globalThis.crypto, "randomUUID", {
  value: () => mockUUID,
});

describe("shareAccess utilities", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe("getShareSession", () => {
    it("should return null when no session exists", () => {
      const result = getShareSession("game123");
      expect(result).toBeNull();
    });

    it("should return null when localStorage contains invalid JSON", () => {
      localStorage.setItem("share_session_game123", "invalid json");
      const result = getShareSession("game123");
      expect(result).toBeNull();

      // Should also clean up invalid data
      expect(localStorage.getItem("share_session_game123")).toBeNull();
    });

    it("should return session when valid data exists", () => {
      const session: ShareSession = {
        gameId: "game123",
        token: "token123",
        claimedAt: Date.now(),
        sessionId: "session123",
      };

      localStorage.setItem("share_session_game123", JSON.stringify(session));

      const result = getShareSession("game123");
      expect(result).toEqual(session);
    });

    it("should handle different game IDs independently", () => {
      const session1: ShareSession = {
        gameId: "game1",
        token: "token1",
        claimedAt: Date.now(),
        sessionId: "session1",
      };

      const session2: ShareSession = {
        gameId: "game2",
        token: "token2",
        claimedAt: Date.now(),
        sessionId: "session2",
      };

      localStorage.setItem("share_session_game1", JSON.stringify(session1));
      localStorage.setItem("share_session_game2", JSON.stringify(session2));

      expect(getShareSession("game1")).toEqual(session1);
      expect(getShareSession("game2")).toEqual(session2);
    });
  });

  describe("createShareSession", () => {
    it("should create and store a new session", () => {
      const gameId = "game123";
      const token = "token123";

      const result = createShareSession(gameId, token);

      expect(result).toEqual({
        gameId,
        token,
        claimedAt: expect.any(Number),
        sessionId: mockUUID,
      });

      // Verify it's stored in localStorage
      const stored = localStorage.getItem("share_session_game123");
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!)).toEqual(result);
    });

    it("should generate different timestamps for different calls", () => {
      vi.useFakeTimers();
      const now = Date.now();
      vi.setSystemTime(now);

      const firstSession = createShareSession("game1", "token1");
      expect(firstSession.claimedAt).toBe(now);

      vi.setSystemTime(now + 1000);
      const secondSession = createShareSession("game2", "token2");
      expect(secondSession.claimedAt).toBe(now + 1000);

      vi.useRealTimers();
    });

    it("should overwrite existing session for same game", () => {
      const gameId = "game123";

      createShareSession(gameId, "token1");
      const session2 = createShareSession(gameId, "token2");

      expect(session2.token).toBe("token2");
      expect(getShareSession(gameId)).toEqual(session2);
    });
  });

  describe("hasShareAccess", () => {
    const createMockGame = (shareToken?: {
      token: string;
      createdAt: number;
      usedAt: number | null;
      usedBy: string | null;
    }): Game => ({
      id: "game123",
      createdAt: {} as any,
      status: "in_progress",
      setup: {
        players: ["Alice", "Bob"],
        decks: 1,
        maxRounds: 10,
        firstPlayerIndex: 0,
      },
      rounds: [],
      shareToken,
    });

    it("should return false when no session exists", () => {
      const game = createMockGame({
        token: "token123",
        createdAt: Date.now(),
        usedAt: Date.now(),
        usedBy: "session123",
      });

      const result = hasShareAccess("game123", game);
      expect(result).toBe(false);
    });

    it("should return false when game has no share token", () => {
      createShareSession("game123", "token123");
      const game = createMockGame();

      const result = hasShareAccess("game123", game);
      expect(result).toBe(false);
    });

    it("should return false when tokens don't match", () => {
      createShareSession("game123", "token123");
      const game = createMockGame({
        token: "different-token",
        createdAt: Date.now(),
        usedAt: Date.now(),
        usedBy: mockUUID,
      });

      const result = hasShareAccess("game123", game);
      expect(result).toBe(false);
    });

    it("should return false when session IDs don't match", () => {
      createShareSession("game123", "token123");
      const game = createMockGame({
        token: "token123",
        createdAt: Date.now(),
        usedAt: Date.now(),
        usedBy: "different-session-id",
      });

      const result = hasShareAccess("game123", game);
      expect(result).toBe(false);
    });

    it("should return true when token and session ID match", () => {
      createShareSession("game123", "token123");
      const game = createMockGame({
        token: "token123",
        createdAt: Date.now(),
        usedAt: Date.now(),
        usedBy: mockUUID,
      });

      const result = hasShareAccess("game123", game);
      expect(result).toBe(true);
    });

    it("should return true when token matches and usedBy is null (not yet claimed)", () => {
      // Edge case: session exists locally but game document not updated yet
      createShareSession("game123", "token123");
      const game = createMockGame({
        token: "token123",
        createdAt: Date.now(),
        usedAt: null,
        usedBy: null,
      });

      // This should return false since usedBy doesn't match
      const result = hasShareAccess("game123", game);
      expect(result).toBe(false);
    });
  });

  describe("integration scenarios", () => {
    it("should handle complete share flow", () => {
      const gameId = "game123";
      const token = "share-token-abc";

      // Step 1: User claims token
      const session = createShareSession(gameId, token);

      // Step 2: Verify session is stored
      const retrievedSession = getShareSession(gameId);
      expect(retrievedSession).toEqual(session);

      // Step 3: Check access with matching game
      const game: Game = {
        id: gameId,
        createdAt: {} as any,
        status: "in_progress",
        setup: {
          players: ["Alice"],
          decks: 1,
          maxRounds: 10,
          firstPlayerIndex: 0,
        },
        rounds: [],
        shareToken: {
          token,
          createdAt: Date.now(),
          usedAt: Date.now(),
          usedBy: session.sessionId,
        },
      };

      expect(hasShareAccess(gameId, game)).toBe(true);
    });

    it("should deny access after localStorage is cleared", () => {
      const gameId = "game123";
      const token = "share-token-abc";

      // Create session
      const session = createShareSession(gameId, token);

      // Clear localStorage (simulates user clearing browser data)
      localStorageMock.clear();

      // Try to check access
      const game: Game = {
        id: gameId,
        createdAt: {} as any,
        status: "in_progress",
        setup: {
          players: ["Alice"],
          decks: 1,
          maxRounds: 10,
          firstPlayerIndex: 0,
        },
        rounds: [],
        shareToken: {
          token,
          createdAt: Date.now(),
          usedAt: Date.now(),
          usedBy: session.sessionId,
        },
      };

      expect(hasShareAccess(gameId, game)).toBe(false);
    });
  });
});
