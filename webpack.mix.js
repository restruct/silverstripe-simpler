const mix = require('laravel-mix');

mix.setPublicPath('client/dist');
mix.setResourceRoot('../');

mix.sass('client/src/styles/simpler-silverstripe.scss', 'styles');

// Copy Vue 3 builds for import map usage (devs can use Vue in their own ES modules)
mix.copy('node_modules/vue/dist/vue.esm-browser.js', 'client/dist/js/vue.esm-browser.js');
mix.copy('node_modules/vue/dist/vue.esm-browser.prod.js', 'client/dist/js/vue.esm-browser.prod.js');

// Core bundle (always loaded): DOM events, React mount events, window.simpler
// Regular script - externals resolve to window globals (React, ReactDom, Injector)
mix.js('client/src/js/simpler-silverstripe.js', 'js').webpackConfig({
    resolve: {
        alias: {
            'jquery': __dirname + '/client/src/js/jquery-shim.js',
        }
    },
    externals: {
        'react': 'React',
        'react-dom': 'ReactDom',
        'lib/Injector': 'Injector',
    }
});
