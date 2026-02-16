import { describe, expect, test } from "bun:test";
import { groupPostsByTag } from "./notes.js";

function post(slug, tags) {
  return {
    slug,
    title: slug,
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
});
