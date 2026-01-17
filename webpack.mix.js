const mix = require('laravel-mix');

mix.setPublicPath('client/dist');
mix.setResourceRoot('../');

mix.sass('client/src/styles/simpler-silverstripe.scss', 'styles');

// Core bundle (always loaded): DOM events, React mount events, jQuery alias, window.simpler
mix.js('client/src/js/simpler-silverstripe.js', 'js');

// Modal bundle (opt-in): Bootstrap 4 modal + Vue 3 modal app
mix.js('client/src/js/simpler-modal.js', 'js');

// Copy Vue 3 builds for import map usage (devs can use Vue in their own ES modules)
// Dev build: warnings, devtools (~530kb)
mix.copy('node_modules/vue/dist/vue.esm-browser.js', 'client/dist/js/vue.esm-browser.js');
// Prod build: minified (~162kb)
mix.copy('node_modules/vue/dist/vue.esm-browser.prod.js', 'client/dist/js/vue.esm-browser.prod.js');

mix.webpackConfig({
    resolve: {
        alias: {
            // Vue 3 has two bundler builds:
            // - vue.runtime.esm-bundler.js (~50kb) - Runtime only, NO template compiler
            // - vue.esm-bundler.js (~70kb) - Full build WITH template compiler
            //
            // We need the template compiler because simpler-modal.js uses inline template strings:
            //   template: `<div class="modal">...</div>`
            //
            // Without this alias, webpack uses the runtime-only build and you get:
            //   "Component provided template option but runtime compilation is not supported"
            //
            // Alternative would be pre-compiled SFCs (.vue files + vue-loader), but we
            // deliberately avoid that for simplicity and because SFC bundling caused issues.
            'vue': 'vue/dist/vue.esm-bundler.js'
        }
    },
    externals: {
        // Externals will not be compiled-in (eg import $ from 'jQuery', combined with external 'jquery': 'jQuery' means jQuery gets provided externally)
        // For external modules provided by SilverStripe see: https://github.com/silverstripe/webpack-config/blob/master/js/externals.js
        'apollo-client': 'ApolloClient',
        'bootstrap-collapse': 'BootstrapCollapse',
        classnames: 'classnames',
        'deep-freeze-strict': 'DeepFreezeStrict',
        'graphql-fragments': 'GraphQLFragments',
        'graphql-tag': 'GraphQLTag',
        'isomorphic-fetch': 'IsomorphicFetch',
        i18n: 'i18n',
        jquery: 'jQuery', // Use framework's jQuery instead of bundling our own
        merge: 'merge',
        'page.js': 'Page',
        'react-dom/test-utils': 'ReactAddonsTestUtils',
        'react-dom': 'ReactDom',
        poppers: 'Poppers',
        reactstrap: 'Reactstrap',
        'react-apollo': 'ReactApollo',
        'react-redux': 'ReactRedux',
        'react-router-dom': 'ReactRouterDom',
        'react-select': 'ReactSelect',
        react: 'React',
        'redux-form': 'ReduxForm',
        'redux-thunk': 'ReduxThunk',
        redux: 'Redux',
        config: 'Config',
        url: 'NodeUrl',
        qs: 'qs',
        moment: 'moment',
        modernizr: 'modernizr',
        'react-dnd': 'ReactDND',
        'react-dnd-html5-backend': 'ReactDNDHtml5Backend',
        validator: 'validator',
        'prop-types': 'PropTypes',

        // provided by silverstripe or modules
        'components/Accordion/Accordion': 'Accordion',
        'components/Accordion/AccordionBlock': 'AccordionBlock',
        'components/Button/Button': 'Button',
        'components/Button/BackButton': 'BackButton',
        'components/Breadcrumb/Breadcrumb': 'Breadcrumb',
        'components/FormAction/FormAction': 'FormAction',
        'components/FormBuilder/FormBuilder': 'FormBuilder',
        'components/FormBuilderModal/FormBuilderModal': 'FormBuilderModal',
        'components/FileStatusIcon/FileStatusIcon': 'FileStatusIcon',
        'components/FieldHolder/FieldHolder': 'FieldHolder',
        'components/GridField/GridField': 'GridField',
        'components/Toolbar/Toolbar': 'Toolbar',
        'components/LiteralField/LiteralField': 'LiteralField',
        'components/Preview/Preview': 'Preview',
        'components/ListGroup/ListGroup': 'ListGroup',
        'components/ListGroup/ListGroupItem': 'ListGroupItem',
        'components/Loading/Loading': 'Loading',
        'components/FormAlert/FormAlert': 'FormAlert',
        'components/Badge/Badge': 'Badge',
        'components/VersionedBadge/VersionedBadge': 'VersionedBadge',
        'components/TreeDropdownField/TreeDropdownField': 'TreeDropdownField',
        'components/Focusedzone/Focusedzone': 'Focusedzone',
        'components/ViewModeToggle/ViewModeToggle': 'ViewModeToggle',
        'components/ResizeAware/ResizeAware': 'ResizeAware',
        'components/Tag/Tag': 'Tag',
        'components/Tag/TagList': 'TagList',
        'components/Tag/CompactTagList': 'CompactTagList',
        'components/Search/Search': 'Search',
        'components/Search/SearchToggle': 'SearchToggle',
        'containers/FormBuilderLoader/FormBuilderLoader': 'FormBuilderLoader',
        'containers/InsertMediaModal/InsertMediaModal': 'InsertMediaModal',
        'containers/InsertLinkModal/InsertLinkModal': 'InsertLinkModal',
        'containers/InsertLinkModal/fileSchemaModalHandler': 'FileSchemaModalHandler',
        'state/breadcrumbs/BreadcrumbsActions': 'BreadcrumbsActions',
        'state/schema/SchemaActions': 'SchemaActions',
        'state/toasts/ToastsActions': 'ToastsActions',
        'state/records/RecordsActions': 'RecordsActions',
        'state/records/RecordsActionTypes': 'RecordsActionTypes',
        'state/tabs/TabsActions': 'TabsActions',
        'state/viewMode/ViewModeActions': 'ViewModeActions',
        'lib/DataFormat': 'DataFormat',
        'lib/Backend': 'Backend',
        'lib/getFormState': 'getFormState',
        'lib/ReactRouteRegister': 'ReactRouteRegister',
        'lib/ReducerRegister': 'ReducerRegister',
        'lib/SilverStripeComponent': 'SilverStripeComponent',
        'lib/formatWrittenNumber': 'formatWrittenNumber',
        'lib/Router': 'Router',
        'lib/schemaFieldValues': 'schemaFieldValues',
        'lib/Config': 'Config',
        'lib/Injector': 'Injector',
        'lib/reduxFieldReducer': 'reduxFieldReducer',
        'lib/TinyMCEActionRegistrar': 'TinyMCEActionRegistrar',
        'lib/ShortcodeSerialiser': 'ShortcodeSerialiser',
        'lib/withDragDropContext': 'withDragDropContext',
    }
});
