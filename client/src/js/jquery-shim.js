/**
 * jQuery Shim - Provides window.jQuery to modules that import 'jquery'
 *
 * WHY THIS EXISTS:
 * ----------------
 * SilverStripe provides jQuery as a global (window.jQuery). Normally we'd use webpack
 * externals to access it: `externals: { 'jquery': 'jQuery' }` which transforms
 * `import jQuery from 'jquery'` into `var jQuery = window.jQuery`.
 *
 * THE PROBLEM:
 * When building ES modules (simpler-modal.js uses `output: { library: { type: 'module' } }`
 * to work with Vue import maps), webpack converts externals to ES imports:
 *   `import jQuery from 'jquery'` becomes `import * from "jQuery"`
 *
 * This fails because the browser tries to fetch "jQuery" from the import map, but
 * jQuery has no ESM build - it only exists as a global variable.
 *
 * THE SOLUTION:
 * Use resolve.alias to point 'jquery' to this shim file. Webpack inlines this tiny
 * code instead of creating an external import. Any `import $ from 'jquery'` gets
 * `window.jQuery` at runtime.
 *
 * WHO USES THIS:
 * - Bootstrap's modal plugin (internally imports 'jquery')
 * - simpler-silverstripe.js (imports 'jquery' for React Injector integration)
 *
 * This shim does NOT set window.$ - add that yourself if needed:
 *   Requirements::customScript('window.$ = window.$ || window.jQuery;', 'jquery-alias');
 */
export default window.jQuery;

