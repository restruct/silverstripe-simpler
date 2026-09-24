// Smoke test for client/dist/js/simpler-modal.js against BOTH admin Bootstrap majors, in jsdom.
//
// The bundle carries the Bootstrap 4 jQuery plugin (Silverstripe 5 admin CSS) and the Bootstrap 5
// modal (Silverstripe 6 admin CSS) and picks one at runtime from the page's CSS. This checks the
// wiring of that choice: which plugin ends up on $.fn.modal, which close-button markup renders,
// and that the modal opens, closes via a dismiss button and resets - on each path.
//
// It is NOT a browser test: jsdom does no layout and no CSS transitions, so how the modal LOOKS
// on each admin still needs a real browser.
//
// Usage (from the module root, after `yarn install`): yarn test
//   or: node tests/js/modal-smoke.mjs [path/to/simpler-modal.js]

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const bundle = process.argv[2] ? path.resolve(process.argv[2]) : path.join(root, 'client/dist/js/simpler-modal.js');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const failures = [];
const check = (mode, label, actual, expected) => {
    const ok = actual === expected;
    console.log(`${ok ? 'ok  ' : 'FAIL'} [${mode}] ${label}: ${JSON.stringify(actual)}${ok ? '' : ` (expected ${JSON.stringify(expected)})`}`);
    if (!ok) failures.push(`[${mode}] ${label}`);
};

// Each mode runs in its own child process: the bundle is an ES module and evaluates once per process
if (process.env.SIMPLER_SMOKE_MODE) {
    const mode = process.env.SIMPLER_SMOKE_MODE;
    // Bootstrap 5 declares --bs-* custom properties on :root, Bootstrap 4 unprefixed ones
    const css = mode === 'bs5' ? ':root{--bs-blue:#005ae1}' : ':root{--blue:#005ae1}';
    const dom = new JSDOM(`<!doctype html><html><head><style>${css}</style></head><body></body></html>`, { pretendToBeVisual: true });
    const w = dom.window;
    for (const k of ['window', 'document', 'Element', 'HTMLElement', 'Node', 'Event', 'CustomEvent', 'MouseEvent', 'KeyboardEvent',
        'MutationObserver', 'requestAnimationFrame', 'SVGElement', 'ShadowRoot', 'DocumentFragment', 'Text', 'Comment', 'HTMLTemplateElement']) {
        Object.defineProperty(globalThis, k, { value: k === 'window' ? w : w[k], configurable: true, writable: true });
    }
    Object.defineProperty(globalThis, 'getComputedStyle', { value: w.getComputedStyle.bind(w), configurable: true, writable: true });
    // As in the CMS: jQuery is a global, window.simpler comes from simpler-silverstripe.js
    w.jQuery = require('jquery');
    w.simpler = {};
    await import(bundle);
    const $ = w.jQuery;

    document.dispatchEvent(new w.Event('DOMContentLoaded'));
    await wait(50);

    const expectedMajor = mode === 'bs5' ? '5' : '4';
    check(mode, '$.fn.modal Bootstrap major', String($.fn.modal && $.fn.modal.Constructor && $.fn.modal.Constructor.VERSION).charAt(0), expectedMajor);
    const modal = document.getElementById('simplerAdminModal');
    check(mode, 'modal mounted', !!modal, true);
    const closeBtn = modal.querySelector('.modal-header button');
    check(mode, 'header close button class', closeBtn.className, mode === 'bs5' ? 'btn-close' : 'close');

    // Open, then dismiss through a Bootstrap-4-style attribute inside the body HTML
    w.simpler.modal.title = 'Smoke';
    w.simpler.modal.bodyHtml = '<p>x</p><button id="legacy-dismiss" data-dismiss="modal">Cancel</button>';
    w.simpler.modal.show = true;
    await wait(600);
    check(mode, 'opens (.show)', modal.classList.contains('show'), true);
    check(mode, 'Bootstrap 5 instance used', !!w.simpler.modalInstance, mode === 'bs5');
    check(mode, 'Bootstrap 4 plugin data used', !!$(modal).data('bs.modal'), mode === 'bs4');

    document.getElementById('legacy-dismiss').dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
    await wait(800);
    check(mode, 'closed via data-dismiss', modal.classList.contains('show'), false);
    check(mode, 'state reset after hide', w.simpler.modal.title, '...');

    // Reopen, then close with the header X
    w.simpler.modal.show = true;
    await wait(600);
    check(mode, 'reopens', modal.classList.contains('show'), true);
    closeBtn.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
    await wait(800);
    check(mode, 'closed via header X', modal.classList.contains('show'), false);

    process.exit(failures.length ? 1 : 0);
} else {
    const { spawnSync } = await import('child_process');
    let failed = false;
    for (const mode of ['bs4', 'bs5']) {
        const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), bundle], {
            env: { ...process.env, SIMPLER_SMOKE_MODE: mode }, stdio: 'inherit',
        });
        failed = failed || r.status !== 0;
    }
    console.log(failed ? 'modal smoke: FAILED' : 'modal smoke: OK (bs4 + bs5)');
    process.exit(failed ? 1 : 0);
}
