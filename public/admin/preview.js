/*
 * Sveltia CMS preview for projects: shows the 3D model as visitors will see it
 * (same <model-viewer> settings as src/components/ModelViewer.astro) and reads
 * out the current camera angle so it can be pasted into "3D model starting
 * angle". Plain JS, no build step — Sveltia exposes React on CMS.React.
 */
(() => {
  const CMS = window.CMS;
  const React = CMS.React;
  const h = React.createElement;

  // Same version as @google/model-viewer in package.json.
  const MODEL_VIEWER_SRC = 'https://ajax.googleapis.com/ajax/libs/model-viewer/4.4.0/model-viewer.min.js';
  // Keep in sync with the default in src/components/ModelViewer.astro.
  const DEFAULT_ORBIT = '30deg 75deg 105%';

  // The preview pane is an iframe with its own custom-element registry, so the
  // viewer script has to be loaded into that document, not the admin page.
  function ensureModelViewer(doc) {
    if (doc.getElementById('model-viewer-script')) return;
    const s = doc.createElement('script');
    s.id = 'model-viewer-script';
    s.type = 'module';
    s.src = MODEL_VIEWER_SRC;
    doc.head.appendChild(s);
  }

  const round = (n, step) => Math.round(n / step) * step;

  /** getCameraOrbit() is in radians and metres; write it the way camera-orbit reads it. */
  function formatOrbit({ theta, phi, radius }) {
    let deg = round((theta * 180) / Math.PI, 1) % 360;
    if (deg > 180) deg -= 360;
    if (deg <= -180) deg += 360;
    return `${deg}deg ${round((phi * 180) / Math.PI, 1)}deg ${radius.toFixed(2)}m`;
  }

  function ModelPreview({ src, poster, alt, savedOrbit }) {
    const viewerRef = React.useRef(null);
    const inputRef = React.useRef(null);
    const [orbit, setOrbit] = React.useState('');
    const [copied, setCopied] = React.useState(false);
    const startOrbit = savedOrbit || DEFAULT_ORBIT;

    React.useEffect(() => {
      const el = viewerRef.current;
      if (!el) return undefined;
      // ownerDocument is the preview iframe's document (rendered from the admin page).
      ensureModelViewer(el.ownerDocument);
      const onChange = () => {
        if (typeof el.getCameraOrbit === 'function') setOrbit(formatOrbit(el.getCameraOrbit()));
        setCopied(false);
      };
      el.addEventListener('camera-change', onChange);
      el.addEventListener('load', onChange);
      return () => {
        el.removeEventListener('camera-change', onChange);
        el.removeEventListener('load', onChange);
      };
    }, [src]);

    const copy = async () => {
      inputRef.current?.select();
      try {
        await navigator.clipboard.writeText(orbit);
        setCopied(true);
      } catch {
        // Clipboard blocked: the value is selected, Cmd/Ctrl+C copies it.
      }
    };

    const reset = () => {
      const el = viewerRef.current;
      if (!el) return;
      el.cameraOrbit = startOrbit;
      el.cameraTarget = 'auto auto auto';
      el.fieldOfView = 'auto';
    };

    return h(
      'div',
      { className: 'mv-preview' },
      h(
        'div',
        { className: 'mv-frame' },
        h('model-viewer', {
          ref: viewerRef,
          // Remount when the file changes so the new model loads cleanly.
          key: src,
          src,
          poster,
          alt,
          'camera-controls': '',
          'camera-orbit': startOrbit,
          'max-camera-orbit': 'auto 90deg auto',
          // No panning here, so the copied angle reproduces the view exactly.
          'disable-pan': '',
          'interaction-prompt': 'none',
          'touch-action': 'pan-y',
          'shadow-intensity': '0.8',
          'shadow-softness': '1',
          exposure: '1',
          'environment-image': 'neutral',
          style: { width: '100%', height: '100%', '--poster-color': 'transparent' },
        }),
      ),
      h(
        'div',
        { className: 'mv-angle' },
        h('span', { className: 'mv-label' }, 'Current angle'),
        h('input', {
          ref: inputRef,
          readOnly: true,
          value: orbit || 'loading…',
          onFocus: (e) => e.target.select(),
          'aria-label': 'Current camera angle',
        }),
        h('button', { type: 'button', onClick: copy, disabled: !orbit }, copied ? 'Copied' : 'Copy'),
        h('button', { type: 'button', onClick: reset }, 'Reset'),
      ),
      h(
        'p',
        { className: 'mv-hint' },
        'Drag to rotate, scroll to zoom. When the view looks right, copy the angle into “3D model starting angle”. ',
        savedOrbit ? `Saved angle: ${savedOrbit}.` : 'No starting angle saved yet; visitors see the default view.',
      ),
    );
  }

  const FIELDS = [
    ['title', 'Title'],
    ['category', 'Category'],
    ['cover', 'Main image'],
    ['location', 'Location'],
    ['year', 'Year'],
    ['status', 'Status'],
    ['client', 'Client / collaborators'],
    ['description', 'Description'],
    ['blocks', 'Page content'],
  ];

  function ProjectPreview({ entry, widgetFor, getAsset }) {
    const data = entry.get('data');
    const model = data.get('model');
    const cover = data.get('cover');
    const modelUrl = model ? getAsset(model)?.url : undefined;

    return h(
      'div',
      { className: 'project-preview' },
      model &&
        (modelUrl
          ? h(ModelPreview, {
              src: modelUrl,
              poster: cover ? getAsset(cover)?.url : undefined,
              alt: data.get('modelAlt') || '',
              savedOrbit: data.get('modelOrbit') || '',
            })
          : h('p', { className: 'mv-hint' }, 'Loading 3D model…')),
      ...FIELDS.filter(([name]) => {
        const v = data.get(name);
        return v !== undefined && v !== null && v !== '' && !(v.size === 0);
      }).map(([name, label]) =>
        h('section', { key: name, className: 'field' }, h('div', { className: 'mv-label' }, label), widgetFor(name)),
      ),
    );
  }

  CMS.registerPreviewTemplate('projects', ProjectPreview);

  CMS.registerPreviewStyle(
    `
    .project-preview { font-family: system-ui, sans-serif; color: #1f2650; padding: 16px; max-width: 760px; margin: 0 auto; }
    .project-preview .field { margin: 0 0 20px; }
    .project-preview img { max-width: 100%; height: auto; }
    .mv-label { font: 11px/1.4 ui-monospace, Menlo, monospace; letter-spacing: .15em; text-transform: lowercase; color: #5c6182; margin-bottom: 4px; }
    .mv-preview { margin: 0 0 28px; }
    .mv-frame { height: min(55vh, 640px); background: #f2f2f2; }
    .mv-angle { display: flex; align-items: center; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
    .mv-angle .mv-label { margin: 0; }
    .mv-angle input { flex: 1; min-width: 12ch; font: 13px ui-monospace, Menlo, monospace; padding: 6px 8px; border: 1px solid #e3e4eb; color: inherit; background: #fff; }
    .mv-angle button { font: 12px system-ui, sans-serif; padding: 7px 12px; border: 1px solid #1f2650; background: #fff; color: #1f2650; cursor: pointer; }
    .mv-angle button:first-of-type { background: #1f2650; color: #fff; }
    .mv-angle button:disabled { opacity: .5; cursor: default; }
    .mv-hint { font-size: 13px; line-height: 1.5; color: #5c6182; margin: 8px 0 0; }
    `,
    { raw: true },
  );
})();
