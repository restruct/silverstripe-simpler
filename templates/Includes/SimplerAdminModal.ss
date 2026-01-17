<%-- Vue-controlled Bootstrap 4 modal --%>
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
            <div class="modal-body" id="simpleAdminModalBody" v-html="bodyHtml">
                ...
            </div>
            <div class="modal-footer">
                <button v-if="closeBtn" type="button" class="btn btn-outline-secondary" data-dismiss="modal">{{ closeTxt }}</button>
                <button v-if="saveBtn" type="button" class="btn btn-primary font-icon-tick" id="simpleAdminModalPrimaryBtn">{{ saveTxt }}</button>
            </div>
        </div>
    </div>
</div>
