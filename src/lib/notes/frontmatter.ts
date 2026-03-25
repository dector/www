import Hjson from "hjson";

export type ParsedHeader = {
  title: string | null;
  createdAt: string;
  updatedAt: string | null;
  revision: number | string | null;
  isPublic: boolean;
  tags: string[];
  pinned: number;
};

function parseRevision(revisionRaw: unknown): number | string | null {
  if (revisionRaw === undefined || revisionRaw === null) {
    return null;
  }

  if (typeof revisionRaw === "number") {
    return revisionRaw;
  }

  if (typeof revisionRaw === "string" && /^\d+$/.test(revisionRaw)) {
    return Number(revisionRaw);
  }

  return String(revisionRaw);
}

function parseTags(rawTags: unknown): string[] {
  if (Array.isArray(rawTags)) {
    return rawTags.map((tag) => String(tag));
  }

  if (rawTags) {
    return [String(rawTags)];
  }

  return [];
}

function parsePinned(pinnedRaw: unknown, fileName: string): number {
  if (pinnedRaw === undefined || pinnedRaw === null || pinnedRaw === "") {
    return -1;
  }

  const value =
    typeof pinnedRaw === "number"
      ? pinnedRaw
      : typeof pinnedRaw === "string"
        ? Number(pinnedRaw)
        : Number.NaN;

  if (!Number.isInteger(value) || value < -1) {
    throw new Error(
      `Invalid pinned value in ${fileName}: expected integer >= 0 or -1`,
    );
  }

  return value;
}

export function parseHjsonHeader(
  headerText: string,
  fileName: string,
): ParsedHeader {
  let meta: Record<string, unknown>;

  try {
    const parsed = Hjson.parse(headerText) as unknown;
    if (!parsed || typeof parsed !== "object") {
      throw new Error(`Front-matter in ${fileName} must be an object`);
    }

    meta = parsed as Record<string, unknown>;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid HJSON front-matter in ${fileName}: ${message}`);
  }

  if (!meta.createdAt) {
    throw new Error(`Missing required header key in ${fileName}: createdAt`);
  }

  return {
    title: meta.title ? String(meta.title) : null,
    createdAt: String(meta.createdAt),
    updatedAt: meta.updatedAt ? String(meta.updatedAt) : null,
    revision: parseRevision(meta.revision ?? meta.rev),
    isPublic: Boolean(meta.public),
    tags: parseTags(meta.tags),
    pinned: parsePinned(meta.pinned, fileName),
  };
}
