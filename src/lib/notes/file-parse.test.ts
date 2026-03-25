import { describe, expect, test } from "bun:test";
import {
  extractTopHeading,
  formatTitleFromSlug,
  parseDjFile,
  parseNotesFileName,
} from "./file-parse.ts";

describe("file-parse", () => {
  test("parses note file names into slugs", () => {
    expect(parseNotesFileName("hello-world.dj")).toBe("hello-world");
    expect(parseNotesFileName(".dj")).toBeNull();
    expect(parseNotesFileName("hello-world.md")).toBeNull();
  });

  test("parses .dj file content into header and body", () => {
    const parsed = parseDjFile(
      `
---
createdAt: "2026-02-16 20:40"
public: true
---

# Title

Paragraph.
`.trim(),
      "note.dj",
    );

    expect(parsed.header.createdAt).toBe("2026-02-16 20:40");
    expect(parsed.header.isPublic).toBe(true);
    expect(parsed.body).toBe("# Title\n\nParagraph.");
  });

  test("throws when header markers are missing", () => {
    expect(() => parseDjFile("createdAt: value", "note.dj")).toThrow(
      "Missing starting header marker in note.dj",
    );
    expect(() => parseDjFile("---\ncreatedAt: value", "note.dj")).toThrow(
      "Missing ending header marker in note.dj",
    );
  });

  test("extracts top heading and strips leading blank lines after it", () => {
    const extracted = extractTopHeading("# My Title\n\n\nBody line");

    expect(extracted).toEqual({
      title: "My Title",
      body: "Body line",
    });
  });

  test("keeps body untouched when first content is not heading", () => {
    const body = "\nParagraph first\n# Heading later";
    const extracted = extractTopHeading(body);

    expect(extracted).toEqual({
      title: null,
      body,
    });
  });

  test("formats title from slug", () => {
    expect(formatTitleFromSlug("pragmatic-craftsmanship")).toBe(
      "pragmatic craftsmanship",
    );
  });
});
