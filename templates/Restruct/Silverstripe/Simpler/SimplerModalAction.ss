<button type="button"
        name="$Name"
        id="$ID"
        class="btn<% if $ButtonIcon %> font-icon-$ButtonIcon<% end_if %><% if $extraClass %> $extraClass<% end_if %>"
        data-simpler-modal="$ModalConfig.JSON.ATT"
        $AttributesHTML(class, type, name, id, data-simpler-modal)>
    $ButtonTitle.RAW
</button>
