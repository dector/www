import { execSync } from "node:child_process";

type BuildMeta = {
  fullHash: string;
  shortHash: string;
  buildStamp: string;
  label: string;
};

function getFullHash(): string {
  try {
    return execSync("git rev-parse HEAD", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "unknown";
  }
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function formatBuildStamp(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}${month}${day}-${hours}:${minutes}:${seconds}`;
}

const fullHash = getFullHash();
const shortHash = fullHash === "unknown" ? fullHash : fullHash.slice(0, 8);
const buildStamp = formatBuildStamp();
const label = `${shortHash}-${buildStamp}`;

export const buildMeta: BuildMeta = {
  fullHash,
  shortHash,
  buildStamp,
  label,
};
