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
    "dotfiles",
    "pi-x",
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


def _json_from_text(text: str):
    first_object = text.find("{")
    first_array = text.find("[")

    starts = [i for i in (first_object, first_array) if i != -1]
    if not starts:
        raise RuntimeError("Could not parse JSON from response")

    start = min(starts)
    return json.loads(text[start:])


def _github_get_json(url: str):
    try:
        return _json_from_text(_http_get_text(url))
    except urllib.error.HTTPError as err:
        if err.code != 403:
            raise

        # Fallback for unauthenticated API limits.
        mirror_text = _http_get_text(f"https://r.jina.ai/http://{url.removeprefix('https://')}")
        return _json_from_text(mirror_text)


def _fetch_page(page: int) -> list[dict]:
    api_url = (
        f"https://api.github.com/users/{USERNAME}/repos"
        f"?per_page=100&page={page}&type=public&sort=updated"
    )
    return _github_get_json(api_url)


def _latest_commit_at(repo: dict) -> str:
    default_branch = repo.get("default_branch")
    if not default_branch:
        return repo["updated_at"]

    commits_url = (
        f"https://api.github.com/repos/{USERNAME}/{repo['name']}/commits"
        f"?per_page=1&sha={default_branch}"
    )

    try:
        commits = _github_get_json(commits_url)
    except urllib.error.HTTPError as err:
        # 409 can happen for empty repositories.
        # 403/429 can happen when we hit API or mirror limits.
        if err.code in {403, 409, 429}:
            return repo["updated_at"]
        raise

    if not isinstance(commits, list) or not commits:
        return repo["updated_at"]

    head = (commits[0] or {}).get("commit") or {}
    author = head.get("author") or {}
    committer = head.get("committer") or {}
    return author.get("date") or committer.get("date") or repo["updated_at"]


def _project_status(repo: dict, latest_commit_at: str, stale_before: dt.datetime) -> str:
    if repo.get("archived"):
        return "Archived"

    updated = dt.datetime.fromisoformat(latest_commit_at.replace("Z", "+00:00"))
    return "Stale" if updated < stale_before else "Active"


def main() -> None:
    repos: list[dict] = []
    page = 1
    while True:
        chunk = _fetch_page(page)
        if not isinstance(chunk, list) or not chunk:
            break
        repos.extend(chunk)
        if len(chunk) < 100:
            break
        page += 1

    now = dt.datetime.now(dt.timezone.utc)
    stale_before = now - dt.timedelta(days=STALE_AFTER_DAYS)
    pin_order = {name: i for i, name in enumerate(PINNED_REPOS)}

    filtered = [r for r in repos if r["name"] in INCLUDED_REPOS]

    latest_commit_by_repo: dict[str, str] = {}
    for repo in filtered:
        latest_commit_by_repo[repo["name"]] = _latest_commit_at(repo)

    filtered.sort(
        key=lambda r: (
            1 if r.get("archived") else 0,
            0 if r["name"] in pin_order else 1,
            pin_order.get(r["name"], 9999),
            -dt.datetime.fromisoformat(
                latest_commit_by_repo[r["name"]].replace("Z", "+00:00")
            ).timestamp(),
        )
    )

    projects = []
    for repo in filtered:
        topics = repo.get("topics") or []
        language = repo.get("language")
        tags = topics if topics else ([language] if language else ["misc"])
        latest_commit_at = latest_commit_by_repo[repo["name"]]

        projects.append(
            {
                "name": repo["name"],
                "summary": repo.get("description") or "No description provided.",
                "tags": tags,
                "status": _project_status(repo, latest_commit_at, stale_before),
                "repoUrl": repo["html_url"],
                "homepageUrl": repo.get("homepage") or None,
                "updatedAt": latest_commit_at,
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
