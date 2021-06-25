//import {default as $, default as jQueery} from 'jquery';
import {default as jQueery} from 'jquery'; // jquery as external needs to be commented out in webpack/.mix.js
import 'bootstrap'; // make bootstrap work globally (SS probably uses some special flavour combined with react components or so)
import Vue from 'vue'; // to hell with react...

// Global 'simpler' object to hold various data like modal content etc, watched by Vue to trigger required behaviour like actually opening said modal etc.
// “Uhm, why are you not using Vuex/Redux/some other complex way?” – Because why would I.
window.simpler = {
    // spinner HTML template
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

    // Simply make jQuery 3 available globally as '$' (framework includes 1.7.2 as external, comment that out in webpack/mix if necessary);
    // To check version: console.log(`$/jQueery: v${jQueery.fn.jquery}`);
    window.jQueery = jQueery;
    window.$ = jQueery;
    window.Vue = Vue; // global Vue (maybe 'expose' instead once I figure out how to do that...)

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

    // Bootstrap Modal (Vue rendered): to test opening a simple modal, paste into console: simpler.modal.show = true;
    var simpleModal = new Vue({
        el: '#simplerAdminModal',
        data: simpler.modal,
        watch: {
            // make modal open/closable by changing data value
            show: function (val) {
                $('#simplerAdminModal').modal(val ? 'show' : 'hide');
            },
            bodyHtml: function (val) {
                //$('#simpleAdminModalBody').html(val);
                $('#simplerAdminModal').modal('handleUpdate');
                //$('#simpleAdminModalBody select').trigger('onadd onload onmatch'); // doesn't work
            }
        }
    });
    $('#simplerAdminModal') // 'Alias' some Bootstrap state events to the Vue data
        .on('show.bs.modal', function (event) {
            simpler.modal.show = true;
        })
        .on('hide.bs.modal', function (event) {
            simpler.modal.show = false;
        });

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

//
// FilePond module compatibility helper: init filepond also on dynamically inserted nodes (via the synthetic simpler DOM events)
//
document.addEventListener("DOMNodesInserted", function () {
    if (typeof FilePond !== "undefined") {
        // initFilePond(); // has already been init'ed from filepond module on DOMContentLoaded...

        // Attach filepond to all related inputs
        var anchors = document.querySelectorAll('input[type="file"].filepond');
        for (var i = 0; i < anchors.length; i++) {
            var el = anchors[i];
            var pond = FilePond.create(el);
            var config = JSON.parse(el.dataset.config);
            for (var key in config) {
                // We can set the properties directly in the instance
                // @link https://pqina.nl/filepond/docs/patterns/api/filepond-instance/#properties
                pond[key] = config[key];
            }
        }
    }
});