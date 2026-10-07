// Simpler Silverstripe - classic-script loader for the modal module (#15)
//
// simpler-modal.js is an ES module (it imports Vue through the import map). On a full CMS page load
// AdminExtension::requireModal() adds it as <script type="module">. But when the screen that needs
// it is reached through CMS navigation (menu, tab, breadcrumb: pjax), the admin's jquery.ondemand
// loads the response's X-Include-JS scripts with $.ajax({dataType: 'script'}), i.e. as CLASSIC
// scripts, and a module evaluated that way throws "Cannot use import statement outside a module".
// So for AJAX requests requireModal() adds this file instead: plain classic code that imports the
// module with a dynamic import(), which classic scripts may use.
//
// Not bundled by webpack on purpose (webpack.mix.modal.js copies it as-is): webpack would turn the
// import() into its own chunk loading. Keep it ES5-plus-import() and self-contained.
//
// Its own URL is unknown here (ondemand evaluates the code inline), so the module URL comes from
// the core bundle, which records it on the first page load (window.simpler.modalUrl).
(function () {
    var simpler = window.simpler;
    // Already on the page (full page load, or simpler_include_modal), or already being loaded
    if (!simpler || simpler.modal || simpler.modalLoading) {
        return;
    }
    if (!simpler.modalUrl) {
        console.error('[Simpler] Cannot load the modal: simpler-silverstripe.js did not record its URL (window.simpler.modalUrl).');
        return;
    }
    simpler.modalLoading = import(simpler.modalUrl).catch(function (err) {
        // Let a later navigation try again
        simpler.modalLoading = null;
        console.error('[Simpler] Loading the modal failed:', err);
    });
})();
