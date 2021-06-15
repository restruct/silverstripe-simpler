# Simpler Silverstripe

This module tries to make Silverstripe interface development a bit simpler by naively re-introducting some 'common sense'/old-fashioned/SS3 basics:

## So far:
- global Bootstrap js
- global $ & jQue*e*ry (it IS a bit different indeed)
- even a global VueJS (I know, crazy!)
- simple modal/popup (based on VueJS)

## JS event for dynamically inserted & removed DOM nodes, even react components (sort of Entwine onmatch/onadd does, without polling)
- To have your JS executed even when a form/fragment gets inserted from an Ajax/XHR request, listen for `DOMNodesInserted`
- To remove/destroy JS stuff, listen for `DOMNodesRemoved`
- The event object received by the handler contains an event.detail.type value:
  - `LOAD` (regular `DOMContenLoaded`, trigered once, always on document)
  - `XHR` (Ajax requests to /admin, triggered lots of times (), always on document)
  - `FETCH` (fetch requests to /admin, triggered lots of times () but not very reliably, always triggered on document)
  - `MOUNT`/`UNMOUNT` (on mounting/unmounting of react form-components, triggered reliably & exactly once per mount/unmount, on the actual form element)

```JS
document.addEventListener("DOMNodesInserted", function (event) {
    // in case the event was triggered by react mount, we have a specific node to search within (else the event target will be the document)
    console.log('DOMNodesInserted', event.detail.type, event.target);
});

document.addEventListener("DOMNodesRemoved", function (event) {
    // in case the event was triggered by react unmount, we have a specific node to search within (else the event target will be the document)
    console.log('DOMNodesRemoved', event.detail.type, event.target);
});
```

### Example: FilePond
As a practical example, this module contains a 'compatibility layer' for the excelent FilePond module to also initialize filepond on dynamically inserted content

```JS
document.addEventListener("DOMNodesInserted", function () {
    if (typeof FilePond !== "undefined") {
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
```

### Modal dialog
Opening a simple modal dialog is a matter of setting some properties of the (again, global) `simpler` object:

```JS
openDialog: function() {
    simpler.modal.show = true;
    simpler.modal.title = 'Insert/edit shortcode';
    simpler.modal.closeBtn = false;
    simpler.modal.closeTxt = 'Close';
    simpler.modal.saveBtn = false;
    simpler.modal.saveTxt = 'Insert shortcode';
    // Initially show spinner in the modal, after loading actual content via XHR, replace the spinnter with the content
    simpler.modal.bodyHtml = simpler.spinner;
    $.post(shortcodable.controller_url, shortcodable.getCurrentEditorSelectionAsParsedShortcodeData(), function(data){
        // (use the intermediary xhr_buffer element in order to have jQuery parse/activate listeners etc
        simpler.modal.bodyHtml = $('#xhr_buffer').html(data).html();
    });
}
