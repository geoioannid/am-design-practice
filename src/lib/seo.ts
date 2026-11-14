/**
 * Search snippets are cut around 150–160 characters; trim long CMS text at a
 * word boundary so the description ends cleanly instead of mid-word.
 */
export function metaDescription(text: string, max = 155): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,;:.—-]+$/, '')}…`;
}

/**
 * Profile URLs for schema.org `sameAs`. A bare site root (e.g. the placeholder
 * https://www.linkedin.com/) identifies nobody, so only links with a path count.
 */
export function profileUrls(links: Array<{ href: string }>): string[] {
  return links
    .map((l) => l.href)
    .filter((href) => {
      try {
        return new URL(href).pathname.replace(/\/$/, '') !== '';
      } catch {
        return false;
      }
    });
}

export const ORG_ID = '#organization';
