import { readdir, readFile } from "node:fs/promises";
import { formatDisplayDate } from "./notes/date-format.js";
import { bodyToHtml } from "./notes/djot-render.js";
import {
  extractTopHeading,
  formatTitleFromSlug,
  parseDjFile,
  parseNotesFileName,
} from "./notes/file-parse.js";
import { getNotesGitHistory } from "./notes/git-history.js";
import { G } from "./globals.js";

const NOTES_DIR_URL = new URL("../../content/notes/", import.meta.url);

function compareByNewestCreatedAt(a, b) {
  if (a.createdAt !== b.createdAt) {
    return b.createdAt.localeCompare(a.createdAt);
  }

  return b.slug.localeCompare(a.slug);
}

export function sortNotesPosts(posts) {
  return [...posts].sort((a, b) => {
    const aPinned = a.pinned >= 0;
    const bPinned = b.pinned >= 0;

    if (aPinned && bPinned) {
      if (a.pinned !== b.pinned) {
        return a.pinned - b.pinned;
      }

      return compareByNewestCreatedAt(a, b);
    }

    if (aPinned !== bPinned) {
      return aPinned ? -1 : 1;
    }

    return compareByNewestCreatedAt(a, b);
  });
}

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
    const history = await getNotesGitHistory(entry.name);

    posts.push({
      slug,
      title,
      createdAt: header.createdAt,
      updatedAt: header.updatedAt,
      displayDate: formatDisplayDate(header.createdAt),
      revision: header.revision,
      isPublic: header.isPublic,
      tags: header.tags,
      pinned: header.pinned,
      html: bodyToHtml(extracted.body, entry.name),
      history,
    });
  }

  return sortNotesPosts(posts);
}

export async function getPublicNotesPosts() {
  const posts = await getNotesPosts();
  return posts.filter((post) => post.isPublic);
}

export function getPostTagsWithPhantoms(tags, phantomTags = G.PhantomTags) {
  const effectiveTags = [];
  const seenTags = new Set();

  for (const tag of tags ?? []) {
    const normalizedTag = String(tag).trim();
    if (!normalizedTag || seenTags.has(normalizedTag)) {
      continue;
    }

    seenTags.add(normalizedTag);
    effectiveTags.push(normalizedTag);
  }

  const phantomInsertions = [];

  for (const phantomTag of phantomTags) {
    const normalizedPhantomTag = String(phantomTag).trim();
    if (!normalizedPhantomTag || seenTags.has(normalizedPhantomTag)) {
      continue;
    }

    const firstCreatingTagIndex = effectiveTags.findIndex((tag) =>
      tag.startsWith(`${normalizedPhantomTag}:`),
    );

    if (firstCreatingTagIndex >= 0) {
      seenTags.add(normalizedPhantomTag);
      phantomInsertions.push({
        tag: normalizedPhantomTag,
        index: firstCreatingTagIndex,
      });
    }
  }

  phantomInsertions
    .sort((a, b) => a.index - b.index)
    .forEach(({ tag, index }, offset) => {
      effectiveTags.splice(index + offset, 0, tag);
    });

  return effectiveTags;
}

export function groupPostsByTag(posts) {
  const postsByTag = new Map();

  for (const post of posts) {
    for (const tag of getPostTagsWithPhantoms(post.tags)) {
      if (!postsByTag.has(tag)) {
        postsByTag.set(tag, []);
      }

      postsByTag.get(tag).push(post);
    }
  }

  return postsByTag;
}

export async function getPublicNotesTagPages() {
  const posts = await getPublicNotesPosts();
  const postsByTag = groupPostsByTag(posts);

  return Array.from(postsByTag.entries())
    .sort(([tagA], [tagB]) => tagA.localeCompare(tagB))
    .map(([tag, taggedPosts]) => ({
      tag,
      posts: taggedPosts.map(({ slug, title, pinned }) => ({
        slug,
        title,
        pinned,
      })),
    }));
}
