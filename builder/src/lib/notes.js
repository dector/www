import { readdir, readFile } from "node:fs/promises";
import { formatDisplayDate } from "./notes/date-format.js";
import { bodyToHtml } from "./notes/djot-render.js";
import {
  extractTopHeading,
  formatTitleFromSlug,
  parseDjFile,
  parseNotesFileName,
} from "./notes/file-parse.js";

const NOTES_DIR_URL = new URL("../../../content/notes/", import.meta.url);

export async function getNotesPosts() {
  const entries = await readdir(NOTES_DIR_URL, { withFileTypes: true });
  const slugs = new Map();
  const posts = [];

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    const slug = parseNotesFileName(entry.name);
    if (!slug) {
      continue;
    }

    if (slugs.has(slug)) {
      throw new Error(
        `Duplicate slug ${slug} from ${entry.name} and ${slugs.get(slug)}`,
      );
    }

    slugs.set(slug, entry.name);

    const raw = await readFile(new URL(entry.name, NOTES_DIR_URL), "utf8");
    const { header, body } = parseDjFile(raw, entry.name);
    const extracted = extractTopHeading(body);
    const title = extracted.title ?? header.title ?? formatTitleFromSlug(slug);

    posts.push({
      slug,
      title,
      createdAt: header.createdAt,
      updatedAt: header.updatedAt,
      displayDate: formatDisplayDate(header.createdAt),
      revision: header.revision,
      isPublic: header.isPublic,
      tags: header.tags,
      html: bodyToHtml(extracted.body, entry.name),
    });
  }

  return posts.sort((a, b) => b.slug.localeCompare(a.slug));
}

export async function getPublicNotesPosts() {
  const posts = await getNotesPosts();
  return posts.filter((post) => post.isPublic);
}
