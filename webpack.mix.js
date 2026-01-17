const mix = require('laravel-mix');

mix.setPublicPath('client/dist');
mix.setResourceRoot('../');

mix.sass('client/src/styles/simpler-silverstripe.scss', 'styles');

// mix.scripts = basic concattenation
// mix.babel = concattenation + babel (ES2015 -> vanilla)
// mix.js = components, react, vue, etc
mix.js([
    'client/src/js/simpler-domevents-emulator.js',
    'client/src/js/react-mountevents-emitter.js',
], 'js/simpler-domevents.js');
mix.js('client/src/js/simpler-silverstripe.js', 'js');
// mix.js('client/src/js/vue-component.js', 'js');
// mix.js('client/src/js/react-mountevents-emitter.js', 'js');
// mix.js('client/src/js/vue-component.js', 'js');

mix.autoload({
    // make webpack prepend var $ = require('jquery') to every $, jQuery or window.jQuery
    // (this will result in jQuery being compiled-in, even though it may be provided externally)
//    jquery: ['$', 'jQuery', 'window.jQuery'],
    'vue$': 'vue/dist/vue.esm.js' // required to load the x/y version of vue (with compiler)
});

mix.webpackConfig({
    resolve: {
        alias: {
            'vue$': 'vue/dist/vue.esm.js'
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
