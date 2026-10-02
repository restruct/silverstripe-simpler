<?php

namespace Restruct\SpBrowser;

use Restruct\Silverstripe\Simpler\GridFieldToolbarModalAction;
use SilverStripe\Forms\FieldList;
use SilverStripe\Forms\GridField\GridField;
use SilverStripe\Forms\TextField;

/**
 * BROWSER-TEST FIXTURE ONLY - a GridFieldToolbarModalAction in form mode, as the README shows it:
 * the modal asks for a suffix and handleAction() appends it to every listed record's Title.
 */
class SpBRenameAction extends GridFieldToolbarModalAction
{
    public function __construct()
    {
        parent::__construct('spbrename', 'Rename all');
        $this->setDialogTitle('Rename all records');
        $this->setSubmitLabel('Apply suffix');
        $this->setFieldList(FieldList::create([
            TextField::create('Suffix', 'Suffix'),
        ]));
    }

    public function handleAction(GridField $gridField, $actionName, $arguments, $data)
    {
        if ($actionName !== 'spbrename') {
            return;
        }
        $suffix = trim((string) ($data['Suffix'] ?? ''));
        if ($suffix === '') {
            return;
        }
        foreach ($gridField->getList() as $record) {
            $record->Title = $record->Title . ' ' . $suffix;
            $record->write();
        }
    }
}
