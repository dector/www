---
name: publish-website
description: Publishes this site by safely retargeting the `in-prod` tag only when the working tree is clean, then requiring explicit `yes` confirmation before force-pushing the tag.
---

# Publish Website

Use this skill when the user asks to publish/deploy the website.

## Purpose

This project deploys from the `in-prod` git tag (GitHub Actions workflow). This skill updates that tag to the latest commit and pushes it, with safety checks.

## Safety rules

- Never publish if there are uncommitted changes.
- Do not auto-commit, auto-stash, or discard changes.
- Require explicit confirmation before pushing.
- Confirmation must be exactly: `yes`.

## Workflow

1. Check repo cleanliness:
   - Run: `git status --porcelain`
   - If output is non-empty, stop with error:
     - `❌ Publish aborted: uncommitted changes detected. Commit or stash your changes first.`

2. Move `in-prod` tag to current `HEAD`:
   - Run: `git tag -f in-prod`

3. Ask for confirmation:
   - Prompt: `Tag \'in-prod\' now points to HEAD. Push to origin with force? Type 'yes' to continue.`

4. Only if user replies exactly `yes`, push tag:
   - Run: `git push --force origin in-prod`

5. Report result clearly:
   - On success: `✅ Published: pushed tag in-prod to origin.`
   - If not confirmed: `Publish cancelled (no push performed).`

## Notes

- The deploy workflow is in `.github/workflows/deploy-pages.yml` and triggers on push of tag `in-prod`.
- Keep responses concise and explicit about whether a push happened.
