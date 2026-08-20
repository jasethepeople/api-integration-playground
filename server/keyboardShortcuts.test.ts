import { describe, expect, it } from "vitest";
import { isEditableShortcutTarget, PLAYGROUND_SHORTCUT_LABELS, resolvePlaygroundShortcut } from "../client/src/lib/keyboardShortcuts";

const base = { ctrlKey: true, metaKey: false, shiftKey: false, target: null };

describe("playground keyboard shortcuts", () => {
  it("resolves the documented generation, restore, and trigger shortcuts", () => {
    expect(resolvePlaygroundShortcut({ ...base, key: "g", shiftKey: true })).toBe("generate");
    expect(resolvePlaygroundShortcut({ ...base, key: "R", shiftKey: true })).toBe("restore");
    expect(resolvePlaygroundShortcut({ ...base, key: "Enter" })).toBe("trigger");
    expect(PLAYGROUND_SHORTCUT_LABELS.trigger).toBe("CTRL/⌘ ↵");
  });

  it("ignores ordinary keys and any shortcut originating in editable controls", () => {
    expect(resolvePlaygroundShortcut({ ...base, key: "g" })).toBeNull();
    expect(resolvePlaygroundShortcut({ ...base, key: "g", shiftKey: true, target: { tagName: "INPUT" } as unknown as EventTarget })).toBeNull();
    expect(resolvePlaygroundShortcut({ ...base, key: "Enter", target: { tagName: "TEXTAREA" } as unknown as EventTarget })).toBeNull();
    expect(isEditableShortcutTarget({ tagName: "SELECT" } as unknown as EventTarget)).toBe(true);
  });
});
