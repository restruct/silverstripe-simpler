// Simpler Silverstripe - Modal (opt-in)
// - Bootstrap 4 modal plugin
// - Vue 3 reactive modal app
// Requires simpler-silverstripe.js to be loaded first (for jQuery and window.simpler)

import 'bootstrap/js/dist/modal';
import { createApp, reactive } from 'vue';

// Default modal state (used for reset on close)
const modalDefaults = {
    show: false,
    title: "...",
    bodyHtml: "...",
    closeBtn: true,
    closeTxt: "Close",
    saveBtn: true,
    saveTxt: "Save",
    static: false, // Set to true to prevent closing via backdrop click or Escape key
};

// Add modal data to simpler object and make it reactive
window.simpler.modal = reactive({ ...modalDefaults });

document.addEventListener('DOMContentLoaded', () => {
    // Create modal container
    const container = document.createElement('div');
    container.id = 'simplerAdminModalContainer';
    document.body.appendChild(container);

    // Bootstrap Modal (Vue 3 rendered)
    // To test opening: simpler.modal.show = true;
    const app = createApp({
        data() {
            return window.simpler.modal;
        },
        // Explicit template (Bootstrap 4 markup)
        template: `
            <div class="modal fade" id="simplerAdminModal"
                 tabindex="-1" aria-labelledby="simpleAdminModalTitle" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="simpleAdminModalTitle">{{ title }}</h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body" id="simpleAdminModalBody" v-html="bodyHtml"></div>
                        <div class="modal-footer">
                            <button v-if="closeBtn" type="button" class="btn btn-outline-secondary" data-dismiss="modal">{{ closeTxt }}</button>
                            <button v-if="saveBtn" type="button" class="btn btn-primary font-icon-tick" id="simpleAdminModalPrimaryBtn">{{ saveTxt }}</button>
                        </div>
                    </div>
                </div>
            </div>
        `,
        watch: {
            // Make modal open/closable by changing data value (Bootstrap 4 jQuery plugin)
            show(val) {
                if (val) {
                    // Pass options when showing (static backdrop + disable keyboard close)
                    window.$('#simplerAdminModal').modal({
                        backdrop: this.static ? 'static' : true,
                        keyboard: !this.static
                    });
                } else {
                    window.$('#simplerAdminModal').modal('hide');
                }
            },
            bodyHtml() {
                window.$('#simplerAdminModal').modal('handleUpdate');
            }
        },
        mounted() {
            // Sync Bootstrap modal events back to Vue data
            const $ = window.$;
            $('#simplerAdminModal').on('show.bs.modal', () => {
                window.simpler.modal.show = true;
            });
            $('#simplerAdminModal').on('hide.bs.modal', () => {
                window.simpler.modal.show = false;
            });
            $('#simplerAdminModal').on('hidden.bs.modal', () => {
                // Reset all properties to defaults after modal has finished hiding
                Object.assign(window.simpler.modal, modalDefaults);
            });
        }
    });

    app.mount('#simplerAdminModalContainer');
});
