// Simpler Silverstripe - Modal (opt-in)
// - Bootstrap 4 modal plugin
// - Vue 3 reactive modal app
// Requires simpler-silverstripe.js to be loaded first (provides window.$ and window.simpler)

// Use framework's jQuery directly (Bootstrap modal also uses it via shim)
const $ = window.jQuery;

// Bootstrap 4 modal plugin (needs jQuery available as window.jQuery)
import 'bootstrap/js/dist/modal';

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
                            <button v-show="closeBtn" type="button" class="btn btn-outline-secondary" data-dismiss="modal">{{ closeTxt }}</button>
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
            window.simpler.modalEl = $('#simplerAdminModal');
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
                    spinnerThreshold: 7,
                    message: 'Processing',
                    container: null, // Already inserted HTML
                    onComplete: () => {
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
                throw new Error(`Request failed: ${response.status} ${response.statusText}`);
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
 * Shows spinner for short durations (<7s), progress bar for longer
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

    // HTML template for progress indicator
    getHtml(message = 'Processing') {
        return `
            <div class="simpler-progress-indicator text-center p-3">
                <div class="simpler-progress-spinner mb-3">
                    <div class="spinner-border" role="status">
                        <span class="sr-only">${message}</span>
                    </div>
                </div>
                <div class="simpler-progress-bar-container" style="display: none;">
                    <div class="progress mb-2">
                        <div class="progress-bar" role="progressbar" style="width: 0%"
                             aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                    <small class="text-muted simpler-progress-message">${message}</small>
                </div>
            </div>
        `;
    },

    /**
     * Start progress indicator
     * @param {Object} options
     * @param {number} options.duration - Expected duration in seconds (default: 30)
     * @param {number} options.spinnerThreshold - Show spinner instead of progress bar if duration < this (default: 7)
     * @param {string} options.message - Message to display (default: 'Processing')
     * @param {Function} options.onComplete - Callback when complete() is called and animation finishes
     */
    start(options = {}) {
        this.stop(); // Clear any existing progress

        this._options = {
            duration: options.duration || 30,
            spinnerThreshold: options.spinnerThreshold || 7,
            message: options.message || 'Processing',
            onComplete: options.onComplete || null,
        };

        this._startTime = Date.now();

        // For short durations, just show spinner (don't switch to progress bar)
        if (this._options.duration < this._options.spinnerThreshold) {
            return;
        }

        // Show progress bar after spinnerThreshold seconds
        setTimeout(() => {
            if (!this._startTime) return; // Already stopped

            const barContainer = this._element?.querySelector('.simpler-progress-bar-container');
            const spinnerEl = this._element?.querySelector('.simpler-progress-spinner');

            if (barContainer) {
                barContainer.style.display = 'block';
            }
            if (spinnerEl) {
                spinnerEl.style.display = 'none';
            }

            // Start progress animation
            this._interval = setInterval(() => this._updateProgress(), 100);
        }, this._options.spinnerThreshold * 1000);
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
        const barContainer = this._element.querySelector('.simpler-progress-bar-container');
        const spinnerEl = this._element.querySelector('.simpler-progress-spinner');
        const messageEl = this._element.querySelector('.simpler-progress-message');

        // Show progress bar if not visible (for fast completions)
        if (barContainer && barContainer.style.display === 'none') {
            barContainer.style.display = 'block';
            if (spinnerEl) spinnerEl.style.display = 'none';
        }

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
