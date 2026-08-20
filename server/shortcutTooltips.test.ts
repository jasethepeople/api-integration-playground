import { describe, expect, it } from "vitest";
import { getShortcutTooltipForButton, SHORTCUT_TOOLTIPS } from "../client/src/lib/shortcutTooltips";

describe("shortcut tooltip metadata", () => {
  it("maps each shortcut-enabled control to contextual visual and accessible text", () => {
    expect(getShortcutTooltipForButton("AUTO-GENERATE")).toMatchObject({ action: "generate", tooltip: "Auto-generate variables · CTRL/⌘ ⇧ G" });
    expect(getShortcutTooltipForButton("GENERATIONS 2")).toMatchObject({ action: "restore", tooltip: "Restore latest generated variables · CTRL/⌘ ⇧ R" });
    expect(getShortcutTooltipForButton("TRIGGER SIGNED WEBHOOK ↗")).toMatchObject({ action: "trigger", tooltip: "Trigger signed webhook · CTRL/⌘ ↵" });
    expect(getShortcutTooltipForButton("SAVE PRESET")).toBeNull();
    expect(SHORTCUT_TOOLTIPS.every(item => item.ariaLabel.includes("Shortcut"))).toBe(true);
  });
});
