import { formatDisplayDate } from "./date-format.ts";
import { bodyToHtml } from "./djot-render.ts";
import {
  extractTopHeading,
  formatTitleFromSlug,
  parseDjFile,
  parseNotesFileName,
} from "./file-parse.ts";
import { G } from "../globals.ts";
import type { Post, PostHistory } from "./types";

function compareByNewestCreatedAt(a: Post, b: Post) {
  if (a.createdAt !== b.createdAt) {
    return b.createdAt.localeCompare(a.createdAt);
  }

  return b.slug.localeCompare(a.slug);
}

export function getSlugFromNotesFileName(fileName: string): string | null {
  return parseNotesFileName(fileName);
}

export function toNotesPost({
  fileName,
  slug,
  raw,
  history,
}: {
  fileName: string;
  slug: string;
  raw: string;
  history: PostHistory | null;
}): Post {
  const { header, body } = parseDjFile(raw, fileName);
  const extracted = extractTopHeading(body);
  const title = extracted.title ?? header.title ?? formatTitleFromSlug(slug);

  return {
    slug,
    title,
    createdAt: header.createdAt,
    updatedAt: header.updatedAt,
    displayDate: formatDisplayDate(header.createdAt),
    revision: header.revision,
    isPublic: header.isPublic,
    tags: header.tags,
    pinned: header.pinned,
    html: bodyToHtml(extracted.body, fileName),
    history,
  };
}

export function sortNotesPosts(posts: Post[]): Post[] {
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

export function getPostTagsWithPhantoms(
  tags: string[] | undefined,
  phantomTags: string[] = G.PhantomTags,
): string[] {
  const effectiveTags: string[] = [];
  const seenTags = new Set<string>();

  for (const tag of tags ?? []) {
    const normalizedTag = String(tag).trim();
    if (!normalizedTag || seenTags.has(normalizedTag)) {
      continue;
    }

    seenTags.add(normalizedTag);
    effectiveTags.push(normalizedTag);
  }

  const phantomInsertions: { tag: string; index: number }[] = [];

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

export function groupPostsByTag(posts: Post[]): Map<string, Post[]> {
  const postsByTag = new Map<string, Post[]>();

  for (const post of posts) {
    for (const tag of getPostTagsWithPhantoms(post.tags)) {
      if (!postsByTag.has(tag)) {
        postsByTag.set(tag, []);
      }

      postsByTag.get(tag)?.push(post);
    }
  }

  return postsByTag;
}
