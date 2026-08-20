import { describe, expect, it } from "vitest";
import { highlightJson } from "../client/src/lib/jsonHighlight";

describe("highlightJson", () => {
  it("renders token classes without re-tokenizing generated markup", () => {
    const html = highlightJson({ name: "Ada", count: 2, active: true, missing: null });
    expect(html).toContain('<span class="json-key">"name"</span>');
    expect(html).toContain('<span class="json-string">"Ada"</span>');
    expect(html).toContain('<span class="json-number">2</span>');
    expect(html).toContain('<span class="json-bool">true</span>');
    expect(html).toContain('<span class="json-null">null</span>');
    expect(html).not.toContain('<span class="json-string">"json-key"</span>');
  });
});
