import type { APIRoute } from "astro";
import { G } from "../lib/globals.js";
import { getPublicNotesPosts } from "../lib/notes.js";
import { generateNotesRss } from "../lib/rss";

// In dev, this endpoint is generated on demand.
// In production builds, Astro pre-renders it into /dist/rss.xml.
export const prerender = true;

export const GET: APIRoute = async ({ site, url }) => {
  const posts = await getPublicNotesPosts();

  const xml = generateNotesRss({
    posts,
    site: site ?? url,
    title: `${G.BlogTitle} — Notes`,
    description: G.BlogDescription,
  });

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600",
    },
  });
};
