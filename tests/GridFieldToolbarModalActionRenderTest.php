<?php

namespace Restruct\Silverstripe\Simpler\Tests;

use DOMDocument;
use DOMXPath;
use Restruct\Silverstripe\Simpler\AdminExtension;
use Restruct\Silverstripe\Simpler\GridFieldToolbarModalAction;
use Restruct\Silverstripe\Simpler\Tests\Stub\TestController;
use Restruct\Silverstripe\Simpler\Tests\Stub\ToggleRecord;
use SilverStripe\Core\Config\Config;
use SilverStripe\Core\Injector\Injector;
use SilverStripe\Dev\SapphireTest;
use SilverStripe\Forms\DropdownField;
use SilverStripe\Forms\FieldList;
use SilverStripe\Forms\Form;
use SilverStripe\Forms\GridField\FormAction\StateStore;
use SilverStripe\Forms\GridField\GridField;
use SilverStripe\Forms\LiteralField;
use SilverStripe\View\Requirements;
use SilverStripe\View\Requirements_Backend;

/**
 * GridFieldToolbarModalAction rendered in a GridField: the toolbar button, its modal body in
 * view-only and form mode, and the GridField action routing the form mode relies on.
 *
 * GridFieldToolbarModalActionTest covers the configuration API without rendering.
 */
class GridFieldToolbarModalActionRenderTest extends SapphireTest
{
    protected $usesDatabase = true;

    protected static $extra_dataobjects = [
        ToggleRecord::class,
    ];

    private ?Requirements_Backend $previousBackend = null;

    private ?TestController $controller = null;

    protected function setUp(): void
    {
        parent::setUp();
        Config::modify()->set(AdminExtension::class, 'skip_import_map_check', true);
        $this->previousBackend = Requirements::backend();
        Requirements::set_backend(Requirements_Backend::create());
        // The GridField state store and security token live in the current request's session
        $this->controller = TestController::createWithSession();
        $this->controller->pushCurrent();
    }

    protected function tearDown(): void
    {
        if ($this->controller) {
            $this->controller->popCurrent();
        }
        if ($this->previousBackend) {
            Requirements::set_backend($this->previousBackend);
        }
        parent::tearDown();
    }

    private function gridField(GridFieldToolbarModalAction $component): GridField
    {
        $gridField = GridField::create('Records', 'Records', ToggleRecord::get());
        $gridField->getConfig()->addComponent($component);
        Form::create($this->controller, 'Form', FieldList::create($gridField), FieldList::create());
        return $gridField;
    }

    /**
     * @return array{0: DOMXPath, 1: array} the toolbar button and its decoded modal config
     */
    private function renderFragment(GridFieldToolbarModalAction $component, GridField $gridField, string $fragment): array
    {
        $fragments = $component->getHTMLFragments($gridField);
        $this->assertSame([$fragment], array_keys($fragments));

        $doc = new DOMDocument();
        $doc->loadHTML('<?xml encoding="utf-8"?><body>' . $fragments[$fragment] . '</body>', LIBXML_NOERROR | LIBXML_NOWARNING);
        $xpath = new DOMXPath($doc);
        $buttons = $xpath->query('//button');
        $this->assertSame(1, $buttons->length);
        $config = json_decode($buttons->item(0)->getAttribute('data-simpler-modal'), true);
        $this->assertIsArray($config);
        return [$xpath, $config];
    }

    public function testViewOnlyIframeMode(): void
    {
        $component = GridFieldToolbarModalAction::create('viewpdf', 'View PDF')
            ->setIframeSrc('/assets/doc.pdf?x=1&y=2')
            ->setIframeHeight('85vh')
            ->setModalSize('60vw')
            ->setButtonIcon('file-pdf', 'bs')
            ->setButtonClasses('btn btn-outline-info');
        $gridField = $this->gridField($component);

        [$xpath, $config] = $this->renderFragment($component, $gridField, 'buttons-before-left');

        $button = $xpath->query('//button')->item(0);
        $this->assertSame('btn btn-outline-info bi bi-file-pdf', $button->getAttribute('class'));
        $this->assertSame('View PDF', $button->textContent);
        $this->assertSame('View PDF', $config['title']);
        $this->assertSame('60vw', $config['size']);
        $this->assertFalse($config['closeBtn']);
        $this->assertStringStartsWith('<iframe src="/assets/doc.pdf?x=1&amp;y=2"', $config['bodyHtml']);
        $this->assertStringContainsString('height:85vh', $config['bodyHtml']);
        $this->assertTrue($component->isViewOnly());
    }

    public function testViewOnlyHtmlModeAndTargetFragment(): void
    {
        $component = GridFieldToolbarModalAction::create('preview', 'Preview')
            ->setBodyHtml('<div class="preview">x</div>')
            ->setTargetFragment('buttons-after-right');
        $gridField = $this->gridField($component);

        [, $config] = $this->renderFragment($component, $gridField, 'buttons-after-right');

        $this->assertSame('<div class="preview">x</div>', $config['bodyHtml']);
    }

    public function testFormModeRoutesThroughGridFieldState(): void
    {
        $component = GridFieldToolbarModalAction::create('bulkupdate', 'Bulk update')
            ->setDialogTitle('Update all records')
            ->setSubmitLabel('Go')
            ->setActionArguments(['scope' => 'all'])
            ->setFieldList(FieldList::create([
                DropdownField::create('Status', 'Status', ['draft' => 'Draft', 'published' => 'Published']),
                LiteralField::create('Note', '<p class="note">Literal content</p>'),
            ]));
        $gridField = $this->gridField($component);
        $this->assertFalse($component->isViewOnly());

        [, $config] = $this->renderFragment($component, $gridField, 'buttons-before-left');
        $this->assertSame('Update all records', $config['title']);

        $doc = new DOMDocument();
        $doc->loadHTML('<?xml encoding="utf-8"?><body>' . $config['bodyHtml'] . '</body>', LIBXML_NOERROR | LIBXML_NOWARNING);
        $xpath = new DOMXPath($doc);
        $container = $xpath->query('//div[contains(@class, "simpler-modal-gridfield-form")]')->item(0);
        $this->assertNotNull($container);

        // Posted back to the GridField's own URL, with the form's security token
        $this->assertSame($gridField->Link(), $container->getAttribute('data-gridfield-url'));
        $this->assertSame($gridField->getForm()->getSecurityToken()->getValue(), $container->getAttribute('data-security-id'));

        // Fields render (LiteralField too: its FieldHolder() returns a string, not DBHTMLText)
        $this->assertSame(1, $xpath->query('//select[@name="Status"]')->length);
        $this->assertSame(1, $xpath->query('//p[@class="note"]')->length);
        $this->assertSame('Go', trim($xpath->query('//button[contains(@class, "simpler-modal-ajax-submit")]')->item(0)->textContent));

        // The action name addresses GridField state that GridField::handleAlterAction() can load
        $actionName = $container->getAttribute('data-action-name');
        $this->assertMatchesRegularExpression('#^action_gridFieldAlterAction\?StateID=gf_[0-9a-f]{8}$#', $actionName);
        $stateKey = substr($actionName, strlen('action_gridFieldAlterAction?StateID='));
        $store = Injector::inst()->create(StateStore::class . '.' . $gridField->getName());
        $this->assertSame([
            'grid' => 'Records',
            'actionName' => 'bulkupdate',
            'args' => ['scope' => 'all'],
        ], $store->load($stateKey));
    }

    public function testShouldShowFalseRendersNothing(): void
    {
        $component = new class ('hidden', 'Hidden') extends GridFieldToolbarModalAction {
            protected function shouldShow(GridField $gridField): bool
            {
                return false;
            }
        };
        $gridField = $this->gridField($component);

        $this->assertSame([], $component->getHTMLFragments($gridField));
    }
}
