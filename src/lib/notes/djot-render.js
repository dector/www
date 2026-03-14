import { parse, renderHTML } from "@djot/djot";
import hljs from "highlight.js";

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function highlightCodeBlock(rawCode, rawLang) {
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
    code_block: (node, renderer) => {
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
    link: (node, renderer) => {
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

export function bodyToHtml(rawBody, fileName) {
  try {
    const ast = parse(rawBody);
    return renderHTML(ast, DJOT_RENDER_OPTIONS);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid Djot body in ${fileName}: ${message}`);
  }
}
