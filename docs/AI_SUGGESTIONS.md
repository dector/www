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

---

## Current Strengths
- Static prerendered Astro pages (crawl-friendly).
- Clean page structure with headings on content pages.
- RSS feed exists at `/rss.xml`.

## Key Gaps Found
1. No meta descriptions on pages.
2. No canonical URL tags.
3. No Open Graph tags (`og:*`).
4. No Twitter card tags (`twitter:*`).
5. No JSON-LD structured data.
6. No sitemap integration.
7. No `robots.txt`.
8. RSS autodiscovery tag missing in `<head>`.
9. `site` URL depends on env var and can be unset.
10. Homepage has very little indexable descriptive text.

---

## Priority 0 (Do First)

### 1) Add a reusable SEO layer in layout
Implement a shared SEO component or expand `HtmlLayout.astro` props to include:
- `title`
- `description`
- `canonical`
- `robots` (default: `index,follow`)
- Open Graph fields: `og:title`, `og:description`, `og:type`, `og:url`, `og:image`
- Twitter fields: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`

Apply this to all pages:
- `/`
- `/notes/`
- `/notes/[slug]/`
- `/notes/t/[tag]/`

### 2) Add canonical URLs for every page
Use absolute canonicals based on site URL:
- `https://dector.space/`
- `https://dector.space/notes/`
- `https://dector.space/notes/<slug>/`
- `https://dector.space/notes/t/<tag>/`

### 3) Enable sitemap generation
Use `@astrojs/sitemap` and ensure `site` is always configured in `astro.config.mjs` for production.

### 4) Add `robots.txt`
Include crawl policy and sitemap location.

### 5) Add social preview images
- Global fallback OG image (1200×630).
- Optional per-post social image.

---

## Priority 1 (High Value)

### 6) Add JSON-LD structured data
- Site-level: `WebSite` (optionally `Person`/`Organization`).
- Post-level: `BlogPosting` with:
  - headline
  - datePublished
  - dateModified
  - author
  - mainEntityOfPage
  - image
  - keywords (tags)

### 7) Expand post front matter for SEO
Add optional fields in Djot front matter:
- `description`
- `socialImage`
- `canonical` (override only when needed)

### 8) Improve text context on listing pages
- Add short intro copy on homepage and notes index.
- Add tag page intro text (auto-generated from tag).

This improves topical relevance for search engines.

---

## Priority 2 (Polish)

### 9) Add RSS autodiscovery link in `<head>`
```html
<link rel="alternate" type="application/rss+xml" title="Pragmatic Craftsmanship RSS" href="/rss.xml" />
```

### 10) URL consistency
Standardize trailing slash strategy for internal links, canonicals, OG URLs, and sitemap entries.

### 11) Media optimization
For embeds/images in posts:
- responsive wrappers
- lazy-loading where possible
- descriptive surrounding text

### 12) Performance-related SEO support
Consider self-hosting fonts to reduce third-party dependency and improve render performance metrics.

---

## Page-by-Page Checklist

### Homepage (`/`)
- Unique description
- OG/Twitter tags + image
- WebSite JSON-LD
- Add short descriptive paragraph

### Notes Index (`/notes/`)
- Collection description
- Canonical + OG/Twitter
- Optional `ItemList` JSON-LD

### Note Page (`/notes/[slug]/`)
- Per-post description
- Canonical
- `og:type=article`
- `article:published_time`
- `article:modified_time`
- `article:tag` for each tag
- `BlogPosting` JSON-LD

### Tag Page (`/notes/t/[tag]/`)
- Tag-specific description
- Canonical
- Optional `noindex,follow` if taxonomy pages are too thin

### RSS (`/rss.xml`)
- Keep existing generation
- Ensure production absolute URLs always use real site domain

---

## Suggested Implementation Order
1. Site URL hardening in `astro.config.mjs`.
2. Shared SEO props/component in `HtmlLayout.astro`.
3. Canonical + meta descriptions for all pages.
4. OG/Twitter tags + fallback social image.
5. Sitemap + robots.txt.
6. JSON-LD for site and posts.
7. Front matter extensions (`description`, `socialImage`).
8. Content intro improvements on home/index/tag pages.
