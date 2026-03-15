import { describe, expect, test } from "bun:test";
import {
  getPostTagsWithPhantoms,
  groupPostsByTag,
  sortNotesPosts,
} from "./notes.js";

function post(slug, tags, options = {}) {
  return {
    slug,
    title: slug,
    createdAt: options.createdAt ?? "2026-01-01 00:00",
    pinned: options.pinned ?? -1,
    tags,
  };
}

describe("notes", () => {
  test("groups posts by tags in source order", () => {
    const posts = [
      post("2026-02-16-first", ["meta", "area:blog"]),
      post("2026-02-15-second", ["meta", "til"]),
    ];
    const grouped = groupPostsByTag(posts);

    expect(grouped.get("meta")?.map((item) => item.slug)).toEqual([
      "2026-02-16-first",
      "2026-02-15-second",
    ]);
    expect(grouped.get("area:blog")?.map((item) => item.slug)).toEqual([
      "2026-02-16-first",
    ]);
    expect(grouped.get("til")?.map((item) => item.slug)).toEqual([
      "2026-02-15-second",
    ]);
  });

  test("skips duplicate and blank tags within one post", () => {
    const posts = [post("2026-02-16-first", ["meta", "meta", " "])];
    const grouped = groupPostsByTag(posts);

    expect(grouped.get("meta")?.map((item) => item.slug)).toEqual([
      "2026-02-16-first",
    ]);
    expect(grouped.size).toBe(1);
  });

  test("adds configured phantom tags before first creating tag", () => {
    const effectiveTags = getPostTagsWithPhantoms(
      ["coding:tools", "til"],
      ["coding", "code"],
    );

    expect(effectiveTags).toEqual(["coding", "coding:tools", "til"]);
  });

  test("keeps unrelated leading tags before inserted phantom tags", () => {
    const effectiveTags = getPostTagsWithPhantoms(
      ["bar", "foo:1"],
      ["foo"],
    );

    expect(effectiveTags).toEqual(["bar", "foo", "foo:1"]);
  });

  test("grouping includes phantom tags", () => {
    const posts = [post("2026-02-16-first", ["coding:tools"])];
    const grouped = groupPostsByTag(posts);

    expect(grouped.get("coding:tools")?.map((item) => item.slug)).toEqual([
      "2026-02-16-first",
    ]);
    expect(grouped.get("coding")?.map((item) => item.slug)).toEqual([
      "2026-02-16-first",
    ]);
  });

  test("sorts pinned posts first by pinned order, then creation date", () => {
    const posts = [
      post("2026-02-16-a", [], { createdAt: "2026-02-16 20:40", pinned: 2 }),
      post("2026-02-17-b", [], { createdAt: "2026-02-17 10:00", pinned: -1 }),
      post("2026-02-18-c", [], { createdAt: "2026-02-18 10:00", pinned: 0 }),
      post("2026-02-19-d", [], { createdAt: "2026-02-19 10:00", pinned: 2 }),
    ];

    const sorted = sortNotesPosts(posts);

    expect(sorted.map((item) => item.slug)).toEqual([
      "2026-02-18-c",
      "2026-02-19-d",
      "2026-02-16-a",
      "2026-02-17-b",
    ]);
  });

  test("sorts non-pinned posts by newest creation date", () => {
    const posts = [
      post("2026-02-16-a", [], { createdAt: "2026-02-16 20:40" }),
      post("2026-02-18-b", [], { createdAt: "2026-02-18 20:40" }),
      post("2026-02-17-c", [], { createdAt: "2026-02-17 20:40" }),
    ];

    const sorted = sortNotesPosts(posts);

    expect(sorted.map((item) => item.slug)).toEqual([
      "2026-02-18-b",
      "2026-02-17-c",
      "2026-02-16-a",
    ]);
  });
});
