<?php

namespace Restruct\SpBrowser;

use Restruct\Silverstripe\Simpler\SimplerModalAction;
use Restruct\Silverstripe\Simpler\SimplerModalField;
use SilverStripe\Forms\FieldList;
use SilverStripe\Forms\TextField;

/**
 * BROWSER-TEST FIXTURE ONLY - the "puremodal" tab: the record's edit form has a SimplerModalField
 * (HTML content in simpler.modal) and a SimplerModalAction (a form in the modal that submits to the
 * record), README section 4. Both need lekoala/silverstripe-pure-modal, which targets.sh adds to
 * the scratch hosts (SS<n>_EXTRA_REQUIRE). See SpBRecord.
 */
class SpBPureModalRecord extends SpBRecord
{
    private static $table_name = 'SpBPureModalRecord';

    protected const SEEDS = [
        'Pure info' => ['Code' => 'PURE-1', 'Description' => 'For the field spec'],
        'Pure rename' => ['Code' => 'PURE-2', 'Description' => 'For the action spec'],
    ];

    public function getCMSFields()
    {
        $fields = parent::getCMSFields();
        $fields->addFieldToTab(
            'Root.Main',
            SimplerModalField::create('SpbInfo', 'Show info')
                ->setDialogTitle('Info for ' . $this->Title)
                ->setContent('<p class="spb-info">Code <strong>' . htmlspecialchars((string) $this->Code) . '</strong></p>')
                ->setModalSize('640px')
        );
        return $fields;
    }

    public function getCMSActions()
    {
        $actions = parent::getCMSActions();
        $actions->push(
            SimplerModalAction::create('spbRename', 'Rename')
                ->setFieldList(FieldList::create(TextField::create('NewTitle', 'New title')))
                ->setDialogButtonTitle('Apply rename')
        );
        return $actions;
    }

    /**
     * The action's handler: called with the modal form's data (PureModalAction / cms-actions).
     */
    public function spbRename($data)
    {
        $this->Title = (string) ($data['NewTitle'] ?? $this->Title);
        $this->write();
        return 'Renamed to ' . $this->Title;
    }
}
