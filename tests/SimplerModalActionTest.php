<?php

namespace Restruct\Silverstripe\Simpler\Tests;

use DOMDocument;
use DOMXPath;
use LeKoala\PureModal\PureModalAction;
use Restruct\Silverstripe\Simpler\AdminExtension;
use Restruct\Silverstripe\Simpler\SimplerModalAction;
use Restruct\Silverstripe\Simpler\Tests\Stub\TestController;
use SilverStripe\Core\Config\Config;
use SilverStripe\Dev\SapphireTest;
use SilverStripe\Forms\DropdownField;
use SilverStripe\Forms\FieldList;
use SilverStripe\Forms\Form;
use SilverStripe\Forms\TextareaField;
use SilverStripe\View\Requirements;
use SilverStripe\View\Requirements_Backend;

/**
 * SimplerModalAction: title priority, the real <form> rendered into the modal body, and the button.
 *
 * Needs lekoala/silverstripe-pure-modal, see SimplerModalFieldTest.
 */
class SimplerModalActionTest extends SapphireTest
{
    private ?Requirements_Backend $previousBackend = null;

    private ?TestController $controller = null;

    protected function setUp(): void
    {
        parent::setUp();
        if (!class_exists(PureModalAction::class)) {
            $this->markTestSkipped('lekoala/silverstripe-pure-modal is not installed');
        }
        Config::modify()->set(AdminExtension::class, 'skip_import_map_check', true);
        $this->previousBackend = Requirements::backend();
        Requirements::set_backend(Requirements_Backend::create());
        // renderModalForm() builds its Form on Controller::curr()
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

    private function actionInForm(SimplerModalAction $action): SimplerModalAction
    {
        // A CMS action normally lives in the edit form's actions; its FormAction() is the post target
        Form::create($this->controller, 'EditForm', FieldList::create(), FieldList::create($action));
        return $action;
    }

    public function testTitlePriority(): void
    {
        $action = SimplerModalAction::create('translate', 'Translate');
        $this->assertSame('Translate', $action->getModalConfig()['title']);

        $action->setDialogButtonTitle('Start translation');
        $this->assertSame('Start translation', $action->getModalConfig()['title']);

        // modalTitle wins over the dialog button title (restruct/silverstripe-simpler#4)
        $action->setModalTitle('Translate this page');
        $this->assertSame('Translate this page', $action->getModalConfig()['title']);
        $this->assertSame('Translate this page', $action->getModalTitle());
    }

    public function testNoFieldsGivesEmptyBody(): void
    {
        $config = SimplerModalAction::create('translate', 'Translate')->setModalSize('600px')->getModalConfig();

        $this->assertSame('', $config['bodyHtml']);
        $this->assertSame('600px', $config['size']);
        $this->assertFalse($config['closeBtn']);
    }

    public function testFieldsRenderAsARealFormPostingToTheParentForm(): void
    {
        $action = $this->actionInForm(
            SimplerModalAction::create('translate', 'Translate')
                ->setFieldList(FieldList::create([
                    DropdownField::create('lang', 'Language', ['en' => 'English', 'nl' => 'Dutch']),
                    TextareaField::create('notes', 'Notes'),
                ]))
                ->setDialogButtonTitle('Start translation')
        );

        $doc = new DOMDocument();
        $doc->loadHTML('<?xml encoding="utf-8"?><body>' . $action->getModalConfig()['bodyHtml'] . '</body>', LIBXML_NOERROR | LIBXML_NOWARNING);
        $xpath = new DOMXPath($doc);

        $forms = $xpath->query('//form');
        $this->assertSame(1, $forms->length);
        $form = $forms->item(0);
        $this->assertStringContainsString('simpler-modal-form', $form->getAttribute('class'));
        // Posts to the parent (CMS) form's action URL
        $this->assertSame('simpler-test/EditForm', $form->getAttribute('action'));
        $this->assertSame(1, $xpath->query('//form//select[@name="lang"]')->length);
        $this->assertSame(1, $xpath->query('//form//textarea[@name="notes"]')->length);
        // The submit button routes to the same custom action the CMS button would
        $submit = $xpath->query('//form//*[@name="action_doCustomAction[translate]"]');
        $this->assertSame(1, $submit->length);
    }

    public function testNoSubmitButtonWhenDialogButtonHidden(): void
    {
        $action = $this->actionInForm(
            SimplerModalAction::create('translate', 'Translate')
                ->setFieldList(FieldList::create([TextareaField::create('notes', 'Notes')]))
                ->setShowDialogButton(false)
        );

        $this->assertStringNotContainsString('action_doCustomAction[translate]', $action->getModalConfig()['bodyHtml']);
    }

    public function testFieldRendersButtonCarryingTheConfig(): void
    {
        $action = $this->actionInForm(
            SimplerModalAction::create('translate', 'Translate')->setButtonIcon('translate', 'bs')
        );

        $doc = new DOMDocument();
        $doc->loadHTML('<?xml encoding="utf-8"?><body>' . $action->Field() . '</body>', LIBXML_NOERROR | LIBXML_NOWARNING);
        $buttons = $doc->getElementsByTagName('button');
        $this->assertSame(1, $buttons->length);
        $button = $buttons->item(0);

        $classes = explode(' ', $button->getAttribute('class'));
        $this->assertContains('bi', $classes);
        $this->assertContains('bi-translate', $classes);
        $this->assertSame('button', $button->getAttribute('type'));
        $this->assertSame($action->getModalConfig(), json_decode($button->getAttribute('data-simpler-modal'), true));
        $this->assertSame('Translate', trim($button->textContent));
    }
}
