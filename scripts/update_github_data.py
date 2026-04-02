#!/usr/bin/env -S uv run python
import datetime as dt
import json
import urllib.error
import urllib.request
from pathlib import Path

USERNAME = "dector"
STALE_AFTER_DAYS = 365

# Persistent config: repos we want to show first with a pin.
PINNED_REPOS = [
    "www",
]

# Persistent config: repos we want to include on /projects.
INCLUDED_REPOS = {
    "www",
    "config-astronvim",
    "dotfiles",
    "pi-x",
    "serv",
    "kdly",
    "paper-toolkit",
    "awesome-organic-writing",
    "hata",
    "lampa",
    "respect-busy-maintainers",
    "authie",
    "homelab-public",
    "bang",
    "engbook",
    "run-lampa",
    "tg-bumblebee-bot",
    "moon_lander",
    "pustomario",
    "sarif-kotlin",
    "light-map",
    "pipes.kt",
    "processing-fun",
    "uCompiler",
    "space-lander",
    "ludum-dare",
    "CleverBlocks",
    "scatris",
    "Stackoverflow-answers",
    "quotes-clean",
    "kotris",
    "rkpi",
    "ld29",
    "ld29-haxe",
    "snake",
    "personal-notes",
    "tlamp",
    "lh2l_project",
    "social-interaction",
    "im-sorry-dave",
    "plchdr-kt",
    "tuya-lib",
    "ghosty",
    "quotes",
    "things",
    "dector",
    "dead-art-space",
    "exercism-kotlin",
    "tkgbot",
    "kotlin-guides",
}


def _http_get_text(url: str) -> str:
    req = urllib.request.Request(
        url,
        headers={
            "Accept": "application/vnd.github+json",
            "User-Agent": "dector-www-projects-page",
        },
    )
    with urllib.request.urlopen(req) as resp:
        return resp.read().decode("utf-8")


def _fetch_page(page: int) -> list[dict]:
    api_url = (
        f"https://api.github.com/users/{USERNAME}/repos"
        f"?per_page=100&page={page}&type=public&sort=updated"
    )

    try:
        return json.loads(_http_get_text(api_url))
    except urllib.error.HTTPError as err:
        if err.code != 403:
            raise

        # Fallback for unauthenticated API limits.
        mirror_text = _http_get_text(f"https://r.jina.ai/http://api.github.com/users/{USERNAME}/repos?per_page=100&page={page}&type=public&sort=updated")
        start = mirror_text.find("[")
        if start == -1:
            raise RuntimeError("Could not parse fallback response")
        return json.loads(mirror_text[start:])


def _project_status(repo: dict, stale_before: dt.datetime) -> str:
    if repo.get("archived"):
        return "Archived"

    updated = dt.datetime.fromisoformat(repo["updated_at"].replace("Z", "+00:00"))
    return "Stale" if updated < stale_before else "Active"


def main() -> None:
    repos: list[dict] = []
    page = 1
    while True:
        chunk = _fetch_page(page)
        if not chunk:
            break
        repos.extend(chunk)
        if len(chunk) < 100:
            break
        page += 1

    now = dt.datetime.now(dt.timezone.utc)
    stale_before = now - dt.timedelta(days=STALE_AFTER_DAYS)
    pin_order = {name: i for i, name in enumerate(PINNED_REPOS)}

    filtered = [r for r in repos if r["name"] in INCLUDED_REPOS]
    filtered.sort(
        key=lambda r: (
            0 if r["name"] in pin_order else 1,
            pin_order.get(r["name"], 9999),
            -dt.datetime.fromisoformat(r["updated_at"].replace("Z", "+00:00")).timestamp(),
        )
    )

    projects = []
    for repo in filtered:
        topics = repo.get("topics") or []
        language = repo.get("language")
        tags = topics if topics else ([language] if language else ["misc"])

        projects.append(
            {
                "name": repo["name"],
                "summary": repo.get("description") or "No description provided.",
                "tags": tags,
                "status": _project_status(repo, stale_before),
                "repoUrl": repo["html_url"],
                "homepageUrl": repo.get("homepage") or None,
                "updatedAt": repo["updated_at"],
                "isPinned": repo["name"] in pin_order,
            }
        )

    out = {
        "generatedAt": now.replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "source": f"https://api.github.com/users/{USERNAME}/repos",
        "projects": projects,
    }

    out_path = Path("src/lib/github_data.json")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out, indent=2) + "\n")

    print(f"updated {out_path} ({len(projects)} projects from {len(repos)} repos)")


if __name__ == "__main__":
    main()
