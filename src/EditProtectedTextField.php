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
}
