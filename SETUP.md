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
- **Contact & footer** — email, Instagram, LinkedIn and Etsy links, city,
  and **Allow search engines** (off until the site is ready to be found).

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

There are two versions of the Rhino 8 steps below: a **short checklist** for
when you've done it before, and a **detailed walkthrough** for the first time
or when something goes wrong. They describe the same process.

Angeliki sees the same guide inside the CMS: the **How to upload a 3D model
from Rhino →** link under the *3D model* field opens it in a dialog, with
*Quick checklist* and *Step by step* tabs. Its text is in
`public/admin/3d-model-guide.html` — when you change one, change the other.

### 9a. Short version (checklist)

1. **Copy the file**, then delete everything visitors shouldn't see: lines,
   dimensions, site context, hidden internal parts.
2. **Simple materials** (under ~10), or just display colours.
3. **Mesh settings:** *File ▸ Properties ▸ Mesh* → **Jagged and faster**,
   tick **Simple planes**.
4. **Export:** select the objects → *File ▸ Export Selected* → **glTF Binary
   (.glb)**, name like `oak-sideboard.glb`.
5. **Export options:** ✅ Map Rhino Z to glTF Y · ✅ Export materials ·
   ✅ Use display color… · ✅ **Use Draco compression**.
6. **Size check:** under 2 MB is ideal, 3 MB at most. Too big → see 9b, step 7.
7. **Main image:** have a render or screenshot from the angle you'll use.
8. **In `/admin`** → the project → upload the `.glb` in **3D model** → one
   sentence in **3D model description**.
9. **Starting angle:** turn the model in the preview → **Copy** → paste into
   **3D model starting angle** (or leave empty) → **Save**.
10. **Check the live page** in ~2 minutes.

### 9b. Detailed version (walkthrough)

**Before you start.** Work on a **copy** of the Rhino file (*File ▸ Save
As…*, e.g. `oak-sideboard-web.3dm`), so nothing you delete for the web is
lost from the real project.

**1. Clean up the model.** Everything in the file can end up in the export,
and every hidden part makes it heavier. Delete or hide:
- construction lines, curves, 2D linework, dimensions, text and hatches;
- site context, floors, walls or people that aren't part of the piece;
- internal parts nobody will ever see (screws, dowels, hidden joinery),
  unless they matter to the design.

A 3D model of a chair should be only the chair. The site adds a soft shadow
underneath, so you don't need a floor.

**2. Keep materials simple.** The web viewer understands colour, roughness
and metal, not Rhino's full render materials. Either:
- give each part a simple material (a wood, a fabric, a metal — fewer than
  about 10 in total), or
- skip materials and just set each object's **display colour**; the export
  turns it into a plain material.

Image textures (wood grain photos etc.) work but add size; keep them at
2048px or smaller.

**3. Set how detailed the mesh is.** Rhino turns surfaces into triangles
when it exports, and these settings decide how many:
1. *File ▸ Properties ▸ **Mesh***.
2. Choose **Jagged and faster**.
3. Tick **Simple planes** (flat faces get as few triangles as possible).
4. If curved edges later look faceted (step 6), come back, choose
   **Custom** and move **Density** up a little. Small steps — each one can
   double the file size.

To see the count, select the objects and run the **PolygonCount** command.
Aim for about 50,000–150,000.

**4. Export.**
1. Select only the objects that make up the piece.
2. *File ▸ **Export Selected***.
3. File type: **glTF Binary (\*.glb)**.
4. Name it with lowercase letters and hyphens, no spaces:
   `oak-sideboard.glb`, `curved-lounge.glb`.

**5. Export options.** In the dialog that appears, make sure these are on:
- ✅ **Map Rhino Z to glTF Y** — keeps the model the right way up.
- ✅ **Export materials**
- ✅ **Use display color for objects with no material set**
- ✅ **Use Draco compression** — off by default; this is the one that
  shrinks the file the most. Leave its level and the numbers below it as
  they are.

Units don't matter: the export converts them to metres automatically.

**6. Check the file.**
- **Size:** in Finder, select the file and press ⌘I (*Get Info*). Under
  2 MB is ideal, up to 3 MB is fine, the CMS refuses anything over 8 MB.
- **Look:** drag the file into <https://modelviewer.dev/editor/>. Check it is
  the right way up, the colours look right and curves aren't faceted.

**7. If it's too big**, try in this order:
1. Go back to step 1 — something hidden is often still in there.
2. Step 3 — make sure it's **Jagged and faster**, or lower **Density**.
3. For objects that are already meshes, Rhino's **ReduceMesh** command
   cuts their triangle count (try 50%).
4. Shrink image textures to 1024px.
5. Still too big: send the `.glb` to the developer, who can compress it
   further (the command below).

**8. Prepare the Main image.** It is shown while the model loads, on phones
without 3D support, and as the home-page tile — so it should look like the
model from the angle you'll choose in step 10. A Rhino render works, or a
viewport capture (*ViewCaptureToFile*). No render? In the
modelviewer.dev editor, turn the model to a nice angle and click
**POSTER** to download a still.

**9. Upload in `/admin`.**
1. Open `/admin` → **Projects** → the project (or **New Project**).
2. Set the **Main image** (step 8) if it isn't there yet.
3. **3D model (optional)** → **Browse** → **Upload** → choose the `.glb` →
   **Insert**.
4. **3D model description**: one sentence describing the object for
   visitors who use screen readers, e.g. *"Oak sideboard with three
   doors and turned legs"*.

**10. Choose the starting angle.** The **Preview** pane on the right shows
the model as visitors will see it.
1. Drag to turn it, scroll to zoom, until it shows the view you want people
   to see first.
2. Click **Copy** under the model (if nothing is copied, the value is
   highlighted — press ⌘C).
3. Click into **3D model starting angle** and paste (⌘V). The preview jumps
   to that view, so you can check it. **Reset** goes back to the saved angle.

Leave the field empty and visitors get a front three-quarter view.

**11. Save and check.** Click **Save**. The site rebuilds and the page is
live in about 2 minutes. Open it on your phone too: the main image should
appear first, then the model fades in.

**Common problems**
- *Upside down or lying on its side:* re-export with **Map Rhino Z to
  glTF Y** ticked.
- *Everything is grey or white:* materials didn't come through — tick
  **Export materials** and **Use display color…**, or switch the parts to
  simple materials / display colours.
- *Curves look faceted:* raise **Density** slightly in step 3.
- *Upload fails or is refused:* the file is over 8 MB, or the connection
  dropped during upload. Make it smaller (step 7) and try again.
- *The model looks tiny or huge in the preview:* that's fine — the viewer
  frames it automatically. Only the starting angle's zoom is affected;
  set it again in step 10.

### Other programs and compression

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
  (§9b, step 7) and try again.
- **Locked out / broken site** — everything is in git. From the repository,
  any previous commit can be restored (ask the developer).
