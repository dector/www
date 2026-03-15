# SEO & Social Graph Improvement Suggestions

## Scope Reviewed
- `src/layouts/HtmlLayout.astro`
- `src/layouts/PostLayout.astro`
- `src/pages/index.astro`
- `src/pages/notes/index.astro`
- `src/pages/notes/[slug].astro`
- `src/pages/notes/t/[tag].astro`
- `src/pages/rss.xml.ts`
- `astro.config.mjs`
- `public/robots.txt`

---

## Already Implemented (Removed from backlog)
- Reusable SEO layer in layout (`title`, `description`, `canonical`, `robots`, OG/Twitter tags).
- Canonical URLs applied on main pages (`/`, `/notes/`, `/notes/[slug]/`, `/notes/t/[tag]/`).
- Sitemap integration enabled via `@astrojs/sitemap`.
- `robots.txt` exists with sitemap reference.
- Global fallback social image exists (`/social-card.svg`).
- RSS autodiscovery tag exists in `<head>`.
- Production site URL has a safe default in `astro.config.mjs`.

---

## Remaining Backlog

### 1) Add JSON-LD structured data
- Site-level: `WebSite`.
- Post-level: `BlogPosting` with:
  - `headline`
  - `datePublished`
  - `dateModified`
  - `author`
  - `mainEntityOfPage`
  - `image`
  - `keywords`

### 2) Add per-post SEO front matter support
Add optional Djot front matter fields and wire them into rendering:
- `description`
- `socialImage`
- `canonical` (override only when needed)

### 3) Improve content context on listing pages
- Add short descriptive intro copy to homepage and notes index.
- Add tag intro text (auto-generated from tag).

### 4) Ensure social metadata is post-specific when available
- Pass per-post `socialImage` into post pages.
- Use front matter `description` when present; keep excerpt fallback.

### 5) Performance polish that supports SEO
- Consider self-hosting fonts to reduce third-party dependency and improve render metrics.

---

## Next 5 Improvements (Most Critical First)
1. **Implement JSON-LD (`WebSite` + `BlogPosting`)** for stronger rich-result eligibility.
2. **Support post front matter SEO fields** (`description`, `socialImage`, `canonical`) and use them in `[slug].astro`.
3. **Wire per-post social image and description precedence** (front matter first, generated fallback second).
4. **Add meaningful intro copy on home/notes/tag pages** to improve topical relevance and thin-page quality.
5. **Self-host Google font(s)** to improve performance-related SEO signals (LCP/CLS resilience).
