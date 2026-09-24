<?php

namespace Restruct\Silverstripe\Simpler\Tests\Stub;

use Restruct\Silverstripe\Simpler\GridFieldModalButton;
use SilverStripe\Dev\TestOnly;
use SilverStripe\ORM\DataObject;

/**
 * GridFieldModalButton subclass as the class docblock tells projects to write one.
 */
class TestModalButton extends GridFieldModalButton implements TestOnly
{
    protected function getButtonLabel(DataObject $record): string
    {
        return 'View ' . $record->Title;
    }

    protected function getModalTitle(DataObject $record): string
    {
        return 'Details for ' . $record->Title;
    }

    protected function getModalContent(DataObject $record): string
    {
        return '<p>' . htmlspecialchars((string) $record->Title) . '</p>';
    }

    protected function shouldShowButton(DataObject $record): bool
    {
        // Hide the button for inactive records, so the empty case can be tested
        return (bool) $record->IsActive;
    }
}
