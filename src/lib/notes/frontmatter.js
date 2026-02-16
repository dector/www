import Hjson from "hjson";

function parseRevision(revisionRaw) {
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

function parseTags(rawTags) {
  if (Array.isArray(rawTags)) {
    return rawTags.map((tag) => String(tag));
  }

  if (rawTags) {
    return [String(rawTags)];
  }

  return [];
}

export function parseHjsonHeader(headerText, fileName) {
  let meta;

  try {
    meta = Hjson.parse(headerText);
  } catch (error) {
    throw new Error(
      `Invalid HJSON front-matter in ${fileName}: ${error.message}`,
    );
  }

  if (!meta || typeof meta !== "object") {
    throw new Error(`Front-matter in ${fileName} must be an object`);
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
  };
}
