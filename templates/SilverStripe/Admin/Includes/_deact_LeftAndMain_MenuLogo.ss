<%--<h1>HI</h1>--%>
<div class="cms-sitename">
    <a href="#" class="cms-sitename__link font-icon-silverstripe font-icon-large" target="_blank">
    </a>
    <a class="cms-sitename__title" href="$BaseHref" target="_blank"><% if $SiteConfig %>$SiteConfig.Title<% else %>$ApplicationName<% end_if %></a>
</div>

<div class="modal fade" id="simpleAdminModal"
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
                <button v-if="closeBtn" type="button" class="btn _btn-secondary btn-outline-primary" data-dismiss="modal">{{ closeTxt }}</button>
                <button v-if="saveBtn" type="button" class="btn btn-primary font-icon-tick" id="simpleAdminModalPrimaryBtn">{{ saveTxt }}</button>
            </div>
        </div>
    </div>
</div>

