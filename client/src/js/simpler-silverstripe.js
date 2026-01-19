// Simpler Silverstripe - Core functionality (always loaded)
// - Synthetic DOM events (DOMNodesInserted/DOMNodesRemoved)
// - React Form mount/unmount events
// - Global simpler object
//
// NOTE: This module does NOT set window.$ - add it yourself if needed:
//   Requirements::customScript('window.$ = window.$ || window.jQuery;', 'jquery-alias');

import jQuery from 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';
import Injector from 'lib/Injector';

// Global 'simpler' object (extendable by opt-in modules like simpler-modal.js)
window.simpler = {
    // Spinner HTML template (sr-only for Bootstrap 4)
    spinner: '<div class="text-center p-3"><div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div></div>',
};

//
// DOM Events Emulator - 'emulate' DOMContentLoaded events for ajax-inserted/react rendered content
// Event types: LOAD (DOMContentLoaded), MUTATION (MutationObserver), MOUNT/UNMOUNT (React Form)
//
window.simpler_dom = {
    // Emit event only once per multiple triggers within delay period
    insertEventDelay: 40,
    insertEventTimeout: null,

    emitInsert: function (type, element, delay, loadedUrl) {
        // Ignore non-admin fetch/xhr events
        if (loadedUrl && loadedUrl.indexOf(ss.config.adminUrl) < 0) {
            return;
        }

        let event = new CustomEvent("DOMNodesInserted", {
            bubbles: true,
            cancelable: true,
            detail: { type: type.toUpperCase(), time: Date.now() }
        });
        let eventDelay = (typeof delay !== 'undefined') ? delay : window.simpler_dom.insertEventDelay;

        // 'group' multiple triggers and emit (on the specific element of the last trigger, or on document)
        if (eventDelay && !element) {
            // Reset previous events/timeout still underway
            if (window.simpler_dom.insertEventTimeout) {
                clearTimeout(window.simpler_dom.insertEventTimeout);
            }
            // Set new timeout
            window.simpler_dom.insertEventTimeout = setTimeout(function () {
                document.dispatchEvent(event);
            }, eventDelay);
        } else {
            // Emit directly, on specific element (or document)
            (element && typeof element.dispatchEvent === 'function')
                ? element.dispatchEvent(event)
                : document.dispatchEvent(event);
        }
    },

    emitRemove: function (type, element, delay) {
        let event = new CustomEvent("DOMNodesRemoved", {
            bubbles: true,
            cancelable: true,
            detail: { type: type.toUpperCase(), time: Date.now() }
        });
        (element && typeof element.dispatchEvent === 'function')
            ? element.dispatchEvent(event)
            : document.dispatchEvent(event);
    },
};

// Set up MutationObserver to emit DOM events
(function () {
    let observer = new MutationObserver(function (mutations) {
        simpler_dom.emitInsert('mutation', null, 100); // batch at 100ms
    });
    observer.observe(document, {
        childList: true,
        subtree: true
    });

    document.addEventListener('DOMContentLoaded', () => {
        // Create xhr_buffer element - a hidden <template> used to parse AJAX HTML through jQuery
        // before inserting into Vue/DOM. This triggers Entwine-style listeners that don't fire
        // when content is inserted directly by Vue.
        const xhrBuffer = document.createElement('template');
        xhrBuffer.id = 'xhr_buffer';
        document.body.appendChild(xhrBuffer);

        // Dispatch initial event on DOMContentLoaded
        simpler_dom.emitInsert('load', null, 0);
    });
})();

//
// React Form mount/unmount event emitter
// Wraps SilverStripe's Form component to emit events when React forms mount/unmount
//
const FormWrapper = (Form) => (
    class FormWrapperItem extends React.Component {
        componentDidMount() {
            this.browserDomEl = ReactDOM.findDOMNode(this);
            window.simpler_dom.emitInsert('mount', this.browserDomEl, 0);
        }

        componentWillUnmount() {
            window.simpler_dom.emitRemove('unmount', this.browserDomEl, 0);
        }

        render() {
            return <Form {...this.props} />;
        }
    }
);

// Register transformation on SilverStripe Form component
Injector.transform('simpler-form-mount-emitter', (updater) => {
    updater.component('Form', FormWrapper);
});
