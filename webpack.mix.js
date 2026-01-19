const mix = require('laravel-mix');

mix.setPublicPath('client/dist');
mix.setResourceRoot('../');

mix.sass('client/src/styles/simpler-silverstripe.scss', 'styles');

// Core bundle (always loaded): DOM events, React mount events, jQuery alias, window.simpler
mix.js('client/src/js/simpler-silverstripe.js', 'js');

// Modal bundle (opt-in): Bootstrap 4 modal plugin + Vue 3 modal app
// Vue externalized via import map, jQuery via window.jQuery shim
mix.js('client/src/js/simpler-modal.js', 'js').webpackConfig({
    externals: {
        'vue': 'vue'  // Only externalize Vue (uses import map)
    },
    output: {
        library: { type: 'module' }
    },
    experiments: { outputModule: true }
});

// Copy Vue 3 builds for import map usage (devs can use Vue in their own ES modules)
// Dev build: warnings, devtools (~530kb)
mix.copy('node_modules/vue/dist/vue.esm-browser.js', 'client/dist/js/vue.esm-browser.js');
// Prod build: minified (~162kb)
mix.copy('node_modules/vue/dist/vue.esm-browser.prod.js', 'client/dist/js/vue.esm-browser.prod.js');

mix.webpackConfig({
    resolve: {
        alias: {
            // jQuery: Use SilverStripe's global window.jQuery instead of bundling
            // The shim just exports window.jQuery - works for both regular and ES module bundles
            'jquery': __dirname + '/client/src/js/jquery-shim.js',

            // Vue 3: Use full build WITH template compiler (not runtime-only)
            // Needed because simpler-modal.js uses inline template strings
            'vue': 'vue/dist/vue.esm-bundler.js'
        }
    },
    externals: {
        // Externals are not compiled in - the import resolves to a global variable at runtime
        // E.g. `import React from 'react'` becomes `const React = window.React`
        // For SilverStripe-provided modules see: https://github.com/silverstripe/webpack-config/blob/master/js/externals.js
        //
        // NOTE: We use resolve.alias for jQuery instead of externals because simpler-modal.js
        // is built as an ES module. Externals in ES module output become `import from "jQuery"`
        // which fails because jQuery has no ESM build and isn't in our import map.
        // The alias approach inlines the shim code which just returns window.jQuery.
        'react': 'React',
        'react-dom': 'ReactDom',
        'lib/Injector': 'Injector',
    }
});
