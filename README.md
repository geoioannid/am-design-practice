# am-design-practice

Portfolio site for **am design practice** (Angeliki Mathiopoulou) — architecture,
interiors and bespoke furniture. Static, free to host, edited through a browser CMS.
Same stack as `anna-tsoka-architecture`.

- **Site**: [Astro](https://astro.build) → static build → **GitHub Pages**
- **CMS**: [Sveltia CMS](https://github.com/sveltia/sveltia-cms) at `/admin`
  — edits commit to this repository, GitHub Actions rebuilds the site
- **Content**: plain files — `src/content/projects/*.md` (projects),
  `src/content/{home,about,settings}.yml`, images and `.glb` models in
  `src/uploads/` (responsive AVIF/WebP variants are generated at build time)
- **Design**: layout after the Glacier portfolio template (parallax hero,
  filterable grid with hover veils, image-left/details-right project page);
  identity from her Instagram — navy `#1f2650`, the line monogram
  (`src/components/Monogram.astro`, traced as SVG), tracked lowercase Space Mono
  for labels and titles, Source Sans 3 for text.
- **License**: all rights reserved (see `LICENSE`)

> **Mock content.** There is no real project data yet. The projects, about text
> and hero are placeholders built from her Instagram posts (images ~1080px wide —
> real uploads should be ≥2560px). The email `hello@amdesignpractice.com`, the
> LinkedIn and Etsy links (generic site homepages) and the domain
> `amdesignpractice.com` are placeholders too. Because of this, **search engines
> are blocked** (`searchIndexing: false` in `settings.yml`, *Allow search
> engines* in `/admin` → Contact & footer) — every page is `noindex, nofollow`
> and `robots.txt` omits the sitemap. Turn it on when the real content is in. The 3D model on
> *Curved lounge* is the CC0 Khronos sample "SheenChair" (Wayfair).

## Local development

```sh
npm install
npm run dev      # http://localhost:4321 (runs in the background; `npx astro dev stop`)
npm run build    # static build into dist/
```

`/admin/index.html` works locally too: choose **Work with Local Repository** to
edit the files on disk without a GitHub token.

## One-time setup / operations

See **[SETUP.md](./SETUP.md)** for the runbook: repository, Pages, custom domain,
the editor's GitHub token login, analytics, and preparing 3D models.

## How content maps to the site

| Collection (in `/admin`) | File | Renders as |
| --- | --- | --- |
| Projects | `src/content/projects/*.md` | home grid tile (order, category filter, featured = 2×2) + `/projects/<slug>/` |
| Home page | `src/content/home.yml` | 630px parallax hero + intro line |
| About page | `src/content/about.yml` | `/about/` |
| Contact & footer | `src/content/settings.yml` | footer + About contact block (`/about/#contact`, the nav's "contact" link) |

Grid categories are `Architecture`, `Interior`, `Furniture` — defined in
`src/lib/categories.ts` and mirrored in `public/admin/config.yml`; change both
together. Filters only show categories that have projects.

Project pages open with the main image — or, if a `.glb` is attached, an
interactive `<model-viewer>` that uses the main image as its poster (the viewer
script is bundled only into pages that have a model). Below follow ordered
**blocks**: text sections and image sets; within an image set images pair up,
side by side when at least one of a pair is portrait, otherwise full width.

Every uploaded photo is compressed in the browser (WebP, quality 85, longest
side 2560px, EXIF stripped) before it is committed. Models are not touched by
the CMS — they must be compressed before upload; see SETUP.md §9 and
[`docs/research/3d-models-for-web.md`](docs/research/3d-models-for-web.md).
