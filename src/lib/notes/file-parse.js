import { parseHjsonHeader } from "./frontmatter.js";

export function parseNotesFileName(name) {
  if (!name.endsWith(".dj")) {
    return null;
  }

  const slug = name.slice(0, -3);
  return slug || null;
}

export function parseDjFile(content, fileName) {
  const normalized = content.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");

  if (lines[0]?.trim() !== "---") {
    throw new Error(`Missing starting header marker in ${fileName}`);
  }

  const endHeader = lines.findIndex(
    (line, idx) => idx > 0 && line.trim() === "---",
  );
  if (endHeader < 0) {
    throw new Error(`Missing ending header marker in ${fileName}`);
  }

  const headerText = lines.slice(1, endHeader).join("\n");
  const header = parseHjsonHeader(headerText, fileName);
  const body = lines
    .slice(endHeader + 1)
    .join("\n")
    .trim();
  return { header, body };
}

export function formatTitleFromSlug(slug) {
  return slug.replaceAll("-", " ");
}

export function extractTopHeading(rawBody) {
  const lines = rawBody.replace(/\r\n/g, "\n").split("\n");

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    const match = trimmed.match(/^#\s+(.+?)\s*$/);
    if (!match) {
      return { title: null, body: rawBody };
    }

    const remainingLines = lines.slice(index + 1);
    while (remainingLines[0] !== undefined && remainingLines[0].trim() === "") {
      remainingLines.shift();
    }

    return {
      title: match[1].trim(),
      body: remainingLines.join("\n"),
    };
  }

  return { title: null, body: rawBody };
}
