import { describe, expect, test } from "bun:test";
import { bodyToHtml } from "./djot-render.ts";

describe("djot-render", () => {
  test("renders basic Djot markup", () => {
    const html = bodyToHtml("*hello*", "note.dj");

    expect(html).toContain("<strong>hello</strong>");
  });

  test("renders highlighted code block for known languages", () => {
    const html = bodyToHtml("```js\nconst x = 1;\n```", "note.dj");

    expect(html).toContain('<div class="code-block">');
    expect(html).toContain('<span class="lang-tag">js</span>');
    expect(html).toContain('class="hljs language-js"');
    expect(html).toContain("hljs-keyword");
  });

  test("escapes code for unknown languages", () => {
    const html = bodyToHtml(
      "```foo\n<script>alert(1)</script>\n```",
      "note.dj",
    );

    expect(html).toContain('<span class="lang-tag">foo</span>');
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  test("adds target and rel only for external links", () => {
    const html = bodyToHtml(
      "[ext](https://example.com) [int](/notes) [mail](mailto:a@b.c)",
      "note.dj",
    );

    expect(html).toContain(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer">ext</a>',
    );
    expect(html).toContain('<a href="/notes">int</a>');
    expect(html).toContain('<a href="mailto:a@b.c">mail</a>');
  });
});
