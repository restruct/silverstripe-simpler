// Simpler Silverstripe - Modal (opt-in)
// - Bootstrap modal, for BOTH admin Bootstrap majors (see "Bootstrap adapters" below)
// - Vue 3 reactive modal app
// Requires simpler-silverstripe.js to be loaded first (provides window.simpler)
// Requires jQuery as a global (window.jQuery): the Bootstrap 4 plugin below is imported at the top
// level and throws on load without it. Both admins (SS5 and SS6) ship jQuery.

// Why two Bootstrap modal implementations in one bundle:
// this module supports Silverstripe 5 AND 6 from one release line. The CMS ships Bootstrap 4 CSS
// on SS5 (silverstripe/admin 2, bootstrap ^4.6) and Bootstrap 5 CSS on SS6 (admin 3, bootstrap ^5.2),
// and neither admin exposes a vanilla Bootstrap modal JS we could reuse, so we bundle our own.
// The modal JS has to match the CSS it runs against, so both are bundled and one is picked at
// runtime (bootstrapIsV5() below). The SS5 path is the Bootstrap 4 jQuery plugin exactly as shipped
// in 0.3.x; the SS6 path is the Bootstrap 5 native API as it was on main.
//
// Bootstrap 4 modal plugin: registers $.fn.modal on the framework's jQuery. It imports 'jquery',
// which webpack.mix.modal.js aliases to client/src/js/jquery-shim.js (= window.jQuery).
// 'bootstrap4' is an npm alias of bootstrap@4 (package.json), so both majors can be installed.
import 'bootstrap4/js/dist/modal';
// Bootstrap 5 modal: native API, no jQuery needed.
import Modal from 'bootstrap/js/dist/modal';

import { createApp, reactive } from 'vue';

// Default modal state (used for reset on close)
const modalDefaults = {
    show: false,
    title: "...",
    bodyHtml: "...",
    closeBtn: false, // Footer close button hidden by default (use X in header)
    closeTxt: "Close",
    saveBtn: false,  // Footer save button hidden by default
    saveTxt: "Save",
    static: false, // Set to true to prevent closing via backdrop click or Escape key
    onSave: null,  // Callback function for save button
    size: null,    // 'sm', 'lg', 'xl' for Bootstrap sizes, or custom value like '800px', '90vw'
};

// Store modal element/instance references outside reactive data (so they don't get reset on close)
// modalEl: jQuery-wrapped element (Bootstrap 4 path, kept for backwards compatibility with 0.3.x)
// modalInstance: Bootstrap 5 Modal instance (Bootstrap 5 path)
window.simpler.modalEl = null;
window.simpler.modalInstance = null;

// Add modal data to simpler object and make it reactive
window.simpler.modal = reactive({ ...modalDefaults });

// UI state that must NOT be reset on close (so it lives outside modalDefaults / window.simpler.modal)
const ui = reactive({ bs5: true });

/**
 * Which Bootstrap major does the page's CSS carry?
 *
 * Bootstrap 5 declares its CSS custom properties with a `--bs-` prefix on :root (`--bs-blue`);
 * Bootstrap 4 uses unprefixed ones (`--blue`). Checked against both admin bundles in SSKB's source
 * trees: silverstripe/admin 3 (SS6) bundle.css has `--bs-blue`, admin 2 (SS5) has `--blue` only.
 *
 * Requires jQuery: this bundle imports the Bootstrap 4 jQuery plugin at the top level, which throws
 * on load when window.jQuery is missing, so this function never runs without jQuery.
 * (Was: "Without jQuery the Bootstrap 4 plugin cannot run at all, so fall back to Bootstrap 5 then."
 * That fallback below was dead code for the reason above; making it real needs a lazy Bootstrap 4
 * import, tracked as a separate enhancement.)
 */
function bootstrapIsV5() {
    // Dead no-jQuery guard, unreachable (the top-level Bootstrap 4 import throws first without jQuery):
    // if (!window.jQuery || !window.jQuery.fn || !window.jQuery.fn.modal) {
    //     return true;
    // }
    const rootStyle = getComputedStyle(document.documentElement);
    return rootStyle.getPropertyValue('--bs-blue').trim() !== '';
}

/**
 * Give $.fn.modal back to the Bootstrap 4 plugin.
 *
 * Importing Bootstrap 5 with jQuery on the page makes it register ITS jQuery interface as
 * $.fn.modal (defineJQueryPlugin(), immediately or on DOMContentLoaded), replacing the Bootstrap 4
 * plugin imported just before it - and the Bootstrap 4 path below calls $.fn.modal. Bootstrap 5
 * keeps the previous plugin for noConflict(), so this restores exactly the 0.3.x state.
 * Neither admin bundle defines a jQuery modal plugin of its own (checked: no "bs.modal" in
 * silverstripe/admin 2 or 3 client/dist/js), so nothing of theirs is overwritten either way.
 */
function restoreBootstrap4Plugin() {
    const $ = window.jQuery;
    if ($ && $.fn && $.fn.modal && $.fn.modal.Constructor === Modal && typeof $.fn.modal.noConflict === 'function') {
        $.fn.modal.noConflict();
    }
}

// Bootstrap adapters: same four operations, one per Bootstrap major
const adapters = {
    // Bootstrap 4 jQuery plugin (Silverstripe 5 admin)
    bs4: {
        show(el, options) {
            // Pass options when showing (static backdrop + disable keyboard close)
            window.simpler.modalEl.modal(options);
        },
        hide() {
            window.simpler.modalEl.modal('hide');
        },
        update() {
            window.simpler.modalEl.modal('handleUpdate');
        },
        listen(el, eventName, handler) {
            // Bootstrap 4 triggers jQuery events, which native listeners do not receive
            window.simpler.modalEl.on(eventName, handler);
        },
        dispose() {
            // Not disposed on Bootstrap 4: its dispose() runs $(el).off('.bs.modal'), which would
            // also remove our own show/hide/hidden.bs.modal listeners registered in mounted().
        },
    },
    // Bootstrap 5 native API (Silverstripe 6 admin)
    bs5: {
        show(el, options) {
            // Recreate modal instance with current options
            window.simpler.modalInstance = new Modal(el, options);
            window.simpler.modalInstance.show();
        },
        hide() {
            if (window.simpler.modalInstance) {
                window.simpler.modalInstance.hide();
            }
        },
        update() {
            if (window.simpler.modalInstance) {
                window.simpler.modalInstance.handleUpdate();
            }
        },
        listen(el, eventName, handler) {
            el.addEventListener(eventName, handler);
        },
        dispose() {
            if (window.simpler.modalInstance) {
                window.simpler.modalInstance.dispose();
                window.simpler.modalInstance = null;
            }
        },
    },
};

document.addEventListener('DOMContentLoaded', () => {
    // Module scripts run after the stylesheets in <head> have loaded, so the CSS check is reliable here
    ui.bs5 = bootstrapIsV5();
    if (!ui.bs5) {
        // Runs after Bootstrap 5's own DOMContentLoaded registration, since that listener was added first
        restoreBootstrap4Plugin();
    }
    const adapter = ui.bs5 ? adapters.bs5 : adapters.bs4;

    // Create modal container
    const container = document.createElement('div');
    container.id = 'simplerAdminModalContainer';
    document.body.appendChild(container);

    // Bootstrap Modal (Vue 3 rendered)
    // To test opening: simpler.modal.show = true;
    const app = createApp({
        setup() {
            return { ui };
        },
        data() {
            return window.simpler.modal;
        },
        // Explicit template. Markup that differs between Bootstrap 4 and 5 is switched on ui.bs5:
        // the header close button (BS4 `.close` + &times; vs BS5 `.btn-close`). Dismissing is handled
        // by our own [data-simpler-dismiss] listener below, so no data-dismiss / data-bs-dismiss needed.
        // v-show rather than v-if: v-if leaves comment nodes that trip Entwine (docs/ENTWINE_VUE_CONFLICT.md)
        template: `
            <div class="modal fade" id="simplerAdminModal"
                 tabindex="-1" aria-labelledby="simpleAdminModalTitle" aria-hidden="true">
                <div class="modal-dialog" :class="dialogClass" :style="dialogStyle">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="simpleAdminModalTitle">{{ title }}</h5>
                            <button type="button" :class="ui.bs5 ? 'btn-close' : 'close'" data-simpler-dismiss aria-label="Close">
                                <span v-show="!ui.bs5" aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body" id="simpleAdminModalBody" v-html="bodyHtml"></div>
                        <div class="modal-footer">
                            <button v-show="closeBtn" type="button" class="btn btn-outline-secondary" data-simpler-dismiss>{{ closeTxt }}</button>
                            <button v-show="saveBtn" type="button" class="btn btn-primary font-icon-tick" id="simpleAdminModalPrimaryBtn" @click="handleSave">{{ saveTxt }}</button>
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
            // Make modal open/closable by changing data value
            show(val) {
                const el = document.getElementById('simplerAdminModal');
                if (val) {
                    adapter.show(el, {
                        backdrop: this.static ? 'static' : true,
                        keyboard: !this.static
                    });
                } else {
                    adapter.hide(el);
                }
            },
            bodyHtml() {
                adapter.update();
            }
        },
        mounted() {
            const el = document.getElementById('simplerAdminModal');
            // Save element ref outside reactive data (so it doesn't get reset on close).
            // Kept on both paths: 0.3.x exposed it, and it is harmless where jQuery exists.
            window.simpler.modalEl = window.jQuery ? window.jQuery(el) : null;

            // Sync Bootstrap modal events back to Vue data
            adapter.listen(el, 'show.bs.modal', () => {
                window.simpler.modal.show = true;
            });
            adapter.listen(el, 'hide.bs.modal', () => {
                window.simpler.modal.show = false;
            });
            adapter.listen(el, 'hidden.bs.modal', () => {
                // Reset all properties to defaults after modal has finished hiding
                Object.assign(window.simpler.modal, modalDefaults);
                adapter.dispose();
            });

            // Dismiss buttons: our own attribute, plus both Bootstrap majors' attributes, so HTML
            // written for either major (in bodyHtml, or by PHP components) closes the modal on both.
            // Setting show=false is idempotent when Bootstrap has already handled the same click.
            el.addEventListener('click', (e) => {
                if (e.target.closest('[data-simpler-dismiss], [data-dismiss="modal"], [data-bs-dismiss="modal"]')) {
                    window.simpler.modal.show = false;
                }
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

    // AJAX form submit handler for GridField modal actions
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.simpler-modal-ajax-submit');
        if (!btn) return;

        console.log('[Simpler] AJAX submit button clicked', btn);
        e.preventDefault();

        const form = btn.closest('.simpler-modal-gridfield-form');
        if (!form) return;

        const gridFieldUrl = form.dataset.gridfieldUrl;
        const securityId = form.dataset.securityId;
        const actionName = form.dataset.actionName;

        if (!gridFieldUrl || !actionName) {
            console.error('Missing data attributes for AJAX submit');
            return;
        }

        // Collect form data
        const formData = new FormData();
        formData.append('SecurityID', securityId);
        formData.append(actionName, '1');

        form.querySelectorAll('input, select, textarea').forEach((el) => {
            if (!el.name) return;
            if (el.type === 'checkbox') {
                if (el.checked) formData.append(el.name, el.value || '1');
            } else if (el.type === 'radio') {
                if (el.checked) formData.append(el.name, el.value);
            } else if (el.tagName === 'SELECT' && el.multiple) {
                // Handle <select multiple> — append each selected option
                Array.from(el.selectedOptions).forEach((opt) => {
                    formData.append(el.name, opt.value);
                });
            } else {
                formData.append(el.name, el.value);
            }
        });

        // Show loading state with progress indicator
        window.simpler.modal.title = 'Processing...';
        window.simpler.modal.static = true;

        // Start progress indicator in modal body
        const progressHtml = window.simpler.progressIndicator.getHtml('Processing');
        window.simpler.modal.bodyHtml = progressHtml;

        // Start progress animation after Vue updates DOM
        setTimeout(() => {
            const container = document.querySelector('#simpleAdminModalBody');
            if (container) {
                window.simpler.progressIndicator.start({
                    duration: 30,
                    message: 'Processing',
                    onComplete: () => {
                        // Check if the server requested a full page reload (e.g., after FUSE save)
                        if (window.simpler._forcePageReload) {
                            window.simpler._forcePageReload = false;
                            window.simpler.modal.show = false;
                            window.location.reload();
                            return;
                        }
                        // Extract GridField name and reload
                        const gridFieldName = gridFieldUrl.split('/field/')[1]?.split('/')[0];
                        if (gridFieldName && window.jQuery) {
                            const $gridField = window.jQuery(`.grid-field[data-name="${gridFieldName}"]`);
                            if ($gridField.length && $gridField.entwine) {
                                window.simpler.modal.show = false;
                                $gridField.entwine('ss').reload();
                                return;
                            }
                        }
                        window.location.reload();
                    }
                });
                // Set element reference for progress updates
                window.simpler.progressIndicator._element = container.querySelector('.simpler-progress-indicator');
            }
        }, 50);

        // Make AJAX request
        fetch(gridFieldUrl, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then((response) => {
            if (!response.ok) {
                // Read the response body to get the actual error message from the server
                return response.text().then((text) => {
                    throw new Error(text || `Request failed: ${response.status} ${response.statusText}`);
                });
            }
            // Check if the server wants a full page reload instead of GridField reload
            if (response.headers.get('X-Reload') === 'true') {
                window.simpler._forcePageReload = true;
            }
            return response.text();
        })
        .then(() => {
            // Complete progress animation then reload
            window.simpler.progressIndicator.complete(500);
        })
        .catch((error) => {
            window.simpler.progressIndicator.stop();
            window.simpler.modal.static = false;
            window.simpler.modal.title = 'Error';
            window.simpler.modal.bodyHtml = `
                <div class="alert alert-danger">
                    Something went wrong: ${error.message || 'Unknown error'}
                </div>
                <div class="btn-toolbar mt-3">
                    <button type="button" class="btn btn-outline-secondary" data-dismiss="modal">Close</button>
                </div>
            `;
            console.error('GridField AJAX submit error:', error);
        });
    });
});

/**
 * Progress indicator for long-running operations
 * Shows a progress bar that fills up over time, then goes into indefinite mode
 *
 * Usage:
 *   simpler.progressIndicator.start({ duration: 30, onComplete: () => location.reload() });
 *   // ...ajax call completes...
 *   simpler.progressIndicator.complete(); // fills to 100% then calls onComplete
 */
window.simpler.progressIndicator = {
    _interval: null,
    _startTime: null,
    _options: null,
    _element: null,

    // HTML template for progress indicator (progress bar only, no spinner)
    getHtml(message = 'Processing') {
        return `
            <div class="simpler-progress-indicator text-center p-3">
                <div class="progress mb-2">
                    <div class="progress-bar" role="progressbar" style="width: 0%"
                         aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
                <small class="text-muted simpler-progress-message">${message}</small>
            </div>
        `;
    },

    /**
     * Start progress indicator
     * @param {Object} options
     * @param {number} options.duration - Expected duration in seconds (default: 30)
     * @param {string} options.message - Message to display (default: 'Processing')
     * @param {Function} options.onComplete - Callback when complete() is called and animation finishes
     */
    start(options = {}) {
        this.stop(); // Clear any existing progress

        this._options = {
            duration: options.duration || 30,
            message: options.message || 'Processing',
            onComplete: options.onComplete || null,
        };

        this._startTime = Date.now();

        // Start progress animation immediately
        this._interval = setInterval(() => this._updateProgress(), 100);
    },

    /**
     * Update progress bar based on elapsed time
     * - 0-80% in first 20 seconds
     * - 80-100% in next 10 seconds
     * - At 100%, switch to striped+animated (indefinite mode)
     */
    _updateProgress() {
        if (!this._startTime || !this._element) return;

        const elapsed = (Date.now() - this._startTime) / 1000;
        const progressBar = this._element.querySelector('.progress-bar');
        if (!progressBar) return;

        let percent;
        if (elapsed <= 20) {
            // 0-80% in 20 seconds (4% per second)
            percent = (elapsed / 20) * 80;
        } else if (elapsed <= 30) {
            // 80-100% in next 10 seconds (2% per second)
            percent = 80 + ((elapsed - 20) / 10) * 20;
        } else {
            // At 100%, switch to indefinite mode
            percent = 100;
            progressBar.classList.add('progress-bar-striped', 'progress-bar-animated');
            clearInterval(this._interval);
            this._interval = null;
        }

        progressBar.style.width = percent + '%';
        progressBar.setAttribute('aria-valuenow', Math.round(percent));
    },

    /**
     * Complete the progress - animate to 100% then call onComplete
     * @param {number} duration - Time to animate to 100% in ms (default: 500)
     */
    complete(duration = 500) {
        if (!this._element) {
            // No element, just call callback
            if (this._options?.onComplete) {
                this._options.onComplete();
            }
            this.stop();
            return;
        }

        clearInterval(this._interval);
        this._interval = null;

        const progressBar = this._element.querySelector('.progress-bar');
        const messageEl = this._element.querySelector('.simpler-progress-message');

        if (progressBar) {
            // Remove indefinite mode, add success color
            progressBar.classList.remove('progress-bar-striped', 'progress-bar-animated');
            progressBar.classList.add('bg-success');

            // Animate to 100%
            progressBar.style.transition = `width ${duration}ms ease-out`;
            progressBar.style.width = '100%';
            progressBar.setAttribute('aria-valuenow', 100);
        }

        if (messageEl) {
            messageEl.textContent = 'Complete!';
        }

        // Call onComplete after animation
        setTimeout(() => {
            if (this._options?.onComplete) {
                this._options.onComplete();
            }
            this.stop();
        }, duration);
    },

    /**
     * Stop and reset progress indicator
     */
    stop() {
        if (this._interval) {
            clearInterval(this._interval);
            this._interval = null;
        }
        this._startTime = null;
        this._options = null;
        this._element = null;
    }
};
