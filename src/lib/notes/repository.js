import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { getNotesGitHistory } from "./git-history.js";

const NOTES_DIR_PATH = join(process.cwd(), "content", "notes");

export async function listNotesFileNames() {
  const entries = await readdir(NOTES_DIR_PATH, { withFileTypes: true });
  return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
}

export async function readNotesFile(fileName) {
  return readFile(join(NOTES_DIR_PATH, fileName), "utf8");
}

export async function getNotesFileGitHistory(fileName) {
  return getNotesGitHistory(fileName);
}
