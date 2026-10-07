<?php

namespace Restruct\Silverstripe\Simpler;

use SilverStripe\Forms\TextField;

/**
 * A TextField that starts in read-only mode with an edit button.
 *
 * Clicking the edit button switches to edit mode. Clicking cancel
 * reverts to read-only and resets the value. Uses Vue for the toggle.
 *
 * Requires AdminExtension on LeftAndMain to provide Vue import map.
 *
 * Usage:
 *   EditProtectedTextField::create('FieldName', 'Field Label')
 */
class EditProtectedTextField extends TextField
{
    /**
     * The field's value as a JavaScript string literal (JSON), for the template's inline Vue module.
     *
     * Always valid JSON, also for a null value: the template used `$Value.JSON.RAW`, which on
     * Silverstripe 6 renders an empty string for null (the template engine no longer casts null to a
     * DBField, so `.JSON` finds no method), leaving `const originalValue = ;` and a module that does
     * not parse (#16). Null becomes '' here, as an empty input would submit.
     *
     * JSON_HEX_TAG on top of json_encode's default `\/` escaping: no `<` reaches the <script> block,
     * so neither `</script>` nor `<!--` in a value can end or confuse it.
     */
    public function getValueJSON(): string
    {
        # $this->value, not an accessor: the template's $Value is Value() on SS5 (deprecated there)
        # and getValue() on SS6 (Value() is gone); both return this property unchanged.
        return json_encode((string) $this->value, JSON_HEX_TAG | JSON_THROW_ON_ERROR);
    }
}
