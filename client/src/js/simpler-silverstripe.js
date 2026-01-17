// Use framework's jQuery (marked as external in webpack.mix.js)
import jQuery from 'jquery';
// Bootstrap 4 modal plugin only (requires jQuery, extends $.fn.modal)
import 'bootstrap/js/dist/modal';
// Vue 2 with template compiler (explicit path to ensure full build is used)
import Vue from 'vue/dist/vue.esm.js';

// Global 'simpler' object to hold various data like modal content etc, watched by Vue to trigger required behaviour
// "Uhm, why are you not using Vuex/Redux/some other complex way?" – Because why would I.
window.simpler = {
    // spinner HTML template (sr-only for BS4)
    spinner: '<div class="text-center p-3"><div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div></div>',
    // modal
    modal: {
        show: false,
        title: "...",
        bodyHtml: "...",
        closeBtn: true,
        closeTxt: "Close",
        saveBtn: true,
        saveTxt: "Save",
    }
};

//
// Run early on to set some basics
//
(function() {
    // 'alias' framework's jQuery 3 to '$' (if depending on legacy jQueery, add an 'alias' in your JS)
    window.$ = jQuery;
    window.Vue = Vue; // global VueJS (v2)

    // // DEV: output DOMNodesInserted & DOMNodesRemoved info
    // document.addEventListener('DOMNodesInserted', (event) => {
    //
    //     console.log('RECEIVING (document): DOMNodesInserted', event);
    //
    //     // $('.vue-instance').not('.vue-inited').each(function (){
    //     //     console.log('Paint it RED');
    //     //     $(this).css('color','red').addClass('vue-inited');
    //     //     new Vue({
    //     //         el: this,
    //     //     });
    //     // });
    // });

})();

//
// Init stuff which needs to be triggered just once on real pageload/DOMContentLoaded's
//
document.addEventListener('DOMContentLoaded', () => {

    var modalEl = document.getElementById('simplerAdminModal');

    // Bootstrap Modal (Vue rendered): to test opening a simple modal, paste into console: simpler.modal.show = true;
    var simpleModal = new Vue({
        el: '#simplerAdminModal',
        data: simpler.modal,
        watch: {
            // make modal open/closable by changing data value (Bootstrap 4 jQuery plugin)
            show: function (val) {
                $('#simplerAdminModal').modal(val ? 'show' : 'hide');
            },
            bodyHtml: function (val) {
                $('#simplerAdminModal').modal('handleUpdate');
            }
        }
    });

    // Sync Bootstrap modal events back to Vue data
    if (modalEl) {
        $(modalEl).on('show.bs.modal', function () {
            simpler.modal.show = true;
        });
        $(modalEl).on('hide.bs.modal', function () {
            simpler.modal.show = false;
        });
    }

});

//
// Init stuff which needs to be triggered AFTER all other scripts etc
//
document.onreadystatechange = function () { // https://developer.mozilla.org/en-US/docs/Web/API/Document/readystatechange_event
    if (document.readyState === "interactive") {

        // document.addEventListener("DOMNodesInserted", function (event) {
        //     console.log('DOMNodesInserted EL:', event.target);
        // });

    }
}
