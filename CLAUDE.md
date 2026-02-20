# CLAUDE.md - Simpler Silverstripe Module

**Package:** `restruct/silverstripe-simpler`
**Namespace:** `Restruct\Silverstripe\Simpler`
**Branch:** `ss5` (SilverStripe 5 compatible)

## Purpose

Makes SilverStripe Admin development simpler by re-introducing traditional basics:

1. **Synthetic DOM Events** (always loaded) - `DOMNodesInserted`/`DOMNodesRemoved` for JS initialization on dynamic content
2. **Modal Dialog** (opt-in) - Bootstrap 4 modal via global `simpler.modal` object
3. **Vue 3 Import Map** (opt-in) - Use Vue 3 in your own ES modules
4. **Static Session Helpers** - `Session::get()`/`set()` instead of `$this->getRequest()->getSession()->get()`
5. **HeadRequirements** - Import maps and early scripts in `<head>` (also template globals)

## File Structure

```
a-simpler/
├── _config/config.yml              # Auto-loads core, opt-in for modal/import map
├── src/
│   ├── Session.php                     # Static session accessor class
│   ├── HeadRequirements.php            # Static helpers for head JS (import maps, early scripts)
│   ├── AdminExtension.php              # Injects Vue 3 import map (opt-in)
│   ├── EditProtectedTextField.php      # TextField with edit toggle (Vue)
│   ├── SimplerModalField.php           # Drop-in PureModal replacement
│   ├── SimplerModalAction.php          # Drop-in PureModalAction replacement
│   ├── GridFieldToolbarModalAction.php # GridField toolbar button with modal (form or view-only)
│   ├── GridFieldModalButton.php        # GridField column button with modal (per-row)
│   ├── GridFieldToggleFieldButton.php  # GridField row button to toggle field values
│   └── GridFieldToggleIsActiveButton.php # Pre-configured toggle for IsActive field
├── templates/Restruct/Silverstripe/Simpler/
│   ├── EditProtectedTextField.ss   # Vue-powered edit toggle field
│   ├── SimplerModalField.ss        # Button with data-simpler-modal attribute
│   └── SimplerModalAction.ss       # Action button with data-simpler-modal attribute
├── client/
│   ├── src/js/
│   │   ├── simpler-silverstripe.js # Core: DOM events, jQuery $, window.simpler
│   │   └── simpler-modal.js        # Opt-in: BS4 modal + Vue 3 modal app
│   ├── src/styles/
│   │   └── simpler-silverstripe.scss
│   └── dist/js/
│       ├── simpler-silverstripe.js     # Core bundle (~5kb)
│       ├── simpler-modal.js            # Modal bundle (~192kb, includes Vue 3)
│       ├── vue.esm-browser.js          # Vue 3 dev (~530kb, for import map)
│       └── vue.esm-browser.prod.js     # Vue 3 prod (~162kb, for import map)
├── webpack.mix.js
└── package.json
```

## Bundle Sizes

| File | Size | Contents | Loaded |
|------|------|----------|--------|
| `simpler-silverstripe.js` | ~5kb | DOM events, React mounts, jQuery `$`, `window.simpler` | Always |
| `vue.esm-browser.prod.js` | ~162kb | Vue 3 for import map (prod) | Via AdminExtension |
| `vue.esm-browser.js` | ~530kb | Vue 3 for import map (dev) | Via AdminExtension |
| `simpler-modal.js` | ~17kb | BS4 modal plugin + Vue modal app | Opt-in (requires AdminExtension) |

**Note:** `simpler-modal.js` uses Vue via import map - AdminExtension must be enabled for modal to work.

## Configuration

**Auto-loaded** (via module config):
```yaml
SilverStripe\Admin\LeftAndMain:
  extra_requirements_javascript:
    - 'restruct/silverstripe-simpler:client/dist/js/simpler-silverstripe.js'
```

**IMPORTANT:** If using Vue components (SimplerModalField, EditProtectedTextField, or your own),
you MUST add AdminExtension to LeftAndMain. Components will warn if import map is missing.

**Opt-in configurations** (add to your project config):

```yaml
# Option 1: Import Map + Modal (via AdminExtension with simpler_include_modal)
# Best for: Using both your own Vue components AND the modal
SilverStripe\Admin\LeftAndMain:
  extensions:
    - Restruct\Silverstripe\Simpler\AdminExtension
  simpler_include_modal: true

# Option 2: Import Map only (via AdminExtension)
# Best for: Using Vue 3 in your own ES modules (no modal)
SilverStripe\Admin\LeftAndMain:
  extensions:
    - Restruct\Silverstripe\Simpler\AdminExtension

# To disable the import map check warning (for devs who know what they're doing):
# Restruct\Silverstripe\Simpler\AdminExtension:
#   skip_import_map_check: true

# Option 3: Modal only via PHP classes
# Just use SimplerModalField/SimplerModalAction - they auto-inject the import map

# Option 4: Modal via JS only (without PHP classes)
SilverStripe\Admin\LeftAndMain:
  extensions:
    - Restruct\Silverstripe\Simpler\AdminExtension
  extra_requirements_javascript:
    - 'restruct/silverstripe-simpler:client/dist/js/simpler-modal.js': { type: module }
```

## Usage

### 1. DOM Events (always loaded)

```js
document.addEventListener("DOMNodesInserted", function(event) {
    console.log('Type:', event.detail.type); // LOAD, MUTATION, MOUNT, UNMOUNT
    console.log('Target:', event.target);
    initMyPlugin();
});

document.addEventListener("DOMNodesRemoved", function(event) {
    destroyMyPlugin();
});
```

### 2. Vue 3 in Your Own Code (opt-in)

When `AdminExtension` is enabled, Vue 3 is available via import map.

#### Option A: Self-Contained ES Module File

```js
// mymodule/client/dist/js/my-vue-app.js (not webpack-bundled)
import { createApp, ref } from 'vue';

document.addEventListener('DOMContentLoaded', () => {
    createApp({
        setup() {
            const count = ref(0);
            return { count };
        },
        template: `<button @click="count++">Count: {{ count }}</button>`
    }).mount('#my-app');
});
```

Load via Requirements with `type="module"`:
```php
Requirements::javascript('mymodule/client/dist/js/my-vue-app.js', ['type' => 'module']);
```

#### Option B: Inline in SilverStripe Template

Mix SS template tags directly with Vue - ideal for injecting server data:

```html
<%-- templates/Includes/MyWidget.ss --%>
<script type="module">
import { createApp } from 'vue'

createApp({
    data() {
        return {
            apiBase: $Ctrl.Link('api').JSON.RAW,
            items: $Items.JSON.RAW,
            currentItem: {
                id: $CurrentItem.ID.JSON,
                title: "$CurrentItem.Title.JS",
                isActive: $CurrentItem.IsActive.JSON.RAW,
            }
        }
    },
    methods: {
        async saveItem() {
            const response = await fetch(this.apiBase + '/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.currentItem)
            });
        }
    }
}).mount('#my-widget-$ID')
</script>

<div id="my-widget-$ID">
    <h3>{{ currentItem.title }}</h3>
    <ul>
        <li v-for="item in items" :key="item.ID">
            {{ item.Title }}
            <% if $ShowExtra %>
                <span class="extra">$ExtraInfo</span>
            <% end_if %>
        </li>
    </ul>
    <button @click="saveItem">{$T('Save')}</button>
</div>
```

**Key patterns:**
- `$Variable.JSON.RAW` for objects/arrays/booleans (raw JSON)
- `"$Variable.JS"` for strings (JS-escaped, in quotes)
- `$ID` or `$HexID` for unique element IDs
- Mix `<% if %>` SS conditionals with Vue `v-show` as needed
- **Prefer `v-show` over `v-if`** - Vue's `v-if` creates comment nodes (`<!--v-if-->`) that trigger Entwine's MutationObserver bug (`el.getAttribute is not a function`)

### 3. Modal Dialog (opt-in)

**Using modal without SimplerModalField** (for devs/modules who need direct access):
```php
// Ensure import map is available (or just configure AdminExtension on LeftAndMain)
AdminExtension::assertImportMapAvailable();

// Load modal JS
Requirements::javascript('restruct/silverstripe-simpler:client/dist/js/simpler-modal.js', ['type' => 'module']);
```

**JavaScript API:**
```js
// Basic modal
simpler.modal.title = 'My Dialog';
simpler.modal.bodyHtml = '<p>Content here</p>';
simpler.modal.show = true;

// All options
simpler.modal.title = 'Confirm Action';
simpler.modal.bodyHtml = '<p>Are you sure?</p>';
simpler.modal.closeBtn = true;
simpler.modal.closeTxt = 'Cancel';
simpler.modal.saveBtn = true;
simpler.modal.saveTxt = 'Confirm';
simpler.modal.static = true;  // Prevent closing via backdrop/Escape
simpler.modal.show = true;

// Loading content via AJAX
simpler.modal.title = 'Loading...';
simpler.modal.bodyHtml = simpler.spinner;
simpler.modal.show = true;
$.get('/my/endpoint', function(html) {
    simpler.modal.bodyHtml = html;
    simpler.modal.title = 'Loaded Content';
});

// Close modal
simpler.modal.show = false;
```

### 3b. PHP FormField Classes (PureModal replacement)

SimplerModalField and SimplerModalAction extend `lekoala/silverstripe-pure-modal` but render via simpler.modal.

**Key advantage:** Modal is appended to `document.body` (outside CMS form), so real forms work without iframe!

```php
use Restruct\Silverstripe\Simpler\SimplerModalField;
use Restruct\Silverstripe\Simpler\SimplerModalAction;

// Iframe content (preview)
SimplerModalField::create('preview', 'Preview')
    ->setIframeSrc('/admin/preview/123')
    ->setIframeHeight('80vh')
    ->setModalSize('xl')  // 'sm', 'lg', 'xl' or '800px', '90vw'
    ->setCloseBtn(false)  // Hide footer close button (default: true)
    ->setButtonIcon('eye');  // 'ss' prefix (default) = font-icon-, 'bs' = bi bi-

// With Bootstrap Icons:
SimplerModalField::create('viewpdf', 'View PDF')
    ->setButtonIcon('file-pdf', 'bs');  // → bi bi-file-pdf

// HTML content
SimplerModalField::create('info', 'Info')
    ->setContent('<p>Some info</p>');

// CMS action with form fields (no iframe needed!)
SimplerModalAction::create('translate', 'Translate')
    ->setFieldList(FieldList::create([
        DropdownField::create('lang', 'Language', $languages),
    ]))
    ->setDialogButtonTitle('Translate');
```

Data attribute pattern - button renders with JSON config:
```html
<button data-simpler-modal='{"title":"Preview","bodyHtml":"..."}'>Preview</button>
```

Generic click handler in simpler-modal.js opens modal from data attribute.

**Modal properties** (all reset to defaults on close):
- `show` (bool) - Show/hide modal
- `title` (string) - Modal title
- `bodyHtml` (string) - Modal body HTML
- `size` (string) - 'sm', 'lg', 'xl' or custom like '800px', '90vw'
- `closeBtn` (bool) - Show close button
- `closeTxt` (string) - Close button text
- `saveBtn` (bool) - Show save/primary button
- `saveTxt` (string) - Save button text
- `static` (bool) - Prevent closing via backdrop click or Escape

### 3c. GridField Modal Components

GridField-specific modal components for different use cases:

#### GridFieldToolbarModalAction (toolbar buttons)

Toolbar buttons that open a modal. Supports two modes:
1. **Form mode**: Modal with form fields + submit button (set `setFieldList()`)
2. **View-only mode**: Modal with static content, no buttons (set `setIframeSrc()` or `setBodyHtml()`)

```php
use Restruct\Silverstripe\Simpler\GridFieldToolbarModalAction;

// Form mode - extend and override handleAction():
class MyGridFieldAction extends GridFieldToolbarModalAction
{
    public function __construct()
    {
        parent::__construct('myaction', 'Do Something');
        $this->setDialogTitle('Configure Action');
        $this->setSubmitLabel('Apply');
        $this->setButtonIcon('rocket');
        $this->setFieldList(FieldList::create([
            DropdownField::create('Option', 'Choose', $options),
            NumericField::create('Count', 'How many'),
        ]));
    }

    public function handleAction(GridField $gridField, $actionName, $arguments, $data)
    {
        if ($actionName !== 'myaction') return;
        $option = $data['Option'] ?? null;
        $count = (int) ($data['Count'] ?? 1);
        // Do something with the form data...
    }
}

// View-only mode - iframe content (e.g., PDF viewer):
$config->addComponent(
    GridFieldToolbarModalAction::create('viewpdf', 'View PDF')
        ->setIframeSrc('/path/to/document.pdf')
        ->setIframeHeight('85vh')
        ->setModalSize('60vw')
        ->setButtonIcon('file-pdf', 'bs')  // 'ss' (default) = font-icon-, 'bs' = bi bi-
        ->setButtonClasses('btn btn-outline-info')
);

// View-only mode - HTML content:
$config->addComponent(
    GridFieldToolbarModalAction::create('preview', 'Preview')
        ->setBodyHtml('<div class="preview">...</div>')
);
```

Key difference from SimplerModalAction:
- **SimplerModalAction** is for DataObject edit forms (FieldList in form actions area)
- **GridFieldToolbarModalAction** is for GridField toolbars (action routing via StateID)

**Error handling:** The AJAX handler reads the response body on HTTP errors and displays it in the modal. To show a meaningful error message, throw an `HTTPResponse_Exception` with a plain-text body:

```php
use SilverStripe\Control\HTTPResponse;
use SilverStripe\Control\HTTPResponse_Exception;

public function handleAction(GridField $gridField, $actionName, $arguments, $data)
{
    try {
        // ... do work
    } catch (\Exception $e) {
        throw new HTTPResponse_Exception(
            new HTTPResponse($e->getMessage(), 422),
        );
    }
}
```

**Full page reload:** By default, on success the modal reloads only the parent GridField. To force a full page reload (e.g., when other tabs also need refreshing), set the `X-Reload` response header:

```php
use SilverStripe\Control\Controller;

// In handleAction(), after successful work:
Controller::curr()->getResponse()->addHeader('X-Reload', 'true');
```

#### GridFieldModalButton (row buttons)

For per-row buttons in a GridField column that open a modal:

```php
use Restruct\Silverstripe\Simpler\GridFieldModalButton;

class MyDetailButton extends GridFieldModalButton
{
    protected function getButtonLabel(DataObject $record): string
    {
        return 'Details';
    }

    protected function getModalTitle(DataObject $record): string
    {
        return 'Details for ' . $record->Title;
    }

    protected function getModalContent(DataObject $record): string
    {
        return '<p>' . htmlspecialchars($record->Description) . '</p>';
    }

    protected function shouldShowButton(DataObject $record): bool
    {
        return $record->canView();
    }
}

// Add to GridField config:
$config->addComponent(new MyDetailButton());
```

#### GridFieldToggleFieldButton (row toggle buttons)

For per-row buttons that cycle a field through values:

```php
use Restruct\Silverstripe\Simpler\GridFieldToggleFieldButton;
use Restruct\Silverstripe\Simpler\GridFieldToggleIsActiveButton;

// Pre-configured for IsActive boolean field
$config->addComponent(GridFieldToggleIsActiveButton::create());

// Generic boolean toggle
$config->addComponent(GridFieldToggleFieldButton::create('IsPublished'));

// Multi-state cycling
$config->addComponent(
    GridFieldToggleFieldButton::create('Status')
        ->setStates([
            'draft' => ['icon' => 'edit', 'title' => 'Submit for Review'],
            'review' => ['icon' => 'eye', 'title' => 'Publish'],
            'published' => ['icon' => 'check-mark', 'title' => 'Archive'],
            // Optional: 'iconPrefix' => 'bs' for Bootstrap Icons, 'ss' (default) for font-icon-
        ])
        ->setConfirmMessage('Change status?')
);

// With callbacks
GridFieldToggleFieldButton::create('IsActive')
    ->setStateRenderer(fn($record, $value) => [
        'icon' => $record->getStatusIcon(),
        'iconPrefix' => 'bs',  // 'ss' (default), 'bs', or false
        'title' => $record->getNextStatusLabel(),
    ])
    ->setShouldShow(fn($record) => $record->canEdit())
    ->setToggleAction(function($record, $newValue) {
        $record->IsActive = $newValue;
        $record->ModifiedDate = DBDatetime::now();
    });
```

### 4. EditProtectedTextField

A TextField that starts in read-only mode with an edit button. Uses Entwine for proper CMS integration.

```php
use Restruct\Silverstripe\Simpler\EditProtectedTextField;

// In getCMSFields():
$fields->replaceField('SensitiveField',
    EditProtectedTextField::create('SensitiveField', 'Sensitive Field Label')
);
```

Features:
- Shows value as readonly input with edit button (font-icon-edit-write)
- Click edit → input becomes editable, button changes to cancel (font-icon-cancel)
- If value is modified (dirty), button changes to revert (font-icon-back-in-time)
- Click cancel/revert → resets value and returns to readonly mode

Uses Entwine (bundled in simpler-silverstripe.js) - works with dynamic/AJAX content.

### 5. Static Session Helpers

```php
use Restruct\Silverstripe\Simpler\Session;

$value = Session::get('key');
Session::set('key', 'value');
Session::clear('key');
Session::clearAll();
```

### 6. HeadRequirements (import maps, early scripts)

For scripts that must be in `<head>` (import maps, early config):

```php
use Restruct\Silverstripe\Simpler\HeadRequirements;

// Import map entries (browsers allow only ONE import map - these accumulate)
HeadRequirements::import_map('vue', 'restruct/silverstripe-simpler:client/dist/js/vue.esm-browser.js');
HeadRequirements::import_map('lodash', 'https://cdn.jsdelivr.net/npm/lodash-es@4/lodash.min.js');

// JavaScript file in <head>
HeadRequirements::javascript('mymodule:client/dist/js/early-script.js');
HeadRequirements::javascript('https://cdn.example.com/lib.js', ['defer' => true]);

// Inline script in <head>
HeadRequirements::custom_script('window.CONFIG = { debug: true }', 'my-config');
```

Also available as template globals: `$HeadReq_importMap()`, `$HeadReq_js()`, `$HeadReq_customScript()`.

## Technical Notes

- **MutationObserver** watches document for DOM changes, batched at 100ms
- **React Form wrapper** via `Injector.transform()` emits mount/unmount events
- **jQuery** is framework-provided (external), aliased to `$`
- **Bootstrap 4 modal** jQuery plugin bundled in simpler-modal.js
- **Vue 3** bundled with template compiler in simpler-modal.js
- **Import map** auto-switches between dev/prod Vue based on `Director::isDev()`

## Known Issues

### Entwine + Vue Conflict

Vue components in CMS forms can trigger `TypeError: el.getAttribute is not a function` due to Entwine's MutationObserver not filtering non-Element nodes.

**Solution:** Error suppression implemented in `simpler-silverstripe.js` - Vue components now work in CMS forms.

See [docs/ENTWINE_VUE_CONFLICT.md](docs/ENTWINE_VUE_CONFLICT.md) for full details, what was tried, alternatives, and future investigation options.

## Version Notes

- **Branch ss5**: SilverStripe 5 compatible (Vue 3)
- **Tag 0.1.9**: SilverStripe 5 compatible (Vue 2, legacy)
- **main branch**: SilverStripe 6
