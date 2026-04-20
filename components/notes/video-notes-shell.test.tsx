import { describe, expect, it, vi } from "vitest";

/**
 * Smoke test for the click-to-seek contract: clicking any element
 * with `data-mention-type="timestamp"` inside the page should drive
 * the player's `seekTo`. The shell wires this via a delegated
 * document-level click handler so it works across editor remounts.
 *
 * We don't render the full shell here (it pulls in the YouTube IFrame
 * API + Tiptap which need a real browser). Instead we re-implement
 * the same delegated handler in isolation and verify the contract.
 */

function attach(handler: (sec: number) => void) {
  const onClick = (e: MouseEvent) => {
    const el = (e.target as HTMLElement | null)?.closest(
      '[data-mention-type="timestamp"]',
    ) as HTMLElement | null;
    if (!el) return;
    const sec = Number(el.getAttribute("data-seconds") ?? "0");
    if (Number.isFinite(sec) && sec >= 0) {
      e.preventDefault();
      handler(sec);
    }
  };
  document.addEventListener("click", onClick);
  return () => document.removeEventListener("click", onClick);
}

describe("video-notes-shell click-to-seek contract", () => {
  it("clicking a timestamp chip calls seekTo with the data-seconds value", () => {
    const seek = vi.fn();
    const detach = attach(seek);

    const root = document.createElement("div");
    root.innerHTML = `
      <p>Re-watch
        <span data-mention-type="timestamp" data-video-id="abc"
              data-seconds="842" class="timestamp-mention">⏱ 14:02</span>
        for calibration.
      </p>
    `;
    document.body.appendChild(root);

    const chip = root.querySelector(
      '[data-mention-type="timestamp"]',
    ) as HTMLElement;
    chip.click();

    expect(seek).toHaveBeenCalledTimes(1);
    expect(seek).toHaveBeenCalledWith(842);

    document.body.removeChild(root);
    detach();
  });

  it("clicking a non-timestamp element doesn't fire", () => {
    const seek = vi.fn();
    const detach = attach(seek);

    const root = document.createElement("div");
    root.innerHTML = `<button>Open</button>`;
    document.body.appendChild(root);

    (root.querySelector("button") as HTMLButtonElement).click();
    expect(seek).not.toHaveBeenCalled();

    document.body.removeChild(root);
    detach();
  });
});
