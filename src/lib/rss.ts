type RssPost = {
  slug: string;
  title: string;
  createdAt: string;
  updatedAt: string | null;
  html?: string;
};

type GenerateNotesRssParams = {
  posts: RssPost[];
  site: URL;
  title: string;
  description: string;
};

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function normalizeDateSource(rawValue: string): Date {
  const trimmed = rawValue.trim();
  const dateTimeMatch = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/,
  );

  if (dateTimeMatch) {
    const [, year, month, day, hour = "00", minute = "00", second = "00"] =
      dateTimeMatch;

    return new Date(
      Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second),
      ),
    );
  }

  const fallback = new Date(trimmed);
  if (!Number.isNaN(fallback.valueOf())) {
    return fallback;
  }

  throw new Error(`Could not parse date value: ${rawValue}`);
}

function toRssDate(rawValue: string): string {
  return normalizeDateSource(rawValue).toUTCString();
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function getItemDescription(post: RssPost): string {
  if (!post.html) {
    return "";
  }

  const plainText = stripHtml(post.html);
  const maxLength = 240;

  if (plainText.length <= maxLength) {
    return plainText;
  }

  return `${plainText.slice(0, maxLength - 1).trimEnd()}…`;
}

export function generateNotesRss({
  posts,
  site,
  title,
  description,
}: GenerateNotesRssParams): string {
  const rssUrl = new URL("/rss.xml", site).href;
  const notesUrl = new URL("/notes/", site).href;

  const latestDateRaw = posts.reduce<string | null>((latest, post) => {
    const candidate = post.updatedAt ?? post.createdAt;
    if (!latest) {
      return candidate;
    }

    return normalizeDateSource(candidate) > normalizeDateSource(latest)
      ? candidate
      : latest;
  }, null);

  const lastBuildDate = latestDateRaw
    ? toRssDate(latestDateRaw)
    : new Date().toUTCString();

  const itemsXml = posts
    .map((post) => {
      const postUrl = new URL(`/notes/${post.slug}/`, site).href;
      const pubDate = toRssDate(post.updatedAt ?? post.createdAt);
      const itemDescription = getItemDescription(post);

      return `\n    <item>\n      <title>${escapeXml(post.title)}</title>\n      <link>${escapeXml(postUrl)}</link>\n      <guid isPermaLink="true">${escapeXml(postUrl)}</guid>\n      <pubDate>${pubDate}</pubDate>\n      <description>${escapeXml(itemDescription)}</description>\n    </item>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${escapeXml(notesUrl)}</link>
    <description>${escapeXml(description)}</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeXml(rssUrl)}" rel="self" type="application/rss+xml" />${itemsXml}
  </channel>
</rss>
`;
}
