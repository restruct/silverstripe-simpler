<?php

namespace Restruct\Silverstripe\Simpler\Tests;

use DOMDocument;
use DOMElement;
use Restruct\Silverstripe\Simpler\AdminExtension;
use Restruct\Silverstripe\Simpler\Tests\Stub\TestModalButton;
use Restruct\Silverstripe\Simpler\Tests\Stub\ToggleRecord;
use SilverStripe\Core\Config\Config;
use SilverStripe\Dev\SapphireTest;
use SilverStripe\Forms\GridField\GridField;
use SilverStripe\View\Requirements;
use SilverStripe\View\Requirements_Backend;

/**
 * GridFieldModalButton: a per-row button whose data-simpler-modal carries the record's modal.
 */
class GridFieldModalButtonTest extends SapphireTest
{
    protected $usesDatabase = true;

    protected static $extra_dataobjects = [
        ToggleRecord::class,
    ];

    private ?Requirements_Backend $previousBackend = null;

    protected function setUp(): void
    {
        parent::setUp();
        Config::modify()->set(AdminExtension::class, 'skip_import_map_check', true);
        $this->previousBackend = Requirements::backend();
        Requirements::set_backend(Requirements_Backend::create());
    }

    protected function tearDown(): void
    {
        if ($this->previousBackend) {
            Requirements::set_backend($this->previousBackend);
        }
        parent::tearDown();
    }

    private function record(string $title, bool $active): ToggleRecord
    {
        $record = ToggleRecord::create(['Title' => $title, 'IsActive' => $active]);
        $record->write();
        return $record;
    }

    private function button(string $html): DOMElement
    {
        $doc = new DOMDocument();
        $doc->loadHTML('<?xml encoding="utf-8"?><body>' . $html . '</body>', LIBXML_NOERROR | LIBXML_NOWARNING);
        $buttons = $doc->getElementsByTagName('button');
        $this->assertSame(1, $buttons->length, 'Expected exactly one <button> in: ' . $html);
        return $buttons->item(0);
    }

    public function testColumnIsAddedOnceAndModalScriptRequired(): void
    {
        $component = new TestModalButton();
        $gridField = GridField::create('Records', 'Records', ToggleRecord::get());
        $columns = ['Title'];

        $component->augmentColumns($gridField, $columns);
        $component->augmentColumns($gridField, $columns);

        $this->assertSame(['Title', 'ModalAction'], $columns);
        $this->assertSame(['ModalAction'], $component->getColumnsHandled($gridField));
        $modalScripts = array_filter(
            array_keys(Requirements::backend()->getJavascript()),
            fn ($file) => str_contains($file, 'client/dist/js/simpler-modal.js')
        );
        $this->assertCount(1, $modalScripts);
    }

    public function testColumnContentCarriesRecordModal(): void
    {
        $record = $this->record('Alpha "one" & \'two\'', true);
        $component = (new TestModalButton())->setModalSize('lg')->setCloseButtonText('Close');
        $gridField = GridField::create('Records', 'Records', ToggleRecord::get());

        $button = $this->button($component->getColumnContent($gridField, $record, 'ModalAction'));

        $this->assertSame('button', $button->getAttribute('type'));
        $this->assertSame('View Alpha "one" & \'two\'', $button->textContent);
        $this->assertSame([
            'title' => 'Details for Alpha "one" & \'two\'',
            'bodyHtml' => '<p>Alpha &quot;one&quot; &amp; &#039;two&#039;</p>',
            'closeBtn' => true,
            'closeTxt' => 'Close',
            'saveBtn' => false,
            'size' => 'lg',
        ], json_decode($button->getAttribute('data-simpler-modal'), true));
    }

    public function testNoButtonWhenShouldShowButtonIsFalse(): void
    {
        $record = $this->record('Inactive', false);
        $gridField = GridField::create('Records', 'Records', ToggleRecord::get());

        $this->assertSame('', (new TestModalButton())->getColumnContent($gridField, $record, 'ModalAction'));
    }

    public function testCustomColumnNameAndClasses(): void
    {
        $record = $this->record('Beta', true);
        $component = (new TestModalButton())->setColumnName('Preview')->setButtonClasses('btn btn-primary');
        $gridField = GridField::create('Records', 'Records', ToggleRecord::get());

        $this->assertSame(['Preview'], $component->getColumnsHandled($gridField));
        $button = $this->button($component->getColumnContent($gridField, $record, 'Preview'));
        $this->assertStringContainsString('btn-primary', $button->getAttribute('class'));
    }
}
