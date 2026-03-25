import {
  getNotesFileGitHistory,
  listNotesFileNames,
  readNotesFile,
} from "./repository.ts";
import {
  getPostTagsWithPhantoms,
  getSlugFromNotesFileName,
  groupPostsByTag,
  sortNotesPosts,
  toNotesPost,
} from "./transformers.ts";
import type { Post, TagPage } from "./types";

export async function getNotesPosts(): Promise<Post[]> {
  const fileNames = await listNotesFileNames();
  const slugs = new Map<string, string>();
  const posts: Post[] = [];

  for (const fileName of fileNames) {
    const slug = getSlugFromNotesFileName(fileName);
    if (!slug) {
      continue;
    }

    if (slugs.has(slug)) {
      throw new Error(
        `Duplicate slug ${slug} from ${fileName} and ${slugs.get(slug)}`,
      );
    }

    slugs.set(slug, fileName);

    const raw = await readNotesFile(fileName);
    const history = await getNotesFileGitHistory(fileName);

    posts.push(toNotesPost({ fileName, slug, raw, history }));
  }

  return sortNotesPosts(posts);
}

export async function getPublicNotesPosts(): Promise<Post[]> {
  const posts = await getNotesPosts();
  return posts.filter((post) => post.isPublic);
}

export async function getPublicNotesTagPages(): Promise<TagPage[]> {
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

export { getPostTagsWithPhantoms, groupPostsByTag, sortNotesPosts };
