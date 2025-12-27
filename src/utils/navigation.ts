import type { GameSetup } from "../types";

export function navigateToNewGameWithSetup(
  navigate: (path: string, options?: { state?: any }) => void,
  setup: GameSetup
) {
  navigate("/", { state: { setup } });
}
