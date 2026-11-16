import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

/**
 * robots.txt is generated so the Sitemap URL always matches the deployed
 * location: it includes Astro's base path while the site lives at the GitHub
 * Pages project URL and drops it automatically once base becomes '/' at the
 * custom domain. (Pattern from the @astrojs/sitemap docs.)
 *
 * While indexing is switched off (settings.yml → searchIndexing) crawling stays
 * allowed on purpose: a crawler has to fetch a page to see its noindex tag, and
 * a page blocked here can still be listed from links elsewhere. The sitemap
 * is simply not advertised.
 */
export const GET: APIRoute = async ({ site }) => {
  const settings = (await getCollection('settings'))[0]?.data;
  const origin = site ?? new URL('https://amdesignpractice.com');
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const sitemap = new URL(`${base}/sitemap-index.xml`, origin).href;

  const rules = 'User-agent: *\nAllow: /\nDisallow: /admin/\n';
  return new Response(
    settings?.searchIndexing ? `${rules}\nSitemap: ${sitemap}\n` : rules,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
};
