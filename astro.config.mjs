// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// CI sets SITE_URL from the GitHub Pages API (see .github/workflows/deploy.yml):
// it is the github.io project URL until a custom domain is configured in
// Settings → Pages, and the custom domain afterwards. The base path derives
// from the URL's path, so the domain migration needs no config change — just
// re-run the deploy workflow. Local builds without SITE_URL target the root
// (no base path).
const deployed = new URL(process.env.SITE_URL ?? 'https://amdesignpractice.com');

export default defineConfig({
  site: deployed.origin,
  base: deployed.pathname.replace(/\/$/, '') || '/',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/admin'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    build: {
      // <model-viewer> (with three.js) is a ~1MB chunk by design; it is only
      // loaded on project pages that have a 3D model.
      chunkSizeWarningLimit: 1200,
    },
  },
});
