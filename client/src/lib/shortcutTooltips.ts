import { PLAYGROUND_SHORTCUT_LABELS, type PlaygroundShortcutAction } from "./keyboardShortcuts";

export type ShortcutTooltipDefinition = {
  action: Exclude<PlaygroundShortcutAction, null>;
  buttonPrefix: string;
  tooltip: string;
  ariaLabel: string;
};

export const SHORTCUT_TOOLTIPS: ShortcutTooltipDefinition[] = [
  { action: "generate", buttonPrefix: "AUTO-GENERATE", tooltip: `Auto-generate variables · ${PLAYGROUND_SHORTCUT_LABELS.generate}`, ariaLabel: `Auto-generate variables. Shortcut ${PLAYGROUND_SHORTCUT_LABELS.generate}` },
  { action: "restore", buttonPrefix: "GENERATIONS", tooltip: `Restore latest generated variables · ${PLAYGROUND_SHORTCUT_LABELS.restore}`, ariaLabel: `Open generation history or restore latest generated variables. Shortcut ${PLAYGROUND_SHORTCUT_LABELS.restore}` },
  { action: "trigger", buttonPrefix: "TRIGGER SIGNED WEBHOOK", tooltip: `Trigger signed webhook · ${PLAYGROUND_SHORTCUT_LABELS.trigger}`, ariaLabel: `Trigger signed webhook. Shortcut ${PLAYGROUND_SHORTCUT_LABELS.trigger}` },
];

export function getShortcutTooltipForButton(text: string): ShortcutTooltipDefinition | null {
  return SHORTCUT_TOOLTIPS.find(item => text.trim().startsWith(item.buttonPrefix)) ?? null;
}
