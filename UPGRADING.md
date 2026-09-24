# Upgrading

## 0.3.x to 1.0

1.0 supports Silverstripe 5 and 6 from one release line and requires PHP 8.1+. Silverstripe 4 is
no longer supported: stay on `^0.3` there.

**Composer constraint.** A `~0.2` or `^0.3` constraint never resolves to 1.0; change it to `^1`:

```bash
composer require restruct/silverstripe-simpler:^1
```

**`lekoala/silverstripe-pure-modal`** (only needed for `SimplerModalField` / `SimplerModalAction`)
has its own major per Silverstripe major: `^1.2` on Silverstripe 5, `^2` on Silverstripe 6.

### Things to check

1. **`GridFieldModalButton` markup changed** (#5). The row button is now
   `<span class="action"><button class="btn btn-sm btn-outline-info" ...>...</button></span>` instead of a button
   carrying `action` itself. If your project CSS or JS targets `.action.btn[data-simpler-modal]` or
   `button.action[data-simpler-modal]`, retarget it, e.g. `.action > .btn[data-simpler-modal]`:

   ```bash
   grep -rn "action.btn\[data-simpler-modal\]\|button.action\[data-simpler-modal\]" app/ themes/ --include='*.css' --include='*.scss' --include='*.js'
   ```

   If you passed `setButtonClasses()` a list that includes `action`, drop it: with `action` on the
   button, silverstripe/admin reloads the GridField on every click.

2. **Your own modal HTML** (`simpler.modal.bodyHtml`, `getModalContent()`, `setBodyHtml()`): buttons
   meant to close the modal can use `data-simpler-dismiss`. `data-dismiss="modal"` keeps working.

3. **Bootstrap classes in your modal HTML**: on Silverstripe 6 the CMS CSS is Bootstrap 5, so
   Bootstrap 4-only utilities (`mr-*`, `ml-*`, `float-right`, `input-group-append`, `.close`, ...) are
   unstyled there. Where the module renders spacing or rounding utilities itself it emits both
   spellings (`mr-2 me-2`, `rounded-right rounded-end`); `EditProtectedTextField` still wraps its
   buttons in `input-group-append`, which Bootstrap 5 no longer styles.

4. **`SimplerModalAction` button titles are escaped.** 0.3.x output the title raw
   (`$ButtonTitle.RAW`), so HTML in a title rendered as markup; 1.0 escapes it (`$ButtonTitle.XML`),
   because a title built from record data was an XSS path into the CMS. A title that relied on HTML
   (an icon `<i class="...">`, `<b>`, `<br>`) now shows the tags as text. Put an icon on the button
   with `setButtonIcon('name', 'ss'|'bs'|false)` instead, and keep the title plain text. To find
   candidates:

   ```bash
   grep -rn "SimplerModalAction::create(.*<" app/ src/ --include='*.php'
   ```

   If a project really needs HTML there, override the template
   `Restruct/Silverstripe/Simpler/SimplerModalAction.ss` in the theme, and make sure no part of that
   title comes from user or record data.

### Things that did NOT change

- All PHP class names, namespaces, public methods and config keys.
- `window.simpler.modal` and its properties; `window.simpler.modalEl` is still set.
- On Silverstripe 5 the modal runs the same Bootstrap 4 jQuery plugin as 0.3.x.

## Silverstripe 6 users of `dev-main` (before 1.0)

`main` carried an untagged Silverstripe 6 port. 1.0 is a superset of it: it adds the GridField
components and modal API from the 0.3.x line (see CHANGELOG). Require `^1` instead of `dev-main`.
