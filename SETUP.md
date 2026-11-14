# SETUP.md — one-time runbook

Everything needed to take this repository from a fresh clone to a live site
with a custom domain and a non-technical editor. Do the steps in order.
Whoever holds the main GitHub account (the developer) does steps 1–4 and 7;
the editor (Angeliki) only ever does steps 5, 6 and 9.

The stack: **Astro** (static site) → **GitHub Pages** (free hosting) →
**Sveltia CMS** at `/admin` (edits commit to the repo → the site rebuilds
automatically in ~2 minutes). The only cost anywhere is the domain
registration (~$11/yr).

---

## 1. Create the repository and push this code

1. Create a **public** repository named `am-design-practice` under the
   main GitHub account (public is required for free GitHub Pages).
2. Push this code:
   ```sh
   git init -b main
   git add -A
   git commit -m "Initial site"
   git remote add origin git@github.com:YOUR-USERNAME/am-design-practice.git
   git push -u origin main
   ```
3. Open `public/admin/config.yml` and replace `YOUR-USERNAME` in
   `backend.repo` with the actual GitHub username. Commit and push.

## 2. Enable GitHub Pages

1. Repository → **Settings → Pages**.
2. under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Push to `main` (or re-run the workflow from the **Actions** tab) — the
   first deploy should go green and the site appears at
   `https://YOUR-USERNAME.github.io/am-design-practice/`.

## 3. Custom domain

Buy the domain wherever you like — **Cloudflare Registrar** sells at cost
(~$10.44/yr for a `.com`, no markup, free WHOIS privacy) and you'll want a
free Cloudflare account anyway for analytics (step 7). A Cloudflare-bought
domain must use Cloudflare DNS, which is fine with GitHub Pages.

1. In Cloudflare DNS for the domain, add:
   - **A** records for the apex domain (`@`) to all four:
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`,
     `185.199.111.153`
   - **CNAME** for `www` → `YOUR-USERNAME.github.io`
   - Set both to **DNS only** (grey cloud) — proxying interferes with the
     Let's Encrypt certificate issuance.
2. Repository → **Settings → Pages** → **Custom domain** → enter the apex
   domain (e.g. `amdesignpractice.com`). Wait for the DNS check to pass.
3. Tick **Enforce HTTPS** once the certificate is provisioned (can take up
   to 24 h; usually minutes). GitHub also auto-redirects `www` ↔ apex.
4. No code changes needed. The deploy workflow asks the GitHub Pages API
   where the site is served and configures Astro automatically: until the
   custom domain is set it builds for the `github.io` project URL, and the
   first run after the domain is live builds for it. Setting the domain does
   **not** trigger a build by itself — re-run the workflow once
   (**Actions → Deploy to GitHub Pages → Run workflow**) so the canonical
   URLs, share previews, sitemap and robots.txt all switch to the domain.
5. Re-scrape the social previews: platform caches keep the old image until
   asked again — paste a page URL into the
   [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) and
   Facebook's [Sharing Debugger](https://developers.facebook.com/tools/debug/)
   (Scrape Again), and post a test link to WhatsApp/iMessage.

## 4. Create the editor's GitHub login (for Angeliki)

Sveltia authenticates against GitHub, so Angeliki needs a GitHub account — but
only as a **login credential**. She will never look at the GitHub UI.

1. Create a GitHub account for her, e.g. `amdesignpractice-studio`
   (github.com/signup). Note the password somewhere safe (password manager).
2. Repository → **Settings → Collaborators** → **Add people** → invite the
   account, accept the invitation from her inbox (one time only).

## 5. Editor's first login (Angeliki, once per browser)

1. Open `https://YOUR-DOMAIN/admin` (or the `github.io` URL before the
   domain is set up).
2. Click **Sign In with Token**.
3. In the dialog, use the link to GitHub's token page — it opens with the
   right permissions preselected. Make sure the token settings are:
   - **Fine-grained** token
   - **Repository access → Only select repositories** → `am-design-practice`
   - **Permissions → Contents: Read and write**
   - Expiration: set to **No expiration** (or the longest offered; if it
     ever expires, this step is simply repeated)
4. **Generate token**, copy it, paste it into the Sveltia dialog.
5. Done — the browser remembers the token. On a new device/browser, repeat
   this step. Store the token in a password manager if you want to avoid
   regenerating it.

## 6. Editing content (Angeliki, everyday use)

Open `/admin`, log in if asked. Everything saves straight to the live site
on **Save** — the site rebuilds and is live in ~2 minutes. Nothing can be
permanently lost: every save is a point in history the developer can roll
back.

- **Projects** — one entry per project. **Category** drives the home-page
  filters; **Featured** makes the tile large (2×2 — one or two look best);
  **Order** sets the position (10, 20, 30…). The main image is cropped to a
  4:5 portrait tile on the home page, like Instagram. **Page content** builds
  the project page top-to-bottom from *Text section* and *Image set* blocks;
  in an image set, images pair up side by side when at least one of the two
  is portrait, and go full width otherwise.
- **Home page** — hero title/subtitle, the hero photo (a wide 630px band) and the
  short intro line above the grid.
- **About page** — portrait, heading, bio (blank line = new paragraph) and
  the disciplines list.
- **Contact & footer** — email, Instagram, LinkedIn and Etsy links, city.

Photos: just drop in the full-size camera JPEGs (even HEIC from an iPhone).
They are automatically converted to WebP, resized to max 2560px, and
stripped of EXIF data **before** being committed — the site never stores or
publishes the originals. Keep your originals on your computer.

## 7. Cloudflare Web Analytics (optional, free, cookieless)

1. Cloudflare dashboard → **Web Analytics** → **Add a site** → enter the
   domain → choose **Manual setup** → copy the **token** shown.
2. GitHub repository → **Settings → Secrets and variables → Actions →
   Variables** → **New repository variable**: name
   `PUBLIC_CF_BEACON_TOKEN`, value = the token.
3. Re-run the deploy workflow (Actions tab). The beacon is now on every
   page. Visitor stats appear in Cloudflare within the hour.

## 8. Google Search Console (recommended, free)

Tells Google about the site directly and shows how pages rank.

1. [search.google.com/search-console](https://search.google.com/search-console)
   → **Add property** → **Domain** → enter `amdesignpractice.com`.
2. Verify via DNS: choose **Cloudflare DNS** provider in the dialog and add
   the single TXT record it shows (Cloudflare dashboard → DNS). Verification
   usually completes in minutes.
3. Left sidebar → **Sitemaps** → submit `sitemap-index.xml`.

## 9. Uploading 3D models (Angeliki)

A project can open with a model visitors can rotate instead of a photo. The
**Main image** stays important: it is shown while the model loads, on devices
without 3D support, and as the home-page tile — so use a good render or a
screenshot of the model from the same angle. Full background and sources:
[`docs/research/3d-models-for-web.md`](docs/research/3d-models-for-web.md).

**Targets:** under **2 MB** (3 MB max; the CMS refuses over 8 MB), roughly
50k–150k triangles, textures no larger than 2048px.

From Rhino 8:

1. Work on a copy. Delete or hide construction lines, 2D linework,
   dimensions, site context and hidden internal parts.
2. Give parts simple materials (fewer than ~10) or rely on display colours.
3. *File ▸ Properties ▸ Mesh* → **Jagged and faster**; if curves look
   faceted, use *Custom* and raise *Density* slightly. Tick *Simple planes*.
4. Select the objects → *File ▸ Export Selected* → **glTF Binary (.glb)**,
   short lowercase name with hyphens (`oak-sideboard.glb`).
5. Export options: ✅ Map Rhino Z to glTF Y · ✅ Export materials ·
   ✅ Use display color for objects with no material · ✅ **Use Draco
   compression**. Units become metres automatically.
6. Check the size. Too big → coarser mesh setting and re-export, or ask the
   developer to run the compression below.
7. Preview: drag the file into <https://modelviewer.dev/editor/>, check it is
   the right way up, and use **POSTER** there to download a still for the
   Main image if you have no render.
8. In `/admin`: upload the `.glb` in **3D model**, write one sentence in
   **3D model description** ("Oak sideboard with three doors"), Save.

SketchUp: *File ▸ Export ▸ 3D Model ▸ glTF Binary* (no Draco option — run the
command below). Fusion 360 has no glTF export: export FBX/OBJ, import into
Blender (check scale — Fusion's OBJ is in centimetres) and export glTF Binary
with Draco from there.

**Developer: compressing a model** (Draco geometry, WebP textures):

```sh
npx @gltf-transform/cli inspect model.glb
npx @gltf-transform/cli optimize model.glb model-web.glb \
  --compress draco --texture-compress webp --texture-size 2048
# still too big: add  --texture-size 1024 --simplify-error 0.001
```

## Troubleshooting

- **Save in /admin fails with "Resource not accessible by personal access
  token"** — the token lost or never had Contents write permission.
  Regenerate per step 5.
- **Site didn't update after a save** — check the **Actions** tab: the
  latest *Deploy to GitHub Pages* run shows the error (usually a content
  typo, e.g. a missing required field).
- **Custom domain shows GitHub's 404** — DNS records wrong or still
  propagating (can take up to a few hours); verify with
  `dig +short amdesignpractice.com` — it must answer with the four `185.199.x.153`
  addresses.
- **Images look huge in the repo** — they shouldn't: uploads are compressed
  in the browser. If someone bypassed the CMS and committed originals,
  replace the file via the CMS (delete + re-upload).
- **3D model upload fails or is refused** — the file is over the 8 MB limit,
  or the connection dropped during the single upload request. Compress it
  (§9) and try again.
- **Locked out / broken site** — everything is in git. From the repository,
  any previous commit can be restored (ask the developer).
