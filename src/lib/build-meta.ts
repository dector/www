import { execSync } from "node:child_process";

function getFullHash() {
    try {
        return execSync("git rev-parse HEAD", {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"],
        }).trim();
    } catch {
        return "unknown";
    }
}

function pad(value) {
    return String(value).padStart(2, "0");
}

function formatBuildStamp(date = new Date()) {
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

export const buildMeta = {
    fullHash,
    shortHash,
    buildStamp,
    label,
};
