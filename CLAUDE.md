# CLAUDE.md - Simpler Silverstripe Module

**Package:** `restruct/silverstripe-simpler`
**Namespace:** `Restruct\Silverstripe\Simpler`
**Branch:** `main` (Silverstripe 5 and 6, `1.x`).

[README.md](README.md) owns what the module does, its API, its configuration and the version
table; [UPGRADING.md](UPGRADING.md) and [CHANGELOG.md](CHANGELOG.md) own the history. Read those for
behaviour and do not restate them here: a copy in this file drifts. This file only holds what you
need to know to work on the code.

## Where things are

- `src/` PHP classes, one per feature (README has a section per class).
- `templates/Restruct/Silverstripe/Simpler/` the field and button templates. `EditProtectedTextField.ss`
  is an inline Vue module (the Vue version replaced an Entwine one).
- `client/src/js/simpler-silverstripe.js` core bundle, always loaded: DOM events, React Form
  mount events, `window.simpler`, the Entwine/Vue error suppression, the GridField toggle confirm.
  It does NOT set `window.$`.
- `client/src/js/simpler-modal.js` the opt-in modal, built as an ES module by `webpack.mix.modal.js`
  (the core bundle and the Vue copies are built by `webpack.mix.js`).
- `client/src/js/simpler-modal-loader.js` classic script that `import()`s the modal during an
  AJAX/pjax request (#15); copied, not bundled. See `AdminExtension::requireModal()`.
- `client/src/js/jquery-shim.js` why `jquery` is aliased instead of declared external (its
  docblock explains it).
- `tests/` PHPUnit, `tests/js/modal-smoke.mjs` (jsdom, `yarn test`), `tests/browser/` Playwright and
  the README screenshot generator.

## Building

`client/dist` is committed; CI rebuilds it and fails on a diff. Rebuild with
`yarn install --frozen-lockfile && yarn production` (yarn only; there is no package-lock.json in the
module root). Build commands: README "Building assets"; test setup: README "Tests".

## Gotchas when changing the code

- **Vue is not bundled** in `simpler-modal.js`: it is a webpack external resolved through the import
  map (template compiler build). Anything Vue-based therefore needs AdminExtension on LeftAndMain;
  the PHP classes only warn (`AdminExtension::assertImportMapAvailable()`) when it is missing, they
  cannot add it after the first page load.
- **jQuery must be a global** for `simpler-modal.js`: the Bootstrap 4 plugin (npm alias `bootstrap4`)
  is imported at the top level and throws without it. Both admins ship jQuery.
- **Bootstrap 4 or 5** is picked at runtime from the page's CSS (`--bs-blue` on `:root` means
  Bootstrap 5, the SS6 admin). Change both paths together and run `yarn test`, which covers both.
- **Prefer `v-show` over `v-if`** in Vue templates rendered inside CMS forms: `v-if` leaves comment
  nodes that trip Entwine's MutationObserver. Background: [docs/ENTWINE_VUE_CONFLICT.md](docs/ENTWINE_VUE_CONFLICT.md).
