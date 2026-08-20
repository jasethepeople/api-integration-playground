export type PlaygroundShortcutAction = "generate" | "restore" | "trigger" | null;

export type ShortcutEventLike = {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  target?: EventTarget | null;
};

export function isEditableShortcutTarget(target: EventTarget | null | undefined): boolean {
  const element = target as { tagName?: unknown; isContentEditable?: unknown } | null | undefined;
  if (!element || typeof element.tagName !== "string") return false;
  const tag = element.tagName.toLowerCase();
  return Boolean(element.isContentEditable) || tag === "input" || tag === "textarea" || tag === "select";
}

export function resolvePlaygroundShortcut(event: ShortcutEventLike): PlaygroundShortcutAction {
  if (isEditableShortcutTarget(event.target) || !(event.ctrlKey || event.metaKey)) return null;
  const key = event.key.toLowerCase();
  if (event.shiftKey && key === "g") return "generate";
  if (event.shiftKey && key === "r") return "restore";
  if (!event.shiftKey && event.key === "Enter") return "trigger";
  return null;
}

export const PLAYGROUND_SHORTCUT_LABELS = {
  generate: "CTRL/⌘ ⇧ G",
  restore: "CTRL/⌘ ⇧ R",
  trigger: "CTRL/⌘ ↵",
} as const;
