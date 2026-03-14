---
name: post-new
description: Creates a new Djot post in content/notes with valid HJSON front-matter, slug, timestamp, and starter body for this Astro site. Use when the user asks to add a new note/post.
---

# Post New

Create a new post file for this project.

## Project conventions

- Posts live in `content/notes/`.
- File extension must be `.dj`.
- Front-matter is **HJSON** between `---` markers.
- `createdAt` is required and must use format: `YYYY-MM-DD HH:mm`.
- Use Djot body content.
- Keep file naming slug-like: lowercase words separated by `-`.

## Inputs

If user arguments are provided (from `/skill:post-new ...`), treat them as:

1. Title (required)
2. Optional slug override
3. Optional tags (space-separated)

If any required input is missing, ask one concise follow-up question.

## Steps

1. Derive slug:
   - Start from title.
   - Lowercase.
   - Replace spaces/underscores with `-`.
   - Remove non-alphanumeric characters except `-`.
   - Collapse repeated `-`.
2. Determine target file: `content/notes/<slug>.dj`.
3. If file already exists, stop and ask user whether to overwrite or choose another slug.
4. Generate timestamp with local time format `YYYY-MM-DD HH:mm`.
5. Write file with this template:

```djot
---
public: true
rev: 1.0.0
tags: [
  "area:blog"
]
createdAt: "<TIMESTAMP>"
---

# <TITLE>

Write your draft here.
```

6. If extra tags were provided, append them to `tags`.
7. Confirm with:
   - created file path
   - title
   - slug
   - suggested next step: `bun run dev`

## Validation checklist

Before finishing, verify:

- file path is under `content/notes/`
- `.dj` extension is used
- front-matter has opening and closing `---`
- `createdAt` is present
- heading `# <TITLE>` exists
