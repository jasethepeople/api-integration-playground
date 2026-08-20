export type HighlightableJson = Record<string, unknown> | unknown[] | string | number | boolean | null;

export function highlightJson(value: HighlightableJson) {
  const source = JSON.stringify(value, null, 2);
  const escaped = source.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const tokenPattern = /("(?:\\.|[^"\\])*"(?=\s*:))|("(?:\\.|[^"\\])*")|(\btrue\b|\bfalse\b)|(\bnull\b)|(-?\b\d+(?:\.\d+)?\b)/g;
  return escaped.replace(tokenPattern, (token, key, string, bool, nil, number) => {
    if (key) return `<span class="json-key">${key}</span>`;
    if (string) return `<span class="json-string">${string}</span>`;
    if (bool) return `<span class="json-bool">${bool}</span>`;
    if (nil) return `<span class="json-null">${nil}</span>`;
    return `<span class="json-number">${number}</span>`;
  });
}
