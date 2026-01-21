<style>
  .edit-protected-field .icon-only[class*=font-icon-]::before { margin-right: 0; }
</style>

<div class="edit-protected-field input-group" style="max-width: 200px;" data-original-value="$Value.ATT">
    <input type="text"
           name="$Name"
           class="form-control<% if not $Value %> text-muted<% end_if %>"
           value="$Value.ATT"
           readonly
           placeholder="—"
           <% if $MaxLength %>maxlength="$MaxLength"<% end_if %>
           <% if $isDisabled %>disabled<% end_if %>>
    <div class="input-group-append">
        <button type="button"
                class="btn btn-outline-secondary font-icon-edit-write icon-only edit-btn"
                title="<%t EditProtectedTextField.Edit 'Edit' %>">
        </button>
        <button type="button"
                class="btn btn-outline-secondary font-icon-cancel icon-only cancel-btn"
                style="display: none;"
                title="<%t EditProtectedTextField.Cancel 'Cancel' %>">
        </button>
    </div>
</div>
