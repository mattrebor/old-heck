import type { Game } from "../types";

/**
 * Session information stored in localStorage when a user claims a share token.
 * This allows the same browser to access the game repeatedly after claiming once.
 */
export interface ShareSession {
  gameId: string;
  token: string;
  claimedAt: number;
  sessionId: string; // Random ID generated when token first used
}

/**
 * Retrieve the share session for a game from localStorage.
 * Returns null if no session exists for this game.
 */
export function getShareSession(gameId: string): ShareSession | null {
  const key = `share_session_${gameId}`;
  const stored = localStorage.getItem(key);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as ShareSession;
  } catch {
    // Invalid JSON in localStorage, clean it up
    localStorage.removeItem(key);
    return null;
  }
}

/**
 * Create a new share session and store it in localStorage.
 * This is called after successfully claiming a share token.
 */
export function createShareSession(gameId: string, token: string): ShareSession {
  const session: ShareSession = {
    gameId,
    token,
    claimedAt: Date.now(),
    sessionId: generateSessionId(),
  };

  const key = `share_session_${gameId}`;
  localStorage.setItem(key, JSON.stringify(session));

  return session;
}

/**
 * Check if the current browser has share access to the game.
 * Validates that:
 * 1. A session exists in localStorage for this game
 * 2. The token in the session matches the game's share token
 * 3. The session ID matches the usedBy field (this browser claimed it)
 */
export function hasShareAccess(gameId: string, game: Game): boolean {
  const session = getShareSession(gameId);
  if (!session) return false;

  // Verify token matches and was used by this session
  return (
    game.shareToken?.token === session.token &&
    game.shareToken?.usedBy === session.sessionId
  );
}

/**
 * Generate a unique session ID using crypto.randomUUID().
 * This ID is stored both in localStorage and in the Game document
 * to verify that the same browser claimed the token.
 */
function generateSessionId(): string {
  return crypto.randomUUID();
}
