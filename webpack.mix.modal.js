const mix = require('laravel-mix');

mix.setPublicPath('client/dist');
mix.setResourceRoot('../');

// Modal bundle (opt-in): Bootstrap modal + Vue 3 modal app
// ES module - uses import map for Vue (Bootstrap 5 doesn't need jQuery)
// Bundles BOTH the Bootstrap 4 jQuery plugin (SS5 admin CSS) and the Bootstrap 5 modal (SS6 admin CSS);
// simpler-modal.js picks one at runtime. The Bootstrap 4 plugin imports 'jquery', hence the shim alias.
mix.js('client/src/js/simpler-modal.js', 'js').webpackConfig({
    resolve: {
        alias: {
            'jquery': __dirname + '/client/src/js/jquery-shim.js',
            'vue': 'vue/dist/vue.esm-bundler.js'
        }
    },
    externals: {
        'vue': 'vue'  // Uses import map
    },
    output: {
        library: { type: 'module' }
    },
    experiments: { outputModule: true }
});
