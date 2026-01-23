const mix = require('laravel-mix');

mix.setPublicPath('client/dist');
mix.setResourceRoot('../');

// Modal bundle (opt-in): Bootstrap modal + Vue 3 modal app
// ES module - uses import map for Vue (Bootstrap 5 doesn't need jQuery)
mix.js('client/src/js/simpler-modal.js', 'js').webpackConfig({
    resolve: {
        alias: {
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
