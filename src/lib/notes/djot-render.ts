import { parse, renderHTML } from "@djot/djot";
import hljs from "highlight.js";

type DjotRenderer = {
  escapeAttribute(value: string): string;
  escape(value: string): string;
  renderTag(tagName: string, node: unknown): string;
  renderCloseTag(tagName: string): string;
  renderChildren(node: unknown): string;
};

type DjotCodeBlockNode = {
  text: string;
  lang?: string | null;
};

type DjotLinkNode = {
  destination?: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function highlightCodeBlock(
  rawCode: string,
  rawLang: string,
): { highlightedCode: string; language: string } {
  const language = rawLang.trim().toLowerCase();

  if (!language || !hljs.getLanguage(language)) {
    return {
      highlightedCode: escapeHtml(rawCode),
      language,
    };
  }

  const highlighted = hljs.highlight(rawCode, {
    language,
    ignoreIllegals: true,
  });

  return {
    highlightedCode: highlighted.value,
    language,
  };
}

const DJOT_RENDER_OPTIONS = {
  overrides: {
    code_block: (node: DjotCodeBlockNode, renderer: DjotRenderer): string => {
      const { highlightedCode, language } = highlightCodeBlock(
        node.text,
        node.lang ?? "",
      );
      const classAttr = language
        ? ` language-${renderer.escapeAttribute(language)}`
        : "";
      const langTag = language
        ? `<span class="lang-tag">${renderer.escape(language)}</span>`
        : "";
      return `<div class="code-block">${langTag}${renderer.renderTag("pre", node)}<code class="hljs${classAttr}">${highlightedCode}</code>${renderer.renderCloseTag("pre")}</div>\n`;
    },
    link: (node: DjotLinkNode, renderer: DjotRenderer): string => {
      const destination = node.destination ?? "";
      const isExternal = /^https?:\/\//i.test(destination);
      const href = renderer.escapeAttribute(destination);

      const attrs = isExternal
        ? ` href="${href}" target="_blank" rel="noopener noreferrer"`
        : ` href="${href}"`;

      return `<a${attrs}>${renderer.renderChildren(node)}</a>`;
    },
  },
};

export function bodyToHtml(rawBody: string, fileName: string): string {
  try {
    const ast = parse(rawBody);
    return renderHTML(ast, DJOT_RENDER_OPTIONS);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid Djot body in ${fileName}: ${message}`);
  }
}
