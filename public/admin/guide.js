/*
 * "How to upload a 3D model" dialog for /admin. Field hints in config.yml link
 * to `#3d-model-guide`; that click is caught here (before Sveltia's router sees
 * the hash) and opens a modal over the editor, so the entry stays open behind
 * it. The guide text lives in 3d-model-guide.html and is fetched on first open.
 */
(() => {
  const HASH = '#3d-model-guide';
  // Next to this script, so it works under the site's base path too.
  const GUIDE_URL = new URL('3d-model-guide.html', document.currentScript.src);
  let dialog;

  const css = `
    .guide-dialog { --bg: #fff; --fg: #1f2650; --muted: #5c6182; --line: #e3e4eb; --accent: #1f2650; --on-accent: #fff;
      width: min(760px, calc(100vw - 32px)); max-height: calc(100vh - 48px); padding: 0; border: 0; border-radius: 10px;
      background: var(--bg); color: var(--fg); box-shadow: 0 20px 60px rgb(0 0 0 / .35); font: 15px/1.6 system-ui, sans-serif; }
    @media (prefers-color-scheme: dark) {
      .guide-dialog { --bg: #23262f; --fg: #e8e9ef; --muted: #a9adc1; --line: #3a3e4b; --accent: #e8e9ef; --on-accent: #1f2650; }
    }
    .guide-dialog::backdrop { background: rgb(0 0 0 / .5); }
    .guide-dialog[open] { display: flex; flex-direction: column; }
    .guide-head { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-bottom: 1px solid var(--line); flex-wrap: wrap; }
    .guide-head h2 { margin: 0; font-size: 17px; flex: 1; min-width: 12em; }
    .guide-tabs { display: flex; gap: 4px; }
    .guide-tabs button, .guide-close { font: inherit; font-size: 13px; cursor: pointer; border: 1px solid var(--line);
      background: transparent; color: var(--fg); padding: 6px 12px; border-radius: 6px; }
    .guide-tabs button[aria-selected="true"] { background: var(--accent); color: var(--on-accent); border-color: var(--accent); }
    .guide-close { width: 34px; height: 34px; padding: 0; font-size: 18px; line-height: 1; }
    .guide-tabs button:focus-visible, .guide-close:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .guide-body { overflow: auto; padding: 8px 24px 24px; }
    .guide-body .lead { color: var(--muted); }
    .guide-body h3 { font-size: 15px; margin: 22px 0 4px; }
    .guide-body ol, .guide-body ul { padding-left: 1.4em; margin: 6px 0; }
    .guide-body li { margin: 4px 0; }
    .guide-body .checklist li { margin: 8px 0; }
    .guide-body code { font: 13px ui-monospace, Menlo, monospace; background: var(--line); padding: 1px 5px; border-radius: 4px; }
    .guide-body a { color: inherit; }
  `;

  function build() {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    dialog = document.createElement('dialog');
    dialog.className = 'guide-dialog';
    dialog.setAttribute('aria-labelledby', 'guide-title');
    dialog.innerHTML = `
      <div class="guide-head">
        <h2 id="guide-title">How to upload a 3D model from Rhino</h2>
        <div class="guide-tabs" role="tablist">
          <button type="button" role="tab" data-show="quick" aria-selected="true">Quick checklist</button>
          <button type="button" role="tab" data-show="detailed" aria-selected="false">Step by step</button>
        </div>
        <button type="button" class="guide-close" aria-label="Close">×</button>
      </div>
      <div class="guide-body" role="tabpanel">Loading…</div>`;
    document.body.appendChild(dialog);

    const body = dialog.querySelector('.guide-body');
    const tabs = [...dialog.querySelectorAll('[role=tab]')];
    const show = (name) => {
      tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.show === name)));
      body.querySelectorAll('[data-tab]').forEach((s) => (s.hidden = s.dataset.tab !== name));
      body.scrollTop = 0;
    };
    tabs.forEach((t) => t.addEventListener('click', () => show(t.dataset.show)));
    dialog.querySelector('.guide-close').addEventListener('click', () => dialog.close());
    // Click on the backdrop (outside the box) closes too; Esc is native.
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });

    fetch(GUIDE_URL)
      .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
      .then((html) => {
        body.innerHTML = html;
        show('quick');
      })
      .catch(() => (body.textContent = 'The guide could not be loaded. See SETUP.md §9.'));
  }

  document.addEventListener(
    'click',
    (e) => {
      const link = e.target.closest?.('a[href]');
      if (!link || !link.getAttribute('href').endsWith(HASH)) return;
      e.preventDefault();
      e.stopPropagation();
      if (!dialog) build();
      dialog.showModal();
    },
    { capture: true },
  );
})();
