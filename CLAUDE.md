# CLAUDE.md - Simpler Silverstripe Module

**Package:** `restruct/silverstripe-simpler`
**Namespace:** `Restruct\Silverstripe\Simpler`
**Current Tag:** `0.1.9` (SS5 compatible - main branch is for SS6)

## Purpose

Makes SilverStripe Admin development simpler by re-introducing traditional basics:

1. **Synthetic DOM Events** - `DOMNodesInserted`/`DOMNodesRemoved` for JS initialization on dynamic content
2. **Modal Dialog** (opt-in) - Bootstrap 4 modal via global `simpler.modal` object
3. **Static Session Helpers** - `Session::get()`/`set()` instead of `$this->getRequest()->getSession()->get()`

## What SilverStripe Admin Provides

SilverStripe Admin bundles several JS libraries, but understanding what's available vs what's missing is important:

### Available (via webpack externals)

| Library | Global | Notes |
|---------|--------|-------|
| **jQuery 3** | `jQuery` | Core library, NOT aliased to `$` by default |
| **React/ReactDOM** | `React`, `ReactDom` | Core React libraries |
| **Redux** | `Redux`, `ReactRedux` | State management |
| **Reactstrap** | `Reactstrap` | Bootstrap 4 **React components** (see below) |
| **Injector** | `Injector` | SilverStripe's dependency injection for React |
| **moment.js** | `moment` | Date/time handling |

See full list: [silverstripe/webpack-config externals.js](https://github.com/silverstripe/webpack-config/blob/master/js/externals.js)

### What is Reactstrap?

**Reactstrap is NOT regular Bootstrap.** It's Bootstrap 4 rebuilt as pure React components:
- Provides Bootstrap 4 **CSS styling** (the look)
- Provides Bootstrap components as **React components** (`<Modal>`, `<Button>`, etc.)
- Does **NOT** provide Bootstrap's **jQuery plugins** (`.modal()`, `.collapse()`, etc.)

This means traditional Bootstrap JS like `$('#myModal').modal('show')` won't work out of the box.

### What We Bundle

Because Reactstrap doesn't include jQuery plugins, this module bundles:
- **Vue 2.6** - For reactive data binding on the modal
- **Bootstrap 4 modal plugin** - Just the modal jQuery plugin, not full Bootstrap JS

## File Structure

```
a-simpler/
├── _config/config.yml              # Loads assets via extra_requirements
├── src/
│   └── Session.php                 # Static session accessor class
├── templates/
│   ├── Includes/
│   │   └── SimplerAdminItems.ss    # XHR buffer template
│   └── SilverStripe/Admin/Includes/
│       └── CMSLoadingScreen.ss     # Template override to include SimplerAdminItems
├── client/
│   ├── src/js/
│   │   ├── simpler-domevents-emulator.js   # window.simpler_dom + MutationObserver
│   │   ├── react-mountevents-emitter.js    # Injector transform for Form component
│   │   └── simpler-silverstripe.js         # Vue + BS4 modal (self-contained, no SS template)
│   ├── src/styles/
│   │   └── simpler-silverstripe.scss
│   └── dist/js/
│       ├── simpler-domevents.js            # Auto-loaded (combined emulator + react)
│       └── simpler-silverstripe.js         # Opt-in bundle (~445kb)
├── webpack.mix.js
└── package.json
```

## Usage

### 1. DOM Events (auto-loaded)

Listen for dynamically inserted content in admin:

```js
document.addEventListener("DOMNodesInserted", function(event) {
    console.log('Type:', event.detail.type); // LOAD, MUTATION, MOUNT, UNMOUNT
    console.log('Target:', event.target);    // Element or document

    // Initialize your JS on new content
    initMyPlugin();
});

document.addEventListener("DOMNodesRemoved", function(event) {
    // Cleanup when content is removed
    destroyMyPlugin();
});
```

**Event types:**
- `LOAD` - Initial DOMContentLoaded
- `MUTATION` - MutationObserver detected DOM changes
- `MOUNT` - React Form component mounted (triggered on specific element)
- `UNMOUNT` - React Form component will unmount

### 2. Modal Dialog (opt-in)

First, enable in your config:

```yaml
# mymodule/_config/config.yml
SilverStripe\Admin\LeftAndMain:
  extra_requirements_javascript:
    - 'restruct/silverstripe-simpler:client/dist/js/simpler-silverstripe.js'
```

Then use in JS:

```js
// Open modal
simpler.modal.show = true;
simpler.modal.title = 'My Dialog';
simpler.modal.bodyHtml = '<p>Content here</p>';
simpler.modal.closeBtn = true;
simpler.modal.closeTxt = 'Cancel';
simpler.modal.saveBtn = true;
simpler.modal.saveTxt = 'Save';

// Show loading spinner then load content
simpler.modal.bodyHtml = simpler.spinner;
$.get('/my/ajax/endpoint', function(html) {
    simpler.modal.bodyHtml = html;
});

// Close modal
simpler.modal.show = false;
```

### 3. Static Session Helpers

```php
use Restruct\Silverstripe\Simpler\Session;

// Instead of: $this->getRequest()->getSession()->get('key')
$value = Session::get('key');
Session::set('key', 'value');
Session::clear('key');
Session::clearAll();
```

## Configuration

Default config (auto-applied):

```yaml
SilverStripe\Admin\LeftAndMain:
  extra_requirements_css:
    - 'restruct/silverstripe-simpler:client/dist/styles/simpler-silverstripe.css'
  extra_requirements_javascript:
    - 'restruct/silverstripe-simpler:client/dist/js/simpler-domevents.js'
    # Opt-in for modal + Vue (also makes framework's jQuery available as '$'):
    # - 'restruct/silverstripe-simpler:client/dist/js/simpler-silverstripe.js'
```

The `SimplerAdminItems.ss` include is injected via template override (`CMSLoadingScreen.ss`).

## Build (for development)

```bash
cd a-simpler
yarn install
yarn run dev        # Development build (watch)
yarn run production # Production build
```

## Technical Notes

- **MutationObserver** watches entire document for DOM changes, debounces at 100ms
- **React integration** via `Injector.transform()` wrapping Form component
- **jQuery** is framework-provided (external), we alias it to `$` and `window.$`
- **Bootstrap 4 modal plugin** is bundled (Reactstrap doesn't include jQuery plugins)
- **Vue 2.6** is bundled for reactive modal data binding
- **Modal is self-contained in JS** - Vue renders it with explicit template, no SS template needed
- Uses SilverStripe webpack externals for React, ReactDOM, Injector compatibility

## Known Issues

### `el.getAttribute is not a function` error when opening modal

When opening the modal, you may see this console error:
```
Uncaught TypeError: el.getAttribute is not a function
    at r.eval [as matches] (eval at <anonymous> (vendor.js...
```

This is a **SilverStripe core bug** in jQuery entwine's selector matching code. When the modal opens/closes, DOM mutations trigger entwine to match selectors against mutation nodes, but it fails on text nodes which don't have `getAttribute()`.

The error is non-fatal - the modal works correctly despite the error.

## Version Notes

- **Tag 0.1.9**: SilverStripe 5 compatible (use this for SS5 projects)
- **main branch**: SilverStripe 6 (do not use for SS5)
