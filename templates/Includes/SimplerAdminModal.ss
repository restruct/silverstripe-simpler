<%-- 'plain' BS4 version --%>
<%--<div class="modal fade" id="simpleAdminModal"--%>
<%--     tabindex="-1" aria-labelledby="simpleAdminModalTitle" aria-hidden="true">--%>
<%--    <div class="modal-dialog">--%>
<%--        <div class="modal-content">--%>
<%--            <div class="modal-header">--%>
<%--                <h5 class="modal-title" id="simpleAdminModalTitle">...</h5>--%>
<%--                <button type="button" class="close" data-dismiss="modal" aria-label="Close">--%>
<%--                    <span aria-hidden="true">&times;</span>--%>
<%--                </button>--%>
<%--            </div>--%>
<%--            <div class="modal-body" id="simpleAdminModalBody">--%>
<%--                ...--%>
<%--            </div>--%>
<%--            <div class="modal-footer">--%>
<%--                <button type="button" class="btn _btn-secondary btn-outline-primary" data-dismiss="modal">Close</button>--%>
<%--                <button type="button" class="btn btn-primary font-icon-tick" id="simpleAdminModalPrimaryBtn">Save</button>--%>
<%--            </div>--%>
<%--        </div>--%>
<%--    </div>--%>
<%--</div>--%>

<%-- 'vue' BS4 version --%>
<div class="modal fade" id="simplerAdminModal"
     tabindex="-1" aria-labelledby="simpleAdminModalTitle" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="simpleAdminModalTitle">{{ title }}</h5>
                <button type="button" class="close btn-close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body" id="simpleAdminModalBody" v-html="bodyHtml">
                ...
            </div>
            <div class="modal-footer">
                <button v-if="closeBtn" type="button" class="btn _btn-secondary btn-outline-primary" data-dismiss="modal">{{ closeTxt }}</button>
                <button v-if="saveBtn" type="button" class="btn btn-primary font-icon-tick" id="simpleAdminModalPrimaryBtn">{{ saveTxt }}</button>
            </div>
        </div>
    </div>
</div>

<%-- 'plain' BS5 version (with some BS4 classes mixed in so it still would work in 4 --%>
<%--<div class="modal fade" id="simpleAdminModal"--%>
<%--     tabindex="-1" aria-labelledby="simpleAdminModalTitle" aria-hidden="true">--%>
<%--    <div class="modal-dialog">--%>
<%--        <div class="modal-content">--%>
<%--            <div class="modal-header">--%>
<%--                <h5 class="modal-title" id="simpleAdminModalTitle">...</h5>--%>
<%--                <button type="button" class="btn-close close" data-bs-dismiss="modal" data-dismiss="modal" aria-label="Close"></button>--%>
<%--            </div>--%>
<%--            <div class="modal-body" id="simpleAdminModalBody">--%>
<%--                ...--%>
<%--            </div>--%>
<%--            <div class="modal-footer">--%>
<%--                <button type="button" class="btn _btn-secondary btn-outline-secondary" data-bs-dismiss="modal" id="simpleAdminModalSecondaryBtn">Close</button>--%>
<%--                <button type="button" class="btn btn-primary font-icon-tick" id="simpleAdminModalPrimaryBtn">Save</button>--%>
<%--            </div>--%>
<%--        </div>--%>
<%--    </div>--%>
<%--</div>--%>

