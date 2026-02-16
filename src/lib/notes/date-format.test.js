import { describe, expect, test } from "bun:test";
import { formatDisplayDate, parseDateValue } from "./date-format.js";

describe("date-format", () => {
  test("parses UTC date-time string", () => {
    const date = parseDateValue("2026-02-16 20:40");

    expect(date).toBeInstanceOf(Date);
    expect(date.toISOString()).toBe("2026-02-16T20:40:00.000Z");
  });

  test("formats display date in expected pattern", () => {
    const displayDate = formatDisplayDate("2026-02-16 20:40");

    expect(displayDate).toBe("Mon, 16 Feb 2026 20:40");
  });

  test("throws for invalid date values", () => {
    expect(() => parseDateValue("2026-2-16 20:40")).toThrow(
      "Invalid date value: 2026-2-16 20:40",
    );
  });
});
