const mix = require('laravel-mix');

mix.setPublicPath('client/dist');
mix.setResourceRoot('../');

// Modal bundle (opt-in): Bootstrap 4 modal plugin + Vue 3 modal app
// ES module - uses import map for Vue, shim for jQuery
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
