<?php

namespace Restruct\Silverstripe\Simpler\Tests;

use Restruct\Silverstripe\Simpler\GridFieldToggleFieldButton;
use Restruct\Silverstripe\Simpler\GridFieldToggleIsActiveButton;
use Restruct\Silverstripe\Simpler\Tests\Stub\TestController;
use Restruct\Silverstripe\Simpler\Tests\Stub\ToggleRecord;
use SilverStripe\Dev\SapphireTest;
use SilverStripe\Forms\FieldList;
use SilverStripe\Forms\Form;
use SilverStripe\Forms\GridField\GridField;
use SilverStripe\Forms\GridField\GridField_ActionMenuItem;
use SilverStripe\ORM\DataObject;

/**
 * GridFieldToggleFieldButton against real records: the action writes, the button renders.
 *
 * GridFieldToggleFieldButtonTest covers the configuration API without a database; this class
 * covers what the component does to data and markup inside a GridField.
 */
class GridFieldToggleFieldButtonBehaviourTest extends SapphireTest
{
    protected $usesDatabase = true;

    protected static $extra_dataobjects = [
        ToggleRecord::class,
    ];

    private function gridField(GridFieldToggleFieldButton $component): GridField
    {
        $gridField = GridField::create('Records', 'Records', ToggleRecord::get());
        $gridField->getConfig()->addComponent($component);
        // GridField_FormAction needs a form (for its URL and state store)
        Form::create(TestController::create(), 'Form', FieldList::create($gridField), FieldList::create());
        return $gridField;
    }

    private function record(array $data): ToggleRecord
    {
        $record = ToggleRecord::create($data);
        $record->write();
        return $record;
    }

    private static function reload(DataObject $record): ToggleRecord
    {
        return ToggleRecord::get()->byID($record->ID);
    }

    public function testHandleActionTogglesBooleanAndWrites(): void
    {
        $record = $this->record(['Title' => 'A', 'IsActive' => false]);
        $component = GridFieldToggleIsActiveButton::create();
        $gridField = $this->gridField($component);

        $component->handleAction($gridField, 'togglefield_isactive', ['RecordID' => $record->ID], []);
        $this->assertTrue((bool) self::reload($record)->IsActive);

        $component->handleAction($gridField, 'togglefield_isactive', ['RecordID' => $record->ID], []);
        $this->assertFalse((bool) self::reload($record)->IsActive);
    }

    public function testHandleActionCyclesMultiState(): void
    {
        $record = $this->record(['Title' => 'A', 'Status' => 'published']);
        $component = GridFieldToggleFieldButton::create('Status')->setStates([
            'draft' => ['icon' => 'edit', 'title' => 'Submit'],
            'review' => ['icon' => 'eye', 'title' => 'Publish'],
            'published' => ['icon' => 'check-mark', 'title' => 'Archive'],
        ]);
        $gridField = $this->gridField($component);

        $component->handleAction($gridField, 'togglefield_status', ['RecordID' => $record->ID], []);
        $this->assertSame('draft', self::reload($record)->Status);
    }

    public function testHandleActionIgnoresOtherActionsAndMissingRecords(): void
    {
        $record = $this->record(['Title' => 'A', 'IsActive' => false]);
        $component = GridFieldToggleIsActiveButton::create();
        $gridField = $this->gridField($component);

        $component->handleAction($gridField, 'togglefield_other', ['RecordID' => $record->ID], []);
        $component->handleAction($gridField, 'togglefield_isactive', [], []);
        $component->handleAction($gridField, 'togglefield_isactive', ['RecordID' => $record->ID + 999], []);

        $this->assertFalse((bool) self::reload($record)->IsActive);
    }

    public function testToggleActionCallbackReplacesAssignment(): void
    {
        $record = $this->record(['Title' => 'A', 'IsActive' => false]);
        $component = GridFieldToggleIsActiveButton::create()
            ->setToggleAction(function (DataObject $record, $newValue) {
                $record->IsActive = $newValue;
                $record->Title = 'Toggled to ' . (int) $newValue;
            });
        $gridField = $this->gridField($component);

        $component->handleAction($gridField, 'togglefield_isactive', ['RecordID' => $record->ID], []);

        $reloaded = self::reload($record);
        $this->assertTrue((bool) $reloaded->IsActive);
        $this->assertSame('Toggled to 1', $reloaded->Title);
    }

    public function testButtonReflectsCurrentState(): void
    {
        $inactive = $this->record(['Title' => 'Off', 'IsActive' => false]);
        $active = $this->record(['Title' => 'On', 'IsActive' => true]);
        $component = GridFieldToggleIsActiveButton::create();
        $gridField = $this->gridField($component);

        $off = (string) $component->getColumnContent($gridField, $inactive, 'Actions');
        $on = (string) $component->getColumnContent($gridField, $active, 'Actions');

        $this->assertStringContainsString('font-icon-check-mark-circle', $off);
        $this->assertStringContainsString('currently-inactive', $off);
        $this->assertStringContainsString('title="Activate"', $off);
        $this->assertStringContainsString('data-confirm="Are you sure?"', $off);

        $this->assertStringContainsString('font-icon-minus-circle', $on);
        $this->assertStringContainsString('currently-active', $on);
        $this->assertStringContainsString('title="Deactivate"', $on);

        $this->assertSame('Activate', $component->getTitle($gridField, $inactive, 'Actions'));
        $this->assertSame('Deactivate', $component->getTitle($gridField, $active, 'Actions'));
    }

    public function testBootstrapIconPrefixInState(): void
    {
        $record = $this->record(['Title' => 'A', 'IsActive' => false]);
        $component = GridFieldToggleIsActiveButton::create()->setStates([
            false => ['icon' => 'toggle-off', 'iconPrefix' => 'bs', 'title' => 'On'],
            true => ['icon' => 'toggle-on', 'iconPrefix' => 'bs', 'title' => 'Off'],
        ]);
        $gridField = $this->gridField($component);

        $this->assertStringContainsString('bi bi-toggle-off', (string) $component->getColumnContent($gridField, $record, 'Actions'));
    }

    public function testShouldShowCallbackHidesButtonAndMenuItem(): void
    {
        $record = $this->record(['Title' => 'A', 'IsActive' => false]);
        $component = GridFieldToggleIsActiveButton::create()->setShouldShow(fn () => false);
        $gridField = $this->gridField($component);

        $this->assertSame('', $component->getColumnContent($gridField, $record, 'Actions'));
        $this->assertNull($component->getGroup($gridField, $record, 'Actions'));
    }

    public function testMissingFieldHidesButton(): void
    {
        $record = $this->record(['Title' => 'A']);
        $component = GridFieldToggleFieldButton::create('NoSuchField');
        $gridField = $this->gridField($component);

        $this->assertSame('', $component->getColumnContent($gridField, $record, 'Actions'));
        $this->assertNull($component->getGroup($gridField, $record, 'Actions'));
    }

    public function testShownInDefaultActionMenuGroup(): void
    {
        $record = $this->record(['Title' => 'A', 'IsActive' => true]);
        $component = GridFieldToggleIsActiveButton::create();
        $gridField = $this->gridField($component);

        $this->assertSame(GridField_ActionMenuItem::DEFAULT_GROUP, $component->getGroup($gridField, $record, 'Actions'));
    }
}
