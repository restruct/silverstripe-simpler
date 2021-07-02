//
// 'Emulate' DOMContentLoaded events (named to DOMNodesInserted & DOMNodesRemoved) to init various JS listeners on ajax-inserted/react rendered DOMs
// event.detail.type values: LOAD (DOMContenLoaded), XHR (XHR requests to /admin), FETCH (requests to /admin), MOUNT/UNMOUNT (react component)
//
window.simpler_dom = {

    // Emit AdminContentChanged event only once per multiple triggers within 40ms
    insertEventDelay: 40,
    insertEventTimeout: null,
    emitInsert: function (type, element, delay, loadedUrl) {
        // Ignore non-admin fetch/xhr events
        if(loadedUrl && loadedUrl.indexOf(ss.config.adminUrl) < 0){
            // console.log('emitInsert IGNORING loadedUrl: "'+loadedUrl+'"');
            return;
        }

        // let event = new Event("DOMNodesInserted", { bubbles: true, cancelable: true, detail: { type: type.toUpperCase(), time: Date.now() } });
        let event = new CustomEvent("DOMNodesInserted", { bubbles: true, cancelable: true, detail: { type: type.toUpperCase(), time: Date.now() }});
        let eventDelay = (typeof delay !== 'undefined') ? delay : window.simpler_dom.insertEventDelay;

        // 'group' multiple triggers and emit (on the specific element of the last trigger, or on document)
        if(eventDelay && !element) {
            // reset previous events/timeout still underway
            if(window.simpler_dom.insertEventTimeout) {
                clearTimeout(window.simpler_dom.insertEventTimeout);
            }
            // set new timeout
            window.simpler_dom.insertEventTimeout = setTimeout(function () {
                // console.log('EMITTING (DELAY, document): DOMNodesInserted');
                document.dispatchEvent(event);
            }, eventDelay);

        // emit directly, on specific element (or body):
        } else {
            // console.log('EMITTING (DIRECT, element): DOMNodesInserted', element);
            (element && typeof element.dispatchEvent === 'function') ? element.dispatchEvent(event) : document.dispatchEvent(event);
        }
    },

    emitRemove: function (type, element, delay) {
        // let event = new Event("DOMNodesRemoved", { bubbles: true, cancelable: true, detail: { type: type.toUpperCase(), time: Date.now() } });
        let event = new CustomEvent("DOMNodesRemoved", { bubbles: true, cancelable: true, detail: { type: type.toUpperCase(), time: Date.now() }});
        (element && typeof element.dispatchEvent==='function') ? element.dispatchEvent(event) : document.dispatchEvent(event);
    },

};

// IE9+ CustomEvent polyfill...
(function () {
    if ( typeof window.CustomEvent === "function" ) return false;
    function CustomEvent ( event, params ) {
        params = params || { bubbles: false, cancelable: false, detail: null };
        var evt = document.createEvent( 'CustomEvent' );
        evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
        return evt;
    }
    window.CustomEvent = CustomEvent;
})();

// Actually trigger some AdminDOMChanged events every now & then...
(function() {

    // // Dispatch events on XHR requests to allow hooking into as if regular DOMContentLoaded events were triggered
    // var origOpen = XMLHttpRequest.prototype.open;
    // XMLHttpRequest.prototype.open = function(method, url) {
    //     this.addEventListener('load', function() {
    //         // console.log('::XHR:: finished loading (admin)', method, url);
    //         simpler_dom.emitInsert('xhr', null, 100, url); // allow for 100ms DOM rendering time
    //     });
    //     // run original open callback & listeners
    //     origOpen.apply(this, arguments);
    // };

    // // jQuery XHR (not used much in CMS/Admin)
    // $( document ).ajaxComplete(function() {
    //     console.log('ajaxComplete');
    //     simpler_dom.emitInsert('xhr', null, 100, url); // allow for 100ms DOM rendering time
    // });

    // Use mutationobserver instead
    let observer = new MutationObserver(function (mutations){
        simpler_dom.emitInsert('mutation', null, 100); // batch at 100ms
    });
    observer.observe(document, {
        childList: true,
        subtree: true
    });

    // // Try & do the same for Fetch requests (dispatch 'DOMContentLoaded' events, sadly doesn't catch *every* fetch request...)
    // const nativeFetch = window.fetch
    // window.fetch = async (input, options) => {
    //     // Set custom async handler
    //     let response = await nativeFetch(input, options);
    //         // .then(data => {
    //         //     console.log('::FETCH:: finished loading', input);
    //         //     simpler_dom.adminDOM_emit(input, 100);
    //         // });
    //     // slightly longer delay because we're actually in front of the callbacks being executed in case of fetch
    //     simpler_dom.emitInsert('fetch', null, 200, input);
    //     // return response to original caller
    //     return response;
    // }

    // // Fallback: event listener for clicks on buttons (poor solution but couldn't find a solid way to hook into *every* Fetch
    // document.addEventListener('click', function(e) {
    //     // loop parent nodes from the target to the delegation node
    //     for (var target = e.target; target && target !== this; target = target.parentNode) {
    //         if (target.matches('button, .btn')) {
    //             console.log('::BTN:: clicked');
    //             simpler_dom.emitInsert('btnclick');
    //             break;
    //         }
    //     }
    // }, false);

    // Dispatch an initial event on DOMContentLoaded;
    document.addEventListener('DOMContentLoaded', () => {
        simpler_dom.emitInsert('load', null, 0);
    });

})();
