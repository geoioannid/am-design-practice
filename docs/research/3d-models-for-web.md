# Research: Preparing Rhino / CAD models for the web (`.glb` + `<model-viewer>`)

**Date:** 2026-11-14 · Primary-source research. Every claim links to the source that owns it
(official docs, source code on GitHub, or the Khronos spec/registry). Claims that are my own
judgment are marked **[judgment]**; things I measured myself are marked **[measured]**; claims I
could not confirm in a primary source are marked **[unverified]**.

**Repo state this is grounded against** (paths in this repo, read-only):

- `package.json` — `@google/model-viewer ^4.4.0` (installed: 4.4.0), `three` resolved to 0.183.2, `astro ^7.3.5`, `sharp`.
- `astro.config.mjs` — static site; `site`/`base` derived from `SITE_URL` (GitHub Pages project URL until a custom domain is set).
- `src/components/ModelViewer.astro` — already renders `<model-viewer>` with `poster`, `alt`, `loading="eager"`, `camera-controls`, `auto-rotate`, `environment-image="neutral"`, `shadow-intensity`, imports `@google/model-viewer` in a processed `<script>`, and removes `auto-rotate` under `prefers-reduced-motion: reduce`.
- `src/content.config.ts` — optional `model` string field (public URL path).
- `src/uploads/sheen-chair.glb` — 4.13 MB sample model (used for the test run in §6).
- `public/admin/index.html` — Sveltia CMS 0.227.2 from unpkg (note: its `<title>` still says "Anna Tsoka Architecture").

Versions checked today: `@google/model-viewer` latest = **4.4.0** (published 2026-10-09), peer dep `three ^0.183.0`; `@gltf-transform/cli` latest = **4.5.1** (published 2026-09-28), requires Node ≥ 20.
Sources: <https://registry.npmjs.org/@google/model-viewer> · <https://registry.npmjs.org/@gltf-transform/cli>

---

## 1. What glTF expects (applies to every export path)

- glTF is right-handed, **+Y up**, front faces +Z, and "**The units for all linear distances are meters.**"
  Source: [glTF 2.0 spec, Coordinate System and Units](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#coordinate-system-and-units) ([Specification.adoc](https://github.com/KhronosGroup/glTF/blob/main/specification/2.0/Specification.adoc))
- Materials are PBR **metallic-roughness**.
  Source: [glTF 2.0 spec, Materials](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#materials)
- `<model-viewer>` `src`: "Only glTF/GLB models are supported."
  Source: [model-viewer docs data (`docs.json`)](https://github.com/google/model-viewer/blob/master/packages/modelviewer.dev/data/docs.json) → rendered at <https://modelviewer.dev/docs/>

Rhino models are Z-up and usually in mm, so both an axis flip and a unit conversion are needed. As shown below, Rhino's exporter does both.

## 2. Export paths to glTF/GLB

### 2.1 Rhino 8 (native exporter) — the recommended path

Rhino 8 ships a glTF/GLB exporter (File ▸ Export / Export Selected ▸ `.glb`). Documented options
([Rhino 8 help: GL Transmission Format Import/Export](https://docs.mcneel.com/rhino/8/help/en-us/fileio/gltf_import_export.htm)):

| Option | What it does (per McNeel) | Default (from exporter source) |
|---|---|---|
| **Map Rhino Z to glTF Y** | Rotates the model −90° about X so "up" is preserved | `true` |
| Export materials | Converts materials to PBR | `true` |
| Use display color for objects with no material set | Display color becomes material color | `true` |
| Cull backfaces | Back faces not rendered | `true` |
| Export layers | Keeps layer info | — |
| Export texture coordinates / vertex normals | — | `true` / `true` |
| Export open meshes | Exports open as well as closed objects | `true` |
| Export vertex colors | — | `false` |
| SubD meshing | "Use control net" or subdivision level | Surface, level 4 |
| **Use Draco compression** | Open-source geometry compression | `false` |
| Draco compression level | 1–10 | 10 |
| Draco quantization bits | Position / Normal / Texture | 11 / 8 / … |

Defaults are read from the exporter source, [`Export_glTFPlugin.cs` (mcneel/glTF-IO, branch `rhino-8.x`)](https://github.com/mcneel/glTF-IO/blob/rhino-8.x/glTF-BinExporter/Export_glTFPlugin.cs).

- **Units are converted to metres automatically.** The exporter computes `RhinoMath.UnitScale(doc.ModelUnitSystem, UnitSystem.Meters)` with the comment "glTF is in meters".
  Source: [`RhinoDocGltfConverter.cs` L125–128](https://github.com/mcneel/glTF-IO/blob/rhino-8.x/glTF-BinExporter/RhinoDocGltfConverter.cs)
- **Tessellation density comes from Rhino's render mesh settings.** The exporter takes `Object.GetRenderMeshParameters()` and the `MeshType.Render` meshes. It creates them if they are missing.
  Source: [`RhinoDocGltfConverter.cs` ~L506–564](https://github.com/mcneel/glTF-IO/blob/rhino-8.x/glTF-BinExporter/RhinoDocGltfConverter.cs). In practice, the polygon count is set by **Document Properties ▸ Mesh** (presets "Jagged and faster" / "Smooth and slower" / Custom). Custom has a density slider and detailed controls: *Density*, *Maximum angle*, *Maximum aspect ratio*, *Min/Max edge length*, *Maximum distance, edge to surface*, *Minimum initial grid quads*, *Refine mesh*, *Jagged seams*, *Simple planes* ("Planar surfaces are meshed with as few polygons as possible").
  Source: [Rhino 8 help: Polygon mesh settings](https://docs.mcneel.com/rhino/8/help/en-us/information/polygonmeshsettings.htm)
- **Reducing an existing mesh in Rhino:** `ReduceMesh` "decreases the polygon mesh face count while minimizing geometric and texture distortion". Options: reduce to N polygons or by a percentage, Accuracy 1 (fast) to 10 (accurate), and "Planar only".
  Source: [Rhino 8 help: ReduceMesh](https://docs.mcneel.com/rhino/8/help/en-us/commands/reducemesh.htm)

**[judgment]** For furniture and interiors, start from the "Jagged and faster" preset and turn on *Simple planes*. Raise density only where curved edges look faceted. Use *Export Selected* so hidden construction geometry, 2D curves and site context stay out of the file.

### 2.2 SketchUp

- Export: **File ▸ Export ▸ 3D Model**, then choose **GLTF Binary File (\*.glb)**. The help page documents no export-options dialog (no Draco or axis settings). The writer "supports PNG, JPG, JPEG, and JPE formats" and tries to convert other formats to PNG.
  Source: [SketchUp Help: Working with glTF files](https://help.sketchup.com/en/sketchup/working-gltf-files)
- SketchUp 2025.0 release notes: "SketchUp now supports importing and exporting materials using [USD or GLB]" for PBR materials.
  Source: [SketchUp Desktop 2025.0 release notes](https://help.sketchup.com/en/release-notes/sketchup-desktop-20250)
- The documentation does not say which SketchUp version first added GLB export. **[unverified]**

### 2.3 Fusion (Fusion 360)

- Fusion has **no native glTF/GLB export**. File ▸ Export offers f3d/f3z, 3MF, IPT/IAM, DWG, DXF, **FBX**, IGES, SVF, **OBJ**, SAT, SKP, SMT, SPD, STEP, STL and **USDZ**.
  Sources: [Fusion: Export designs](https://help.autodesk.com/cloudhelp/ENU/Fusion-Designs/files/ASM-EXPORT-DESIGN.htm) · [Fusion: Supported file formats](https://help.autodesk.com/cloudhelp/ENU/Fusion-Designs/files/TPD-SUPPORTED-FILE-FORMATS.htm)
- Mesh density on OBJ export is set by a *mesh refinement* setting (default Medium). It is defined by surface deviation, normal deviation, maximum edge length and aspect ratio. OBJ units default to **centimetres**.
  Source: [Fusion API: OBJExportOptions](https://help.autodesk.com/cloudhelp/ENU/Fusion-360-API/files/fusion_OBJExportOptions.htm)
- **Route:** export FBX or OBJ from Fusion, import it into Blender, then export GLB (§2.4). Check the scale after import, because Fusion's OBJ is in cm. Third-party Fusion glTF exporters exist but were not evaluated.

### 2.4 Blender (glTF 2.0 add-on, enabled by default) — the "fix-up" station

From the [Blender 5.3 Manual: glTF 2.0](https://docs.blender.org/manual/en/latest/addons/scene_gltf2.html):

- **Format:** *glTF Binary (.glb)* "produces a single .glb file with all mesh data, image textures, and related information packed into a single binary file". Use this format for the CMS.
- **Include:** *Selected Objects*, *Visible Objects*, *Renderable Objects*, *Active Collection*.
- **Transform:** *Y Up*: "Export using glTF convention, +Y up."
- **Data ▸ Mesh:** *Apply Modifiers*: "Export objects using the evaluated mesh, meaning the resulting mesh after all Modifiers have been calculated". You need this for a Decimate modifier to take effect.
- **Data ▸ Material ▸ Images:** "PNG is lossless and generally preferred, but JPEG might be preferable for web applications due to the smaller file size. If WebP is chosen, all textures will be saved as WebP, without any png/jpg fallback". *Image Quality* applies to JPEG/WebP.
- **Data ▸ Draco Compression:** "Compress meshes using Google Draco". *Compression Level*: "Higher compression results in slower encoding and decoding". *Quantization* is set per attribute (Position, Normal, Texture Coordinates, Color, Generic).
- Materials are read from the **Principled BSDF** node (Base Color, Metallic, Roughness, …).
- **Decimate modifier** (Collapse mode, *Ratio*): "reduce the vertex/face count of a mesh with minimal shape changes". Ratio 0.5 leaves about half the faces. The ratio is computed on triangles.
  Source: [Blender Manual: Decimate Modifier](https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/decimate.html)

**When to route through Blender [judgment]:**
1. The source is Fusion (no GLB export).
2. Rhino or SketchUp materials come out wrong (for example, textures not mapped, or everything grey).
3. You want visual, per-object decimation, or want to bake lighting, AO or materials into textures.
4. You need to merge or clean up a scene, for example by deleting hidden internal parts, applying transforms or setting the origin.

For a plain Rhino model with simple materials, Rhino's own exporter plus gltf-transform is enough.

## 3. Mesh decimation / simplification

| Tool | How | Source |
|---|---|---|
| Rhino | Coarser render-mesh settings before export; `ReduceMesh` on mesh objects | [Polygon mesh settings](https://docs.mcneel.com/rhino/8/help/en-us/information/polygonmeshsettings.htm), [ReduceMesh](https://docs.mcneel.com/rhino/8/help/en-us/commands/reducemesh.htm) |
| Blender | Decimate modifier (Collapse, Ratio) + *Apply Modifiers* on export | [Decimate](https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/decimate.html) |
| gltf-transform | `simplify` command, or the `--simplify` step inside `optimize` (meshoptimizer) | [`cli.ts`](https://github.com/donmccurdy/glTF-Transform/blob/main/packages/cli/src/cli.ts) |

The gltf-transform `simplify` help text says: "The algorithm aims to reach the target --ratio, while minimizing error. If error exceeds the specified --error threshold, the algorithm will quit before reaching the target ratio". Its examples are:

- `ratio=0.5, error=0.001`: 50% simplification, with error constrained to 0.1%
- `ratio=0.0, error=0.01`: maximum simplification, with error constrained to 1%

The help also says "For best results, apply a 'weld' operation before simplification."

Defaults (`SIMPLIFY_DEFAULTS`): **ratio 0.0, error 0.0001, lockBorder false**. In other words, the default simplifies as far as it can while staying within 0.01% error. That is conservative.
Sources: [`cli.ts` simplify command](https://github.com/donmccurdy/glTF-Transform/blob/main/packages/cli/src/cli.ts) · [`functions/src/simplify.ts`](https://github.com/donmccurdy/glTF-Transform/blob/main/packages/functions/src/simplify.ts)

## 4. Geometry compression: Draco vs Meshopt

| | Draco (`KHR_draco_mesh_compression`) | Meshopt (`EXT_meshopt_compression`) |
|---|---|---|
| What it compresses | "only geometry data — animation and textures are not compressed"; triangle meshes only | "geometry, morph targets, and animation" (points, lines, triangles) |
| Decode | WASM decoder | "decodes very quickly"; "best used in combination with a lossless compression method like brotli or gzip" |
| `<model-viewer>` | **Supported out of the box.** The decoder is loaded on demand from a Google CDN | **"By default, the Meshopt decoder is not enabled."** You must set `meshoptDecoderLocation` |
| Who exports it | Rhino 8 (checkbox), Blender, gltf-transform `--compress draco` | gltf-transform (default in `optimize`), gltfpack |

Sources: [`cli.ts` draco/meshopt help](https://github.com/donmccurdy/glTF-Transform/blob/main/packages/cli/src/cli.ts) · [model-viewer docs (Static Properties)](https://modelviewer.dev/docs/#entrydocs-loading-staticProperties) · [model-viewer loading examples](https://modelviewer.dev/examples/loading/) · [KHR_draco_mesh_compression](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_draco_mesh_compression/README.md) · [EXT_meshopt_compression](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Vendor/EXT_meshopt_compression/README.md)

The glTF Transform docs say: "While Meshopt decoding is considerably faster than Draco decoding, neither compression method will improve runtime performance directly", and "For the full benefits of meshopt compression, apply gzip, brotli, or another lossless compression method".
Source: [gltf-transform: EXTMeshoptCompression](https://gltf-transform.dev/modules/extensions/classes/EXTMeshoptCompression)

**How `<model-viewer>` loads decoders** (source: [`features/loading.ts`](https://github.com/google/model-viewer/blob/master/packages/model-viewer/src/features/loading.ts), [`three-components/CachingGLTFLoader.ts`](https://github.com/google/model-viewer/blob/master/packages/model-viewer/src/three-components/CachingGLTFLoader.ts)):

- Draco default: `https://www.gstatic.com/draco/versioned/decoders/1.5.6/`. It is fetched only when a Draco file is encountered.
- KTX2 (Basis) transcoder default: `https://www.gstatic.com/basis-universal/versioned/1.50.0-three-r183/`.
- Meshopt: no default. The documented example is:

  ```html
  <script>
    self.ModelViewerElement = self.ModelViewerElement || {};
    self.ModelViewerElement.meshoptDecoderLocation = 'https://cdn.jsdelivr.net/npm/meshoptimizer/meshopt_decoder.js';
  </script>
  ```

  It must be set "**before** the first <model-viewer> element is created" ([loading examples](https://modelviewer.dev/examples/loading/)). The same `self.ModelViewerElement.dracoDecoderLocation` / `ktx2TranscoderLocation` pattern can self-host the other decoders.
- **[measured]** The unversioned jsDelivr URL above currently resolves to **meshoptimizer 0.25.0**. Version 1.3.0 (latest) no longer ships `meshopt_decoder.js`, and `meshoptimizer@1.3.0/meshopt_decoder.js` returns 404. In model-viewer's source, the URL is only loaded as a `<script>` gate (`fetchScript(url).then(() => MeshoptDecoder.ready)`), and the decoder actually used is the one bundled from three.js. If you use Meshopt, pin it: `https://cdn.jsdelivr.net/npm/meshoptimizer@0.25.0/meshopt_decoder.js` (200 OK today).
- **[measured]** GitHub Pages serves `.glb` as `content-type: model/gltf-binary` with `content-encoding: gzip` and `cache-control: max-age=600`. This was checked on `https://modelviewer.dev/shared-assets/models/Astronaut.glb`, which is served by `server: GitHub.com`. So Meshopt's "pair with gzip" advice is met automatically on Pages. GitHub does not document this behaviour.

**Recommendation for this site [judgment]: Draco.** It needs zero configuration in `<model-viewer>`, Rhino can write it directly (so a designer-only path works), and in the test in §6 it produced the smaller file. Meshopt is a fine alternative if the developer adds the one-line decoder config.

## 5. Textures: WebP vs KTX2, and sizes

- `EXT_texture_webp`: WebP is "typically 26% smaller in size compared to PNGs and 25-34% smaller than comparable JPEG images".
  Source: [EXT_texture_webp README](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Vendor/EXT_texture_webp/README.md)
- `KHR_texture_basisu` (KTX2) offers "more efficient asset transmission and reducing GPU memory footprint". Engines transcode it to a GPU block-compressed format at runtime.
  Source: [KHR_texture_basisu README](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_texture_basisu/README.md)
- gltf-transform states the trade-off as "**KTX2 optimizes VRAM usage and performance; AVIF and WebP optimize transmission size.**" KTX2 output needs **KTX-Software** installed locally. Its help text also says "GPU texture formats require more attention to compression settings to get similar visual results."
  Source: [`cli.ts`](https://github.com/donmccurdy/glTF-Transform/blob/main/packages/cli/src/cli.ts)
- The three.js `GLTFLoader` bundled by model-viewer (three r183) lists `EXT_texture_webp`, `KHR_texture_basisu`, `KHR_draco_mesh_compression`, `EXT_meshopt_compression`, `KHR_meshopt_compression` and `KHR_mesh_quantization` among its supported extensions.
  Source: [three.js r183 `GLTFLoader.js` header](https://github.com/mrdoob/three.js/blob/r183/examples/jsm/loaders/GLTFLoader.js)
- **Size guidance:** Google Scene Viewer gives "Maximum texture resolution: 2048 × 2048" ([Scene Viewer docs](https://developers.google.com/ar/develop/scene-viewer)). Khronos 3D Commerce gives "2K" for single-item web/AR views and "1K" for lighter targets ([3DC Publishing Targets v1.0](https://github.com/KhronosGroup/3DC-Asset-Creation/blob/main/asset-creation-guidelines-1.0/full-version/sec99_PublishingTargets/PublishingTargets.md)). gltf-transform's `optimize` defaults to `--texture-size 2048`.

**Recommendation [judgment]: WebP, max 2048 px** (use 1024 for small objects or flat-colour materials). Most Rhino architecture and furniture models have few or no image textures, so geometry dominates the file size. KTX2 matters only for texture-heavy scenes where GPU memory is the constraint. It also adds a native tool dependency and tuning work.

## 6. gltf-transform CLI — exact commands

Install / run (Node ≥ 20). The package's binary is `gltf-transform`, so `npx` works with no global install:

```sh
npx @gltf-transform/cli --help
# or: npm install --global @gltf-transform/cli
```

Source: [gltf-transform.dev/cli](https://gltf-transform.dev/cli) · [npm package `bin`](https://registry.npmjs.org/@gltf-transform/cli/latest)

**`optimize` flags and defaults** (from the source, [`cli.ts` `optimize`](https://github.com/donmccurdy/glTF-Transform/blob/main/packages/cli/src/cli.ts)):

| Flag | Default | Notes |
|---|---|---|
| `--compress <draco\|meshopt\|quantize\|false>` | `meshopt` | Applied last |
| `--texture-compress <ktx2\|webp\|avif\|auto\|false>` | `auto` | `auto` re-compresses in the original format |
| `--texture-size <px>` | `2048` | Max dimension |
| `--simplify <bool>` / `--simplify-ratio` / `--simplify-error` / `--simplify-lock-border` | `true` / `0` / `0.0001` / `false` | meshoptimizer simplifier |
| `--weld <bool>` | `true` | "Required when simplifying geometry"; Draco forces it on |
| `--flatten` / `--join` / `--join-meshes` / `--join-named` | `true` / `true` / … | Fewer draw calls |
| `--instance` / `--palette` / `--prune` / `--sparse` / `--resample` | `true` | — |
| `--meshopt-level <medium\|high>` | `high` | — |

Pipeline order: dedup → instance → palette → flatten → join → weld → simplify → resample → prune → sparse → texture compression → mesh compression.

**Recommended command for this site:**

```sh
npx @gltf-transform/cli optimize input.glb output.glb \
  --compress draco --texture-compress webp --texture-size 2048
```

If the result is still too heavy, simplify harder. Accepting 0.1% error usually stays invisible at portfolio viewing distances **[judgment]**:

```sh
npx @gltf-transform/cli optimize input.glb output.glb \
  --compress draco --texture-compress webp --texture-size 1024 --simplify-error 0.001
```

Meshopt variant (requires `meshoptDecoderLocation`, see §4):

```sh
npx @gltf-transform/cli optimize input.glb output.glb --compress meshopt --texture-compress webp
```

Check a file before and after (triangle and vertex counts, textures, extensions):

```sh
npx @gltf-transform/cli inspect output.glb
```

Single-step commands also exist: `simplify --ratio --error`, `draco`, `meshopt`, `webp`, `resize`, `etc1s`/`uastc` (KTX2), `weld`, `dedup`, `prune`, `validate`.

**[measured] Test run** on this repo's `src/uploads/sheen-chair.glb`, using `@gltf-transform/cli@4.5.1` and a copy in a scratch directory:

| File | Size | gzip |
|---|---|---|
| original | 4.13 MB | 3.81 MB |
| `--compress draco --texture-compress webp --texture-size 2048` | **570 KB** | 560 KB |
| `--compress meshopt --texture-compress webp --texture-size 2048` | 743 KB | 669 KB |

The Draco output declares `KHR_draco_mesh_compression` and `EXT_texture_webp` as *required* extensions.

## 7. Target file sizes and triangle counts

| Source | File size | Triangles | Textures |
|---|---|---|---|
| Khronos 3D Commerce v1.0: *Single-Item Mobile AR or 3D Web Catalogue View* | **3 MB** max | **150,000** | 2K |
| Khronos 3D Commerce v1.0: *Single-Item Desktop 3D Web View* | **3 MB** max | **250,000** | 2K |
| Khronos 3D Commerce v1.0: *Web-based Planning Tool* (per item) | 1 MB | 40,000 | 1K |
| Google Scene Viewer (Android AR) | "Model size: 10 MB (Bigger models may result in poor user experience.)" | "recommended limit is 100,000 … 30,000 to 50,000 is an ideal range" | 2048² max; ≤10 materials |

Sources: [Khronos 3DC Publishing Targets v1.0](https://github.com/KhronosGroup/3DC-Asset-Creation/blob/main/asset-creation-guidelines-1.0/full-version/sec99_PublishingTargets/PublishingTargets.md) · [Google Scene Viewer](https://developers.google.com/ar/develop/scene-viewer). The Khronos 2.0 Publishing Targets page is still marked "work in progress" ([v2 page](https://github.com/KhronosGroup/3DC-Asset-Creation/blob/main/asset-creation-guidelines/full-version/sec09_PublishingTargets/PublishingTargets.md)).

Khronos reasons from load time: assume about 10 Mb/s (1.25 MB/s), so "to load within 3 seconds, an asset should not be larger than 3.75MB". Hence a 3 MB maximum.

**Targets for this portfolio [judgment, derived from the above]:**
- **Aim for ≤ 2 MB per `.glb`; treat 3 MB as the ceiling.** Never exceed about 8–10 MB (see the Sveltia note in §11).
- **Aim for 50k–150k triangles.** Detailed furniture can go to about 250k if desktop is the main audience.
- **Textures ≤ 2048 px, WebP.**

**[measured]** The `<model-viewer>` 4.4.0 script itself is 1.07 MB raw / about 290 KB gzipped from `ajax.googleapis.com`. The Draco WASM decoder adds about 286 KB on first use.

## 8. Poster images

- `poster`: "Displays an image instead of the model, useful for showing the user something before a model is loaded and ready to render." The `slot="poster"` element replaces "the default poster, which is white".
  Source: [model-viewer docs](https://modelviewer.dev/docs/#entrydocs-loading-attributes-poster)
- **Programmatic:** `toBlob({mimeType, qualityArgument, idealAspect})` "Returns a promise that resolves into a Blob … (defaults to image/png)". *qualityArgument* defaults to 0.92 for PNG and 0.8 for WebP. With `idealAspect: true`, the image is captured "at the ideal poster aspect ratio instead of the canvas aspect ratio".
  Source: [model-viewer docs, Methods](https://modelviewer.dev/docs/#entrydocs-loading-methods-toBlob) · signature in [`model-viewer-base.ts`](https://github.com/google/model-viewer/blob/master/packages/model-viewer/src/model-viewer-base.ts)
- **Editor (no code):** the model-viewer editor at <https://modelviewer.dev/editor/> has a **POSTER** download button (`me-export-poster-button`). Its `createPoster()` sets `minimumRenderScale = 1`, jumps to the configured camera orbit, and calls `toBlob({idealAspect: true, mimeType, qualityArgument: 0.85})`. The "download ZIP" option always includes a poster too.
  Source: [`space-opera/.../download_button.ts`](https://github.com/google/model-viewer/blob/master/packages/space-opera/src/components/model_viewer_snippet/components/download_button.ts) · [`space-opera/.../render_model_viewer.ts`](https://github.com/google/model-viewer/blob/master/packages/space-opera/src/components/utils/render_model_viewer.ts)
- A Rhino viewport capture (`ViewCaptureToFile`) of the same view also works as a poster **[judgment]**. A good poster matters because the poster is also the no-WebGL fallback (§10).

## 9. `<model-viewer>` attributes (v4.4.0)

All quotes are from [model-viewer `docs.json`](https://github.com/google/model-viewer/blob/master/packages/modelviewer.dev/data/docs.json) (rendered at <https://modelviewer.dev/docs/>).

| Attribute | Default | Notes |
|---|---|---|
| `src` | "" | glTF/GLB only |
| `poster` | "" | Image shown before load |
| `alt` | "" | "custom text that will be used to describe the model to viewers who use a screen reader" |
| `loading` | `auto` | `auto`/`lazy`/`eager`. "Auto is equivalent to lazy, which loads the model when it is near the viewport for reveal="auto" … Eager loads the model immediately." |
| `reveal` | `auto` | `auto` reveals once loaded and rendered; `manual` keeps the poster until `dismissPoster()` is called |
| `camera-controls` | off | "Enables controls via mouse/touch. This attribute should nearly always be specified" |
| `touch-action` | `pan-y` | Lets touch users scroll the page vertically past the model |
| `disable-zoom` | off | Stops the model swallowing wheel and pinch gestures |
| `auto-rotate` / `auto-rotate-delay` / `rotation-per-second` | off / 3000 ms / π/32 rad/s | — |
| `interaction-prompt` | `auto` | `auto`/`none`. Shown after `interaction-prompt-threshold` (3000 ms), and only with `camera-controls` |
| `environment-image` | "" (neutral lighting) | `'neutral'`, `'legacy'`, or a URL to `.hdr`/`.jpg` |
| `skybox-image` | — | Equirectangular background; also used as the environment |
| `exposure` | `1` | — |
| `shadow-intensity` | `0` | 0–1. `0` turns the shadow off |
| `tone-mapping` | `neutral` (since v4.0; ACES before) | Khronos PBR Neutral "designed specifically for accurate color reproduction" |
| `ar` | off | Enables AR on supported devices |
| `ar-modes` | `webxr scene-viewer quick-look` | Without `ios-src`, Quick Look gets a USDZ generated on the fly |

**Events:** `load` ("after the first render frame"), `progress` (`event.detail.totalProgress`), and `error`. `error` has `detail.type` of `'loadfailure'` or `'webglcontextlost'`, and "The element will not make automatic attempts to re-load".

**Version / CDN.** The README gives the CDN form as `https://ajax.googleapis.com/ajax/libs/model-viewer/{{MODELVIEWER_VERSION}}/model-viewer.min.js` and recommends pinning a version in production ([README](https://github.com/google/model-viewer/blob/master/packages/model-viewer/README.md)). For today's version:

```html
<script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.4.0/model-viewer.min.js"></script>
```

**[measured]** That URL returns 200. Google's Hosted Libraries page still shows a 3.0.0 snippet ([developers.google.com/speed/libraries](https://developers.google.com/speed/libraries#model-viewer)). With npm, three.js is a peer dependency and should stay locked to model-viewer's range (`^0.183.0`). This repo already uses the npm route.

**Lazy-loading behaviour.** With the default `loading="auto"` and `reveal="auto"`, the model downloads when the element is near the viewport. `loading="eager"` downloads immediately. To download only when the visitor clicks, use `reveal="manual"` plus a button in `slot="poster"` that calls `dismissPoster()`, as in the documented "Lazy load with poster until interaction" example ([loading examples](https://modelviewer.dev/examples/loading/)).

**AR caveat [unverified].** The Scene Viewer page lists only `KHR_materials_unlit` and `KHR_texture_transform` as supported extensions. It does not say whether Draco-, Meshopt- or WebP-compressed files open in Scene Viewer, which fetches the file itself. WebXR mode renders with model-viewer's own loader, and Quick Look gets a USDZ generated from the loaded scene, so those two should be unaffected. **[judgment]** Leave `ar` off for a portfolio, or test on an Android device before enabling it.

## 10. Accessibility and fallbacks

- **Accessible name:** `alt` is the screen-reader description. In the shadow DOM, the interactive surface is `<div class="userInput" tabindex="0" role="img" aria-label="3D model">`, and the `aria-label` is replaced by `alt`. A live region (`role="status"`) announces orientation changes.
  Source: [`template.ts`](https://github.com/google/model-viewer/blob/master/packages/model-viewer/src/template.ts) · [`features/controls.ts`](https://github.com/google/model-viewer/blob/master/packages/model-viewer/src/features/controls.ts)
- **Keyboard:** the element is focusable (`tabindex="0"`).
  - Arrow keys orbit, and PageUp/PageDown zoom.
  - Shift + arrows pan, when panning is enabled.
  - The default prompt text is "Use mouse, touch or arrow keys to move."
  - The `a11y` attribute takes a JSON object to localise these announcements.

  Sources: [`SmoothControls.ts` `orbitZoomKeyCodeHandler`/`panKeyCodeHandler`](https://github.com/google/model-viewer/blob/master/packages/model-viewer/src/three-components/SmoothControls.ts) · [`controls.ts` `INTERACTION_PROMPT`](https://github.com/google/model-viewer/blob/master/packages/model-viewer/src/features/controls.ts) · [docs `a11y`](https://modelviewer.dev/docs/)
- **No WebGL:** the renderer wraps `new WebGLRenderer(...)` in try/catch (`console.warn`) and sets `canRender` to false ([`Renderer.ts`](https://github.com/google/model-viewer/blob/master/packages/model-viewer/src/three-components/Renderer.ts)). **[inference]** The poster stays visible, so a real poster image is the fallback. Listen for `error` (`loadfailure`/`webglcontextlost`) if you want to show a message.
- **Reduced motion:** model-viewer has **no built-in `prefers-reduced-motion` handling**. A GitHub code search of `google/model-viewer` for `prefers-reduced-motion` / `reducedMotion` returned no hits. `prefers-reduced-motion` "is used to detect if a user has enabled a setting on their device to minimize the amount of non-essential motion" ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)). Remove `auto-rotate` when `matchMedia('(prefers-reduced-motion: reduce)').matches`, as this repo's `ModelViewer.astro` already does. Consider `interaction-prompt-style="basic"` (not animated) or `interaction-prompt="none"` too, because the default "wiggle" style animates the model.
- **Scrolling on touch:** keep `touch-action="pan-y"` (the default), so a model in the page flow does not trap scrolling.

## 11. GitHub, Sveltia and Pages limits

**GitHub repository limits** ([About large files on GitHub](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github)):
- "If you attempt to add or update a file that is larger than 50 MiB, you will receive a warning from Git."
- "GitHub blocks files larger than 100 MiB."
- "If you add a file to a repository via a browser, the file can be no larger than 25 MiB." This applies to github.com's web uploader, not to Sveltia's API commits.
- "We recommend repositories remain small, ideally less than 1 GB, and less than 5 GB is strongly recommended."

**GitHub Pages limits** ([GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)):
- Source repo recommended limit 1 GB.
- "Published GitHub Pages sites may be no larger than 1 GB."
- Deployments time out after 10 minutes.
- Soft bandwidth limit of 100 GB/month.

**Sveltia CMS (GitHub backend)** commits through GitHub's GraphQL `createCommitOnBranch` mutation with Base64 file contents. From [`src/lib/services/backends/git/github/commits.js`](https://github.com/sveltia/sveltia-cms/blob/main/src/lib/services/backends/git/github/commits.js), last changed 2026-11-08:
- `MAX_GRAPHQL_BLOB_SIZE = 10 MB`: "GitHub's GraphQL API cannot resolve blob OIDs for files over this size". Files over 10 MB used to fail with "Could not resolve file over 10mb." That bug ([#692](https://github.com/sveltia/sveltia-cms/issues/692)) is closed, and the code now skips the OID lookup for such files.
- `MAX_COMMIT_PAYLOAD_SIZE = 16 MB` (Base64): "GitHub's GraphQL API aborts a much larger request, which the browser only reports as a network error" ([#1012](https://github.com/sveltia/sveltia-cms/issues/1012)).
- The first commit is 2 MB. After that, payloads adapt to upload speed because "GitHub closes a request whose body hasn't arrived within about ten seconds" ([#1084](https://github.com/sveltia/sveltia-cms/issues/1084)).
- [`commit-split.js`](https://github.com/sveltia/sveltia-cms/blob/main/src/lib/services/backends/git/shared/commit-split.js) says "A single file over the size is taken on its own". A single large `.glb` is therefore sent as one request that cannot be split.

From the Sveltia docs:
- "The internal storage (Git repository) may not be suitable for a large number of media files or very large files … This is particularly true for the GitHub backend, which does not support Git LFS (Large File Storage) at this time."
- A per-library `max_file_size` (bytes) can enforce a cap in the UI. Example: `media_libraries: default: config: max_file_size: 1024000`.
- A File field can restrict types with `accept` (MIME types or extensions, e.g. `.glb`).

Sources: [Sveltia docs: Internal media storage](https://sveltiacms.app/en/docs/media/internal) · [Sveltia docs: File field](https://sveltiacms.app/en/docs/fields/file)

**Implication [judgment]:** Base64 adds about 33%. Combined with the ~10-second request-body window and the unsplittable single request, a `.glb` of about 10 MB or more is likely to fail on slower connections. GitHub does not document GraphQL request-size limits, so these thresholds come only from Sveltia's code comments. Set `max_file_size` to about **8 MB** (8000000) on the model field, which comfortably covers the 3 MB target.

## 12. `<model-viewer>` vs three.js for this use case

| | `<model-viewer>` | three.js directly |
|---|---|---|
| Effort | One HTML element plus attributes; "strives to give you great defaults for rendering quality and performance" ([README](https://github.com/google/model-viewer/blob/master/packages/model-viewer/README.md)) | You write the scene, camera, controls, lighting, loaders (Draco/KTX2/Meshopt), resize and dispose logic yourself |
| Built in | Poster/lazy loading, orbit controls (mouse, touch, **keyboard**), ARIA and live-region announcements, interaction prompt, AR (WebXR / Scene Viewer / Quick Look), neutral environment and tone mapping, `toBlob` | Nothing; you build each piece |
| Weight | About 290 KB gzipped (includes three.js) **[measured]** | three.js core plus loaders. It can be smaller if tree-shaken, but you still write the features above |
| Flexibility | Limited to the attribute and scene-graph API | Unlimited (custom shaders, multiple models per scene, post-processing, bespoke interactions) |
| Compat | "last 2 major versions of all evergreen desktop and mobile browsers" ([README](https://github.com/google/model-viewer/blob/master/packages/model-viewer/README.md)) | Depends on your code |

**Verdict [judgment]:** use `<model-viewer>`. The need is "show one optional product or interior model per project page, accessibly, with a poster". That matches what it is built for, and the accessibility features alone would take real effort to reproduce in three.js.

---

## Designer checklist: Rhino → `.glb` → CMS

1. **Clean up a copy of the file.** Delete or hide construction lines, 2D drawings, dimensions, site context and hidden internal parts. Select only the objects you want visitors to see.
2. **Assign simple materials.** Give each part a material, or rely on display colours. Fewer materials is better (under 10).
3. **Set mesh quality.** Go to *File ▸ Properties ▸ Mesh* and choose *Jagged and faster*. If curved edges look faceted, choose *Custom* and raise *Density* a little. Tick *Simple planes*.
4. **Export.** Choose *File ▸ Export Selected*, then file type **glTF Binary (.glb)**. Give it a short lowercase name with hyphens, e.g. `oak-sideboard.glb`.
5. **Use these export options:**
   - ✅ Map Rhino Z to glTF Y
   - ✅ Export materials
   - ✅ Use display color for objects with no material
   - ✅ **Use Draco compression** (level 10)
   - Leave everything else at its default.

   Units are converted to metres automatically.
6. **Check the file size.** **Aim for under 2 MB; 3 MB is the maximum.** If it is bigger, re-export with a coarser mesh setting, or send the file to the developer to shrink with gltf-transform.
7. **Preview it and make a poster.**
   1. Open <https://modelviewer.dev/editor/> and drag your `.glb` in.
   2. Check that it looks right and is the right way up.
   3. Rotate to the angle you like, set it as the initial camera, then click **POSTER** to download a still image.

   You can also save a matching Rhino viewport capture instead.
8. **Upload in the CMS.** Open the project entry, upload the `.glb` in the **3D model** field and the still image in the **poster** field. Write a one-sentence **description** of the model for screen readers (e.g. "Oak sideboard with three drawers and brass handles"). Save.
9. **Check the live page** after the site rebuilds, which takes a few minutes. The poster should appear first, and you should be able to drag to rotate.

## Developer notes: wiring into Astro

- **Script loading:** keep the current processed `<script>import '@google/model-viewer'</script>` in `ModelViewer.astro`. Astro bundles processed scripts and "If a component that contains a `<script>` is used multiple times on a page, the script will only be included once". A CDN `<script type="module" src=…>` would need `is:inline`, since scripts with attributes other than `src` are left unprocessed ([Astro: client-side scripts](https://docs.astro.build/en/guides/client-side-scripts/)). Keep `three` locked to model-viewer's peer range (`^0.183.0`).
- **Draco works with no config.** Its decoder loads from gstatic on demand. If you adopt Meshopt, set `self.ModelViewerElement.meshoptDecoderLocation` (pinned to `meshoptimizer@0.25.0/meshopt_decoder.js`) in an inline `<head>` script **before** the element is created. If you self-host the decoders, also set `dracoDecoderLocation`/`ktx2TranscoderLocation`.
- **Lazy loading:** `ModelViewer.astro` currently uses `loading="eager"`. Unless the model is above the fold on load, drop it and use the default `auto` (lazy), or use `reveal="manual"` with a "View in 3D" button that calls `dismissPoster()`. That avoids downloading MBs for visitors who never scroll to it.
- **Reduced motion:** the existing `matchMedia` removal of `auto-rotate` is correct, because model-viewer has no built-in handling. Also consider `interaction-prompt-style="basic"` for reduced-motion users.
- **Paths:** `src` and `poster` must include the Astro `base` (the GitHub Pages project subpath until a custom domain is set). `resolveModel()` already exists for this.
- **Sveltia config:** on the model File field, set `accept: .glb,model/gltf-binary` and a field-level `media_libraries.default.config.max_file_size: 8000000`. Add a `hint:` stating the 3 MB target. Make `alt` a required string whenever `model` is set (validate in `content.config.ts`).
- **Optional CI guard [judgment]:** add a step to `.github/workflows/deploy.yml` that runs `npx @gltf-transform/cli inspect` on new `.glb` files and fails or warns if one is over 3 MB or 250k triangles. Optionally run `optimize --compress draco --texture-compress webp` on the build copy. Optimise in the build output rather than rewriting the CMS-committed file.
- **Unrelated finding:** `public/admin/index.html`'s `<title>` says "Content — Anna Tsoka Architecture", which looks like a leftover from the sibling project.

---

## Sources

**Khronos / specs**
- glTF 2.0 specification — <https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html> · <https://github.com/KhronosGroup/glTF/blob/main/specification/2.0/Specification.adoc>
- KHR_draco_mesh_compression — <https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_draco_mesh_compression/README.md>
- EXT_meshopt_compression — <https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Vendor/EXT_meshopt_compression/README.md>
- KHR_texture_basisu — <https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_texture_basisu/README.md>
- EXT_texture_webp — <https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Vendor/EXT_texture_webp/README.md>
- Khronos 3D Commerce Asset Creation Guidelines, Publishing Targets v1.0 — <https://github.com/KhronosGroup/3DC-Asset-Creation/blob/main/asset-creation-guidelines-1.0/full-version/sec99_PublishingTargets/PublishingTargets.md> (v2 WIP: <https://github.com/KhronosGroup/3DC-Asset-Creation/blob/main/asset-creation-guidelines/full-version/sec09_PublishingTargets/PublishingTargets.md>)

**model-viewer**
- Docs — <https://modelviewer.dev/docs/> (data: <https://github.com/google/model-viewer/blob/master/packages/modelviewer.dev/data/docs.json>)
- Loading examples — <https://modelviewer.dev/examples/loading/> (source: <https://github.com/google/model-viewer/blob/master/packages/modelviewer.dev/examples/loading/index.html>)
- README — <https://github.com/google/model-viewer/blob/master/packages/model-viewer/README.md>
- Source: `features/loading.ts`, `three-components/CachingGLTFLoader.ts`, `three-components/SmoothControls.ts`, `three-components/Renderer.ts`, `features/controls.ts`, `template.ts`, `model-viewer-base.ts` — <https://github.com/google/model-viewer/tree/master/packages/model-viewer/src>
- Editor — <https://modelviewer.dev/editor/> (source: <https://github.com/google/model-viewer/tree/master/packages/space-opera/src>)
- npm — <https://registry.npmjs.org/@google/model-viewer>
- Google Hosted Libraries — <https://developers.google.com/speed/libraries#model-viewer>
- three.js r183 GLTFLoader — <https://github.com/mrdoob/three.js/blob/r183/examples/jsm/loaders/GLTFLoader.js>
- Google Scene Viewer — <https://developers.google.com/ar/develop/scene-viewer>

**glTF Transform**
- CLI docs — <https://gltf-transform.dev/cli>
- CLI source — <https://github.com/donmccurdy/glTF-Transform/blob/main/packages/cli/src/cli.ts>
- simplify defaults — <https://github.com/donmccurdy/glTF-Transform/blob/main/packages/functions/src/simplify.ts>
- meshopt function — <https://github.com/donmccurdy/glTF-Transform/blob/main/packages/functions/src/meshopt.ts>
- EXTMeshoptCompression — <https://gltf-transform.dev/modules/extensions/classes/EXTMeshoptCompression>
- npm — <https://registry.npmjs.org/@gltf-transform/cli>

**Authoring tools**
- Rhino 8 glTF import/export — <https://docs.mcneel.com/rhino/8/help/en-us/fileio/gltf_import_export.htm>
- Rhino 8 polygon mesh settings — <https://docs.mcneel.com/rhino/8/help/en-us/information/polygonmeshsettings.htm>
- Rhino 8 ReduceMesh — <https://docs.mcneel.com/rhino/8/help/en-us/commands/reducemesh.htm>
- Rhino glTF exporter source (mcneel/glTF-IO, `rhino-8.x`) — <https://github.com/mcneel/glTF-IO/tree/rhino-8.x/glTF-BinExporter>
- SketchUp: Working with glTF files — <https://help.sketchup.com/en/sketchup/working-gltf-files>
- SketchUp 2025.0 release notes — <https://help.sketchup.com/en/release-notes/sketchup-desktop-20250>
- Fusion: Export designs — <https://help.autodesk.com/cloudhelp/ENU/Fusion-Designs/files/ASM-EXPORT-DESIGN.htm>
- Fusion: Supported file formats — <https://help.autodesk.com/cloudhelp/ENU/Fusion-Designs/files/TPD-SUPPORTED-FILE-FORMATS.htm>
- Fusion API: OBJExportOptions — <https://help.autodesk.com/cloudhelp/ENU/Fusion-360-API/files/fusion_OBJExportOptions.htm>
- Blender Manual: glTF 2.0 — <https://docs.blender.org/manual/en/latest/addons/scene_gltf2.html>
- Blender Manual: Decimate Modifier — <https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/decimate.html>

**GitHub / Sveltia / web platform**
- About large files on GitHub — <https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github>
- GitHub Pages limits — <https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits>
- Sveltia: internal media storage — <https://sveltiacms.app/en/docs/media/internal>
- Sveltia: File field — <https://sveltiacms.app/en/docs/fields/file>
- Sveltia GitHub commit code — <https://github.com/sveltia/sveltia-cms/blob/main/src/lib/services/backends/git/github/commits.js> · <https://github.com/sveltia/sveltia-cms/blob/main/src/lib/services/backends/git/shared/commit-split.js>
- Sveltia issues #692, #1012, #1084 — <https://github.com/sveltia/sveltia-cms/issues/692> · <https://github.com/sveltia/sveltia-cms/issues/1012> · <https://github.com/sveltia/sveltia-cms/issues/1084>
- Astro client-side scripts — <https://docs.astro.build/en/guides/client-side-scripts/>
- MDN prefers-reduced-motion — <https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion>
