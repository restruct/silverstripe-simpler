// Simpler Silverstripe - Modal (opt-in)
// - Bootstrap 4 modal plugin
// - Vue 3 reactive modal app
// Requires simpler-silverstripe.js to be loaded first (for jQuery and window.simpler)

import jQuery from 'jquery';
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
    onSave: null,  // Callback function for save button
    size: null,    // 'sm', 'lg', 'xl' for Bootstrap sizes, or custom value like '800px', '90vw'
};

// Store modal element reference outside reactive data (so it doesn't get reset on close)
window.simpler.modalEl = null;

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
                <div class="modal-dialog" :class="dialogClass" :style="dialogStyle">
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
                            <button v-if="saveBtn" type="button" class="btn btn-primary font-icon-tick" id="simpleAdminModalPrimaryBtn" @click="handleSave">{{ saveTxt }}</button>
                        </div>
                    </div>
                </div>
            </div>
        `,
        computed: {
            // Returns Bootstrap size class if size is sm/lg/xl, otherwise empty
            dialogClass() {
                const bootstrapSizes = ['sm', 'lg', 'xl'];
                if (this.size && bootstrapSizes.includes(this.size)) {
                    return 'modal-' + this.size;
                }
                return '';
            },
            // Returns custom max-width style if size is not a Bootstrap size keyword
            dialogStyle() {
                const bootstrapSizes = ['sm', 'lg', 'xl'];
                if (this.size && !bootstrapSizes.includes(this.size)) {
                    return { maxWidth: this.size };
                }
                return {};
            }
        },
        methods: {
            handleSave() {
                if (window.simpler.modal.onSave) {
                    window.simpler.modal.onSave();
                }
            }
        },
        watch: {
            // Make modal open/closable by changing data value (Bootstrap 4 jQuery plugin)
            show(val) {
                if (val) {
                    // Pass options when showing (static backdrop + disable keyboard close)
                    window.simpler.modalEl.modal({
                        backdrop: this.static ? 'static' : true,
                        keyboard: !this.static
                    });
                } else {
                    window.simpler.modalEl.modal('hide');
                }
            },
            bodyHtml() {
                window.simpler.modalEl.modal('handleUpdate');
            }
        },
        mounted() {
            // Save element ref outside reactive data (so it doesn't get reset on close)
            window.simpler.modalEl = jQuery('#simplerAdminModal');
            // Sync Bootstrap modal events back to Vue data
            window.simpler.modalEl.on('show.bs.modal', () => {
                window.simpler.modal.show = true;
            });
            window.simpler.modalEl.on('hide.bs.modal', () => {
                window.simpler.modal.show = false;
            });
            window.simpler.modalEl.on('hidden.bs.modal', () => {
                // Reset all properties to defaults after modal has finished hiding
                Object.assign(window.simpler.modal, modalDefaults);
            });
        }
    });

    app.mount('#simplerAdminModalContainer');

    // Generic click handler for data-simpler-modal buttons (PHP FormField integration)
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-simpler-modal]');
        if (!btn) return;

        e.preventDefault();

        try {
            const config = JSON.parse(btn.dataset.simplerModal);
            Object.assign(window.simpler.modal, config);
            window.simpler.modal.show = true;
        } catch (err) {
            console.error('Invalid simpler-modal config:', err);
        }
    });
});
