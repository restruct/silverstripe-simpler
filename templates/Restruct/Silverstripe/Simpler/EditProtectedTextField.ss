<style>
  .edit-protected-field .icon-only[class*=font-icon-]::before { margin-right: 0; }
</style>

<div id="edit-protected-$ID" class="edit-protected-field input-group" style="max-width: 200px;">
    <input type="text"
           ref="input"
           id="$ID"
           name="$Name"
           class="form-control"
           v-model="currentValue"
           :readonly="!editing"
           :class="{ 'text-muted': !currentValue && !editing }"
           :placeholder="!currentValue ? '—' : ''"
           <% if $MaxLength %>maxlength="$MaxLength"<% end_if %>
           <% if $isDisabled %>disabled<% end_if %>>
    <div class="input-group-append">
        <button v-show="!editing"
                type="button"
                class="btn btn-outline-secondary font-icon-edit-write icon-only"
                @click="startEditing"
                title="<%t EditProtectedTextField.Edit 'Edit' %>">
        </button>
        <button v-show="editing"
                type="button"
                class="btn btn-outline-secondary icon-only"
                :class="isDirty ? 'font-icon-back-in-time' : 'font-icon-cancel'"
                @click="cancelEditing"
                :title="isDirty ? '<%t EditProtectedTextField.Revert 'Revert' %>' : '<%t EditProtectedTextField.Cancel 'Cancel' %>'">
        </button>
    </div>
</div>

<script type="module">
  import { createApp, ref, computed, nextTick } from 'vue';

  const el = document.getElementById('edit-protected-$ID');

  // Only mount if element exists and hasn't been mounted yet
  if (el && !el.__vue_app__) {
    createApp({
      setup() {
        const originalValue = $Value.JSON.RAW;
        const currentValue = ref(originalValue);
        const editing = ref(false);
        const input = ref(null);

        const isDirty = computed(() => currentValue.value !== originalValue);

        const startEditing = async () => {
          editing.value = true;
          await nextTick();
          if (input.value) {
            input.value.focus();
            input.value.select();
          }
        };

        const cancelEditing = () => {
          currentValue.value = originalValue;
          editing.value = false;
        };

        return {
          currentValue,
          editing,
          isDirty,
          input,
          startEditing,
          cancelEditing
        };
      }
    }).mount(el);
  }
</script>
