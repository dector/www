import { describe, expect, test } from "bun:test";
import { parseHjsonHeader } from "./frontmatter.js";

describe("frontmatter", () => {
  test("parses valid HJSON front-matter", () => {
    const header = parseHjsonHeader(
      `
title: "Pragmatic"
createdAt: "2026-02-16 20:40"
updatedAt: "2026-02-17 09:00"
revision: "12"
public: true
tags: [
  "meta"
  "area:blog"
]
`.trim(),
      "post.dj",
    );

    expect(header).toEqual({
      title: "Pragmatic",
      createdAt: "2026-02-16 20:40",
      updatedAt: "2026-02-17 09:00",
      revision: 12,
      isPublic: true,
      tags: ["meta", "area:blog"],
    });
  });

  test("supports rev alias and scalar tags", () => {
    const header = parseHjsonHeader(
      `
createdAt: "2026-02-16 20:40"
rev: "1.0.0"
tags: meta
`.trim(),
      "post.dj",
    );

    expect(header.revision).toBe("1.0.0");
    expect(header.tags).toEqual(["meta"]);
    expect(header.isPublic).toBe(false);
  });

  test("throws on invalid HJSON", () => {
    expect(() => parseHjsonHeader("{", "broken.dj")).toThrow(
      /Invalid HJSON front-matter in broken\.dj:/,
    );
  });

  test("throws when createdAt is missing", () => {
    expect(() => parseHjsonHeader('title: "No Date"', "broken.dj")).toThrow(
      "Missing required header key in broken.dj: createdAt",
    );
  });
});
