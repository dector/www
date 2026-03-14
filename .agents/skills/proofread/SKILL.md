---
name: proofread
description: Proofreads an existing draft while preserving the original voice. Focus on grammar, typos, and small clarity fixes via incremental edits and user approval.
---

# Proofread (voice-preserving)

Use this skill when the user asks to proofread text without changing tone/style.

## Goal

Improve grammar and correctness while keeping the author’s original voice, rhythm, and wording style.

## Scope rules

- Allowed: grammar, spelling, agreement, articles, prepositions, capitalization, punctuation, obvious typo fixes.
- Allowed (light): tiny wording fixes only when required for grammatical correctness.
- Not allowed by default: stylistic rewrites, tone polishing, structure changes, shortening/expanding ideas, replacing colloquial voice.
- If a change is style-only, ask first.

## Workflow

1. Identify target file.
   - If user says “check git”, inspect `git status --short` and pick the newly added/modified note file.
2. Read the file once to build an edit queue.
3. Propose/apply fixes incrementally according to user preference.

### Interactive modes

- **One-by-one mode** (default):
  - Apply exactly one edit.
  - Wait for approval/rejection.
  - If approved, proceed to next edit automatically if user requested continuous flow.
- **Batch mode** (if user asks for “few lines at same time”):
  - Apply 2–6 independent edits per turn.

## Conversation behavior

- Respect explicit user protocol.
  - Example protocol: “if edit applied, go to next suggestion; if reject, I’ll explain”.
- If user says “don’t ask, just edit”: do edits directly.
- Keep responses minimal (e.g., `✅`) if user prefers.
- Do not summarize every change unless user asks for a summary.

## Tooling behavior

- Prefer `edit` for surgical changes.
- Do **not** reread the file on every turn.
  - Reread only when needed (edit mismatch, user asks for full check, or context drift).
- Keep edits atomic and easy to approve/reject.

## Heuristics for preserving voice

- Keep original sentence intent and emotional tone.
- Keep contractions if present (e.g., `it's`, `I'm`).
- Keep informal phrasing unless grammatically broken.
- Prefer smallest possible diff.

## Completion criteria

Stop when one of these is true:

- No clear grammar/typo issues remain.
- User says stop.
- Further changes would be stylistic rather than grammatical.

Then provide a brief final status only if requested.