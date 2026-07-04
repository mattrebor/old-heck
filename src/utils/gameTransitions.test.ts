import { describe, it, expect, vi } from "vitest";
import { commitPhaseTransition } from "./gameTransitions";

describe("commitPhaseTransition", () => {
  it("cancels the pending debounced save BEFORE running the write", async () => {
    // This ordering is the whole point: a stale debounced save left scheduled
    // past a transition write can commit out of order and revert the phase.
    const order: string[] = [];
    const cancelPendingSave = vi.fn(() => order.push("cancel"));
    const write = vi.fn(async () => {
      order.push("write");
    });

    await commitPhaseTransition(cancelPendingSave, write);

    expect(order).toEqual(["cancel", "write"]);
  });

  it("cancels exactly once and runs the write exactly once", async () => {
    const cancelPendingSave = vi.fn();
    const write = vi.fn(async () => {});

    await commitPhaseTransition(cancelPendingSave, write);

    expect(cancelPendingSave).toHaveBeenCalledOnce();
    expect(write).toHaveBeenCalledOnce();
  });

  it("still cancels before the write even when the write rejects", async () => {
    const order: string[] = [];
    const cancelPendingSave = vi.fn(() => order.push("cancel"));
    const write = vi.fn(async () => {
      order.push("write");
      throw new Error("firestore write failed");
    });

    await expect(
      commitPhaseTransition(cancelPendingSave, write)
    ).rejects.toThrow("firestore write failed");
    expect(order).toEqual(["cancel", "write"]);
  });

  it("propagates the write rejection to the caller", async () => {
    const cancelPendingSave = vi.fn();
    const write = vi.fn().mockRejectedValue(new Error("network down"));

    await expect(
      commitPhaseTransition(cancelPendingSave, write)
    ).rejects.toThrow("network down");
  });

  it("awaits the write before resolving", async () => {
    let writeSettled = false;
    const cancelPendingSave = vi.fn();
    const write = vi.fn(
      () =>
        new Promise<void>((resolve) =>
          setTimeout(() => {
            writeSettled = true;
            resolve();
          }, 10)
        )
    );

    await commitPhaseTransition(cancelPendingSave, write);

    expect(writeSettled).toBe(true);
  });
});
