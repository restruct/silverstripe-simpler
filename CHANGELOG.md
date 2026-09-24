# Changelog

## 1.0.0 (unreleased)

**One release line for Silverstripe 5 and 6.** Until now the Silverstripe 5 work lived on the `ss5`
branch (tags `0.3.x`, `silverstripe/framework ^4 || ^5`) and an untagged Silverstripe 6 port on
`main`. The two lines are merged: `1.x` requires `silverstripe/framework ^5 || ^6` and PHP `^8.1`.
Silverstripe 4 is no longer supported; projects on it can stay on the `0.x` tags.
Upgrade guide: [UPGRADING.md](UPGRADING.md).

**Waiting on this release:** `restruct/silverstripe-shortcodable` (5.1.0, Silverstripe 5 and 6)
requires `restruct/silverstripe-simpler ~0.2 || ^1`. The `0.x` tags only allow Silverstripe 4 and 5,
so on Silverstripe 6 shortcodable cannot be installed until this 1.0.0 is tagged. Tag simpler first,
then shortcodable.

### Changed

- **The modal bundle carries both Bootstrap majors.** The CMS ships Bootstrap 4 CSS on Silverstripe 5
  and Bootstrap 5 CSS on Silverstripe 6, and the modal JS has to match. `simpler-modal.js` now bundles
  the Bootstrap 4 jQuery plugin (exactly as in `0.3.x`) and the Bootstrap 5 modal, and picks one at
  runtime from the page's CSS. On Silverstripe 5, `$.fn.modal` is the Bootstrap 4 plugin as before.
  The bundle grew from ~22kb to ~42kb (compared with `0.3.7`).
- **Dismissing the modal** goes through a `data-simpler-dismiss` attribute, and Bootstrap's own
  `data-dismiss="modal"` / `data-bs-dismiss="modal"` are honoured on both majors. Before, HTML written
  for one major did not close the modal on the other (the GridField toolbar form's cancel button used
  `data-dismiss`, which the Silverstripe 6 port did not handle).
- The modal's header close button follows the CSS: `.close` with `&times;` on Bootstrap 4,
  `.btn-close` on Bootstrap 5.
- **`GridFieldModalButton` markup:** the row button no longer carries the `action` class and is wrapped
  in `<span class="action">` (see Fixed, #5). The module's own stylesheet follows
  (`.grid-field td > .action > .btn[data-simpler-modal]`); project CSS or JS that targeted
  `.action.btn[data-simpler-modal]` must be updated.
- Bootstrap-version-specific utility classes are emitted in both spellings where the module renders
  them: `mr-2 me-2` (GridFieldToolbarModalAction cancel button), `rounded-right rounded-end`
  (EditProtectedTextField).
- **Yarn only:** `package-lock.json` is removed; `yarn.lock` is the one lockfile (CI and the README
  already build with yarn). Rebuild the client bundles with `yarn install --frozen-lockfile` and
  `yarn production`.
- `SimplerModalField::setButtonIcon(?string $buttonIcon = null, ...)`: explicit nullable type (the
  implicit form is deprecated in PHP 8.4). Same accepted values.

### Fixed

- **`GridFieldModalButton` reloaded the whole GridField on every click** (#5). silverstripe/admin binds
  `.grid-field .action:button` to an AJAX GridField reload, and the default button classes included
  `action`, so each click reloaded the grid before the modal opened.
- README documented `Session::clearAll()`; the method is `Session::clear_all()`.
- The `AdminExtension` docblock named the config key `simpler_skip_import_map_check`; the key that is
  read is `skip_import_map_check` on `AdminExtension`.

### Added (from the 0.3.x line, now also on Silverstripe 6)

- `GridFieldToolbarModalAction`, `GridFieldModalButton`, `GridFieldToggleFieldButton`,
  `GridFieldToggleIsActiveButton`; `setModalTitle()` and icon prefixes (`'ss'`, `'bs'`, `false`) on
  `SimplerModalField` / `SimplerModalAction`; the progress indicator and AJAX submit for GridField
  modal forms, including error display and the `X-Reload` header.

### Tests and CI

- Behavioural PHPUnit tests (84 tests) run on Silverstripe 5 (PHPUnit 9) and 6 (PHPUnit 11): a real CMS
  request proves the import map, the core bundle and the opt-in modal load; the modal field/action
  config and rendered buttons; the GridField components against real records; HeadRequirements and
  the Session helpers.
- `tests/js/modal-smoke.mjs` (`yarn test`) checks the modal's Bootstrap 4 and Bootstrap 5 paths in
  jsdom.
- GitHub Actions: one job per supported Silverstripe major, a PHP lint job (fails on compile-time
  deprecations too), and a client job that rebuilds `client/dist` and fails if it is out of date.

## 0.3.7 and earlier

Released from the `ss5` branch for Silverstripe 4 and 5; see the git history of that branch.
