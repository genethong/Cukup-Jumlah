import { describe, expect, it } from "vitest";
import { prefixRewrite, previewPathPrefix } from "./preview-path-prefix";

const PORT = "/hds-up68yqz8egcm-6014-7b575";

describe("previewPathPrefix", () => {
  it("reads the port id segment on path-based preview hosts", () => {
    expect(previewPathPrefix("preview.grokgsac.com", `${PORT}/`)).toBe(PORT);
    expect(previewPathPrefix("Preview.Grok.GenAI.mil", `${PORT}/about`)).toBe(PORT);
    expect(previewPathPrefix("preview.grok.mil", PORT)).toBe(PORT);
  });

  it("ignores other hosts and paths without a port id", () => {
    expect(previewPathPrefix("abc.grok-sandbox.com", `${PORT}/`)).toBeUndefined();
    expect(previewPathPrefix("localhost", `${PORT}/`)).toBeUndefined();
    expect(previewPathPrefix("preview.grokgsac.com", "/about")).toBeUndefined();
    expect(previewPathPrefix("preview.grokgsac.com", "/hds-abc-web-x1/")).toBeUndefined();
    expect(previewPathPrefix("preview.grokgsac.com", `${PORT}.js`)).toBeUndefined();
  });
});

describe("prefixRewrite", () => {
  const rewrite = prefixRewrite(PORT);
  const run = (fn: typeof rewrite.input, href: string) =>
    String(fn?.({ url: new URL(href, "https://preview.grokgsac.com") }));

  it("strips the prefix on input", () => {
    expect(run(rewrite.input, PORT)).toBe("https://preview.grokgsac.com/");
    expect(run(rewrite.input, `${PORT}/a?b=1#c`)).toBe("https://preview.grokgsac.com/a?b=1#c");
    expect(run(rewrite.input, "/other")).toBe("https://preview.grokgsac.com/other");
  });

  it("adds the prefix on output", () => {
    expect(run(rewrite.output, "/a?b=1")).toBe(`https://preview.grokgsac.com${PORT}/a?b=1`);
    expect(run(rewrite.output, "/")).toBe(`https://preview.grokgsac.com${PORT}/`);
  });
});
