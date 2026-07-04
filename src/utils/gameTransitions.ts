/**
 * Commit an immediate game-state write that transitions the game to a new phase.
 *
 * Phase-transition writes MUST go through here. Bid and result edits are saved
 * with a debounced auto-save; if that pending save is left scheduled when a
 * transition write fires, it can commit out of order (after the transition) on
 * high-latency Firebase. Because Firestore is last-write-wins, the stale save
 * then reverts the game document to the earlier phase — and every subscribed
 * client (editor and view-only spectators) snaps back via onSnapshot.
 *
 * Cancelling the pending save *before* running the write closes that race. This
 * is deterministic locally/on the emulator (writes commit in ~1-2ms) but only
 * surfaces against real Firebase, where commit latency is variable.
 *
 * @param cancelPendingSave - Cancels the pending debounced auto-save (idempotent)
 * @param write - Performs the immediate transition write(s)
 */
export async function commitPhaseTransition(
  cancelPendingSave: () => void,
  write: () => Promise<void>
): Promise<void> {
  cancelPendingSave();
  await write();
}
