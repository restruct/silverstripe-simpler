# Entwine + Vue Conflict

## Problem

SilverStripe's Entwine library has a MutationObserver that doesn't filter out non-Element nodes (comment nodes, text nodes). When Vue mounts and processes directives, it creates internal DOM structures that trigger Entwine's observer, causing:

```
TypeError: el.getAttribute is not a function
```

## Solution

This module includes an error suppression handler in `simpler-silverstripe.js` that catches and prevents this specific error:

```js
window.addEventListener('error', (e) => {
    if (e.message && e.message.includes('getAttribute is not a function')) {
        console.debug('[Simpler] Suppressed Entwine/Vue conflict:', e.message);
        e.preventDefault();
        return true;
    }
});
```

This allows Vue components to work in CMS forms without breaking functionality.

## What doesn't work (for reference)

These approaches were tried and do NOT resolve the issue:

- Using `v-show` instead of `v-if` - Vue still creates internal structures on mount
- Delaying mount with `setTimeout(..., 0)`
- Double `requestAnimationFrame()` delay
- The error occurs on initial page load when the page contains Vue elements

## When Vue is safe (without error suppression)

- Modal dialogs appended to `document.body` (outside CMS form hierarchy) - e.g., `simpler.modal`
- Content loaded via AJAX into the modal body (parsed through xhr_buffer first)

## Alternative: Use Entwine instead of Vue

For simple interactive FormFields inside CMS forms, Entwine (SilverStripe's native jQuery-based initialization system) is a viable alternative:

```js
jQuery.entwine('mymodule', function($) {
    $('.my-interactive-field').entwine({
        onmatch: function() {
            // Initialize - fires when element appears in DOM
            this._super();
        },
        onunmatch: function() {
            // Cleanup - fires when element is removed
            this._super();
        }
    });
});
```

**Trade-off:** Entwine requires building all dynamic content in JavaScript, losing Vue's declarative templates (`v-show`, `:class`, `{{ variable }}`).

## Future investigation options

1. **Patch Entwine's MutationObserver** - Intercept/replace Entwine's observer to filter `nodeType !== 1`:
   ```js
   // Early in page load, before Entwine initializes?
   const originalObserve = MutationObserver.prototype.observe;
   MutationObserver.prototype.observe = function(target, config) {
       // Wrap callback to filter non-Element nodes?
   };
   ```

2. **Wrap Vue in ignored container** - Check if Entwine skips certain elements (class/attribute):
   - Does `.no-entwine` or `data-no-entwine` exist?
   - Could we add such a feature via early JS?

3. **Intercept mutations for Vue containers** - Custom observer that "captures" Vue mutations before Entwine sees them

4. **Monkey-patch the Entwine function** - Find and wrap the specific function in vendor.js that calls `getAttribute`:
   - Would need to identify the exact function in minified vendor.js
   - Wrap it with `if (el.nodeType !== 1) return;` check

**Issue location:** SilverStripe's bundled `vendor.js` - we can't easily modify it, but we might be able to intercept/wrap it early enough.
