# Simpler Silverstripe

This module tries to make Silverstripe Admin interface development a bit simpler by naively re-introducting some traditional basics.

## Added functionality, so far:
- 'Synthetic' JS load/unload events (`DOMNodesInserted`/`DOMNodesRemoved`) for dynamic inserts/react components
- Simple modal dialog (based on/requires additional loading of VueJS & Bootstrap)

### Extra JS
- (global) Bootstrap js (mainly for modal, but all-included)
- (global) $ & jQue**e**ry 3 (has to be slightly different indeed, as jquery is taken)  
  <img width="136" src="https://user-images.githubusercontent.com/1005986/122156443-4043b880-ce69-11eb-9659-efe9ad3f3f18.png">
- even (global) VueJS 2 (I know, crazy!)

## JS event for dynamically inserted & removed DOM nodes, even react components
(sort of what Entwine onmatch/onadd does, but without the polling and also working for react-rendered areas)
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
As a practical example, this module contains a 'compatibility layer' for the excelent [FilePond module](https://github.com/lekoala/silverstripe-filepond) to also initialize filepond on dynamically inserted content *(this code is already contained in this module, just copied here as an example of how the events work)*

```JS
document.addEventListener("DOMNodesInserted", function () {
    // Just a precaution to skip execution if we don't have a FilePond yet...
    if (typeof FilePond !== "undefined") {
        // Now attach filepond to any newly inserted file inputs
        var anchors = document.querySelectorAll('input[type="file"].filepond');
        for (var i = 0; i < anchors.length; i++) {
            var el = anchors[i];
            var pond = FilePond.create(el);
            var config = JSON.parse(el.dataset.config);
            for (var key in config) {
                pond[key] = config[key];
            }
        }
    }
});
```

## Modal dialog
<img width="450" src="https://user-images.githubusercontent.com/1005986/122156433-3de15e80-ce69-11eb-9787-b4dd7d39f371.png"><br>
Opening a simple modal dialog is a matter of setting some properties of the (again, global) `simpler` object.<br>
Example of how the [Restruct Shortcodable module](https://github.com/restruct/silverstripe-shortcodable) opens the shortcode form dialog:

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

## NOTES
- Check [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) (& [here](https://www.smashingmagazine.com/2019/04/mutationobserver-api-guide/)) to use instead of React transformer
