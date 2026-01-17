# Simpler Silverstripe

Makes SilverStripe Admin development simpler by re-introducing traditional basics.

## Features

| Feature | Size | Loaded |
|---------|------|--------|
| **DOM Events** - `DOMNodesInserted`/`DOMNodesRemoved` for dynamic content | ~5kb | Always |
| **Vue 3 Import Map** - Use Vue in your own ES modules | ~162kb | Opt-in |
| **Modal Dialog** - Bootstrap 4 modal via `simpler.modal` | ~192kb | Opt-in |
| **Static Session** - `Session::get()` instead of `$this->getRequest()->getSession()->get()` | - | Always |

## Installation

```bash
composer require restruct/silverstripe-simpler
```

## 1. DOM Events (always loaded)

Listen for dynamically inserted content (Ajax, React components):

```js
document.addEventListener("DOMNodesInserted", function(event) {
    console.log('Type:', event.detail.type); // LOAD, MUTATION, MOUNT, UNMOUNT
    console.log('Target:', event.target);

    // Initialize your plugins on new content
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
- `MOUNT` - React Form component mounted (on specific element)
- `UNMOUNT` - React Form component will unmount

## 2. Vue 3 Import Map (opt-in)

For using Vue 3 in your own code, add the extension:

```yaml
# app/_config/config.yml
SilverStripe\Admin\LeftAndMain:
  extensions:
    - Restruct\Silverstripe\Simpler\AdminExtension
```

This injects an import map that makes Vue available via `import { createApp } from 'vue'`. The extension automatically uses the dev build (with warnings/devtools) or prod build based on environment.

### Option A: Self-Contained ES Module File

Create a JS file (not webpack-bundled) and load it as a module:

```js
// mymodule/client/dist/js/my-vue-app.js
import { createApp, ref } from 'vue';

document.addEventListener('DOMContentLoaded', () => {
    createApp({
        setup() {
            const count = ref(0);
            return { count };
        },
        template: `<button @click="count++">Clicked {{ count }} times</button>`
    }).mount('#my-app');
});
```

Load via Requirements with `type="module"`:

```php
use SilverStripe\View\Requirements;

Requirements::javascript('mymodule/client/dist/js/my-vue-app.js', ['type' => 'module']);
```

### Option B: Inline in SilverStripe Template

Mix SS template tags directly with Vue - ideal for injecting server data into Vue components:

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
            // handle response...
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

    <button @click="saveItem" class="btn btn-primary">
        {$T('Save')}
    </button>

</div>
```

**Key patterns:**
- Use `$Variable.JSON.RAW` for objects/arrays/booleans (raw JSON, no escaping)
- Use `"$Variable.JS"` for strings (JS-escaped, in quotes)
- Use `$ID` or `$HexID` to make element IDs unique when template is used multiple times
- Mix `<% if %>` SS conditionals with Vue `v-if` directives as needed
- Use `{$T('Label')}` or `$fieldLabel('Name')` for translated strings in HTML

## 3. Modal Dialog (opt-in)

Add to your project config:

```yaml
# app/_config/config.yml
SilverStripe\Admin\LeftAndMain:
  extra_requirements_javascript:
    - 'restruct/silverstripe-simpler:client/dist/js/simpler-modal.js'
```

### Basic Usage

```js
simpler.modal.title = 'My Dialog';
simpler.modal.bodyHtml = '<p>Hello world!</p>';
simpler.modal.show = true;
```

### All Options

```js
simpler.modal.title = 'Confirm Action';
simpler.modal.bodyHtml = '<p>Are you sure?</p>';
simpler.modal.closeBtn = true;      // Show close button (default: true)
simpler.modal.closeTxt = 'Cancel';  // Close button text (default: "Close")
simpler.modal.saveBtn = true;       // Show primary button (default: true)
simpler.modal.saveTxt = 'Confirm';  // Primary button text (default: "Save")
simpler.modal.static = true;        // Prevent closing via backdrop/Escape (default: false)
simpler.modal.show = true;
```

### Loading Content via AJAX

```js
simpler.modal.title = 'Loading...';
simpler.modal.bodyHtml = simpler.spinner;  // Built-in loading spinner
simpler.modal.show = true;

$.get('/my/ajax/endpoint', function(html) {
    simpler.modal.bodyHtml = html;
    simpler.modal.title = 'Content Loaded';
});
```

All properties reset to defaults when the modal gets closed.

## 4. Static Session Helpers

```php
use Restruct\Silverstripe\Simpler\Session;

// Instead of: $this->getRequest()->getSession()->get('key')
$value = Session::get('key');
Session::set('key', 'value');
Session::clear('key');
Session::clearAll();
```

## Configuration Summary

```yaml
# Default (auto-applied by module):
SilverStripe\Admin\LeftAndMain:
  extra_requirements_javascript:
    - 'restruct/silverstripe-simpler:client/dist/js/simpler-silverstripe.js'

# Opt-in Vue Import Map (add to your config):
SilverStripe\Admin\LeftAndMain:
  extensions:
    - Restruct\Silverstripe\Simpler\AdminExtension

# Opt-in Modal (add to your config):
SilverStripe\Admin\LeftAndMain:
  extra_requirements_javascript:
    - 'restruct/silverstripe-simpler:client/dist/js/simpler-modal.js'
```

## Development

```bash
cd a-simpler
yarn install
yarn run dev        # Watch mode
yarn run production # Production build
```

## Version Notes

- **Branch ss5**: SilverStripe 5 (Vue 3)
- **Tag 0.1.9**: SilverStripe 5 (Vue 2, legacy)
- **main**: SilverStripe 6
