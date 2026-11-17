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
    .guide-dialog { --bg: #fff; --fg: #1f2650; --muted: #5c6182; --line: #e3e4eb; --press: #f2f2f2; --accent: #1f2650; --on-accent: #fff;
      width: min(760px, calc(100vw - 32px)); max-height: calc(100dvh - 48px); padding: 0; border: 0; border-radius: 10px;
      background: var(--bg); color: var(--fg); box-shadow: 0 20px 60px rgb(0 0 0 / .35); font: 15px/1.6 system-ui, sans-serif; }
    @media (prefers-color-scheme: dark) {
      .guide-dialog { --bg: #23262f; --fg: #e8e9ef; --muted: #a9adc1; --line: #3a3e4b; --press: #2d313c; --accent: #e8e9ef; --on-accent: #1f2650; }
    }
    .guide-dialog::backdrop { background: rgb(0 0 0 / .5); }
    .guide-dialog[open] { display: flex; flex-direction: column; }
    .guide-dialog ::selection { background: var(--accent); color: var(--on-accent); }
    .guide-head { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 12px 16px;
      padding: 16px 16px 14px 24px; border-bottom: 1px solid var(--line); }
    .guide-head h2 { margin: 0; font-size: 17px; line-height: 1.3; text-wrap: balance; }
    .guide-tabs { grid-column: 1 / -1; display: flex; gap: 6px; }
    .guide-tabs button { font: inherit; font-size: 14px; cursor: pointer; border: 1px solid var(--line); background: transparent;
      color: var(--fg); min-height: 36px; padding: 0 14px; border-radius: 6px; }
    .guide-tabs button[aria-selected="true"] { background: var(--accent); color: var(--on-accent); border-color: var(--accent); }
    .guide-close { display: grid; place-items: center; width: 40px; height: 40px; padding: 0; cursor: pointer; border: 0;
      border-radius: 50%; background: transparent; color: var(--fg); }
    .guide-tabs button, .guide-close { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
    .guide-close:active, .guide-tabs button:active:not([aria-selected="true"]) { background: var(--press); }
    @media (hover: hover) { .guide-close:hover, .guide-tabs button:hover:not([aria-selected="true"]) { background: var(--press); } }
    .guide-tabs button:focus-visible, .guide-close:focus-visible, .guide-body a:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .guide-body { overflow: auto; overscroll-behavior: contain; padding: 8px 24px 28px; }
    .guide-body .lead { color: var(--muted); }
    .guide-body h3 { font-size: 15px; margin: 24px 0 4px; scroll-margin-top: 12px; }
    .guide-body ol, .guide-body ul { padding-left: 1.4em; margin: 6px 0; }
    .guide-body li { margin: 4px 0; }
    .guide-body .checklist li { margin: 10px 0; }
    .guide-body code { font: 13px ui-monospace, Menlo, monospace; background: var(--line); padding: 1px 5px; border-radius: 4px;
      overflow-wrap: anywhere; }
    .guide-body a { color: inherit; text-underline-offset: 3px; }

    /* Phone: a full-screen sheet, tabs share the width, thumb-sized targets. */
    @media (max-width: 640px) {
      .guide-dialog { width: 100%; max-width: 100%; height: 100dvh; max-height: 100dvh; border-radius: 0; box-shadow: none; }
      .guide-head { padding: 10px 8px 12px 16px; }
      .guide-tabs { padding-right: 8px; }
      .guide-tabs button { flex: 1; }
      .guide-body { padding: 4px 16px max(32px, env(safe-area-inset-bottom)); font-size: 16px; }
      .guide-body h3 { font-size: 16px; }
    }
    @media (pointer: coarse) {
      .guide-tabs button { min-height: 44px; }
      .guide-close { width: 44px; height: 44px; }
    }
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
        <button type="button" class="guide-close" aria-label="Close">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>
        </button>
        <div class="guide-tabs" role="tablist">
          <button type="button" role="tab" data-show="quick" aria-selected="true">Quick checklist</button>
          <button type="button" role="tab" data-show="detailed" aria-selected="false">Step by step</button>
        </div>
      </div>
      <div class="guide-body" role="tabpanel">Loading…</div>`;
    document.body.appendChild(dialog);

    const body = dialog.querySelector('.guide-body');
    const tabs = [...dialog.querySelectorAll('[role=tab]')];
    const show = (name, anchor) => {
      tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.show === name)));
      body.querySelectorAll('[data-tab]').forEach((s) => (s.hidden = s.dataset.tab !== name));
      const target = anchor && body.querySelector(`#${anchor}`);
      if (target) target.scrollIntoView({ block: 'start', behavior: 'instant' });
      else body.scrollTop = 0;
    };
    tabs.forEach((t) => t.addEventListener('click', () => show(t.dataset.show)));
    // Cross-references inside the guide ("Step by step, step 7").
    body.addEventListener('click', (e) => {
      const link = e.target.closest('[data-goto]');
      if (!link) return;
      e.preventDefault();
      show(link.dataset.goto, link.dataset.anchor);
    });
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
      .catch(() => {
        body.textContent = 'The guide couldn’t load. Check your connection, close this and open the guide again.';
        // Build afresh (and fetch again) on the next open.
        dialog.addEventListener('close', () => {
          dialog.remove();
          dialog = undefined;
        }, { once: true });
      });
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
