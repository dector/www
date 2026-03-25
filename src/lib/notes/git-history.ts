import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const COMMIT_FIELD_SEPARATOR = "\u001f";
const COMMIT_ROW_SEPARATOR = "\u001e";
const PROJECT_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const historyCache = new Map();

function formatHistoryDate(dateText) {
  const date = new Date(`${dateText}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return dateText;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export async function getNotesGitHistory(fileName) {
  if (historyCache.has(fileName)) {
    return historyCache.get(fileName);
  }

  const historyPromise = (async () => {
    const relativePath = `content/notes/${fileName}`;

    try {
      const { stdout } = await execFileAsync(
        "git",
        [
          "log",
          "--follow",
          "--date=short",
          `--pretty=format:%H%x1f%ad%x1f%s%x1e`,
          "--",
          relativePath,
        ],
        { cwd: PROJECT_ROOT },
      );

      const rows = stdout
        .split(COMMIT_ROW_SEPARATOR)
        .map((row) => row.trim())
        .filter(Boolean);

      if (rows.length === 0) {
        return null;
      }

      const changes = rows
        .map((row) => {
          const [hash, date, message] = row.split(COMMIT_FIELD_SEPARATOR);
          if (!hash || !date || !message) {
            return null;
          }

          return {
            hash,
            date,
            displayDate: formatHistoryDate(date),
            message,
          };
        })
        .filter(Boolean);

      if (changes.length === 0) {
        return null;
      }

      return {
        createdAt: changes.at(-1).displayDate,
        updatedAt: changes[0].displayDate,
        currentVersion: changes[0].hash,
        changes,
      };
    } catch {
      return null;
    }
  })();

  historyCache.set(fileName, historyPromise);
  return historyPromise;
}
