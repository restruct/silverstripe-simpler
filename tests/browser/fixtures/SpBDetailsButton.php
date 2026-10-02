<?php

namespace Restruct\SpBrowser;

use Restruct\Silverstripe\Simpler\GridFieldModalButton;
use SilverStripe\ORM\DataObject;

/**
 * BROWSER-TEST FIXTURE ONLY - a GridFieldModalButton as the README shows it: the four overrides,
 * default classes and close text. Rows titled "... empty" get no button (shouldShowButton()).
 */
class SpBDetailsButton extends GridFieldModalButton
{
    protected function getButtonLabel(DataObject $record): string
    {
        return 'Details';
    }

    protected function getModalTitle(DataObject $record): string
    {
        return 'Details for ' . $record->Title;
    }

    protected function getModalContent(DataObject $record): string
    {
        # Escaped on purpose: the seeded description carries markup that must show as text.
        return '<p class="spb-desc">' . htmlspecialchars((string) $record->Description) . '</p>';
    }

    protected function shouldShowButton(DataObject $record): bool
    {
        return substr((string) $record->Title, -5) !== 'empty';
    }
}
