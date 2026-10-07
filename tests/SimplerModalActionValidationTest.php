<?php

namespace Restruct\Silverstripe\Simpler\Tests;

use LeKoala\PureModal\PureModalAction;
use Restruct\Silverstripe\Simpler\AdminExtension;
use Restruct\Silverstripe\Simpler\SimplerModalAction;
use Restruct\Silverstripe\Simpler\SimplerModalExemptAction;
use Restruct\Silverstripe\Simpler\Tests\Stub\CustomActionController;
use SilverStripe\Control\HTTPRequest;
use SilverStripe\Control\HTTPResponse;
use SilverStripe\Control\Session;
use SilverStripe\Core\Config\Config;
use SilverStripe\Dev\SapphireTest;
use SilverStripe\Forms\DropdownField;
use SilverStripe\Forms\FieldList;
use SilverStripe\Forms\Form;
use SilverStripe\Forms\FormAction;
use SilverStripe\Forms\TextField;

/**
 * Issue #18: the modal of a SimplerModalAction posts only its own fields to the edit form's URL, so
 * the edit form must not be validated for that POST (on Silverstripe 5 a dropdown without an empty
 * option failed it, as does any RequiredFields on either major). Driven through the real
 * FormRequestHandler::httpSubmission(), with a controller that handles doCustomAction() the way
 * cms-actions does.
 *
 * Needs lekoala/silverstripe-pure-modal, see SimplerModalFieldTest.
 */
class SimplerModalActionValidationTest extends SapphireTest
{
    private ?CustomActionController $controller = null;

    protected function setUp(): void
    {
        parent::setUp();
        if (!class_exists(PureModalAction::class)) {
            $this->markTestSkipped('lekoala/silverstripe-pure-modal is not installed');
        }
        Config::modify()->set(AdminExtension::class, 'skip_import_map_check', true);
        $this->controller = CustomActionController::createWithSession();
        $this->controller->pushCurrent();
    }

    protected function tearDown(): void
    {
        if ($this->controller) {
            $this->controller->popCurrent();
        }
        parent::tearDown();
    }

    /**
     * An edit form that fails validation whenever its own fields are missing from the POST: a
     * dropdown without an empty option (the SS5 case of the issue) and a required Title (both majors).
     */
    private function editForm(): Form
    {
        $form = Form::create(
            $this->controller,
            'ItemEditForm',
            FieldList::create(
                TextField::create('Title'),
                DropdownField::create('Status', 'Status', ['draft' => 'Draft', 'published' => 'Published'])
            ),
            FieldList::create(
                FormAction::create('doSave', 'Save'),
                SimplerModalAction::create('rename', 'Rename')
                    ->setFieldList(FieldList::create(TextField::create('NewTitle')))
            ),
            $this->requiredTitle()
        );
        // The CSRF check is not what is under test; the modal form carries the SecurityID in real use.
        $form->disableSecurityToken();
        return $form;
    }

    /**
     * RequiredFields on Silverstripe 5, renamed RequiredFieldsValidator (new namespace) on 6.
     */
    private function requiredTitle(): object
    {
        $class = class_exists('SilverStripe\\Forms\\Validation\\RequiredFieldsValidator')
            ? 'SilverStripe\\Forms\\Validation\\RequiredFieldsValidator'
            : 'SilverStripe\\Forms\\RequiredFields';
        return $class::create('Title');
    }

    /**
     * POST the given data to the form the way the browser does, through the form's request handler.
     *
     * @param array<string,mixed> $postVars
     * @return mixed What the handler returned: the controller's string, or a validation response.
     */
    private function submit(Form $form, array $postVars)
    {
        $request = new HTTPRequest('POST', 'simpler-test/ItemEditForm', [], $postVars);
        $request->setSession(new Session([]));
        $handler = $form->getRequestHandler();
        // handleRequest() would set this before dispatching to httpSubmission()
        $handler->setRequest($request);
        return $handler->httpSubmission($request);
    }

    public function testModalSubmitSkipsTheEditFormValidation(): void
    {
        // Exactly what the modal form posts: its own field and its submit button, nothing of the edit form
        $result = $this->submit($this->editForm(), [
            'NewTitle' => 'Renamed',
            'action_doCustomAction' => ['rename' => 'Rename'],
        ]);
        $this->assertSame('ran:rename:Renamed', $result, 'the modal action must reach its handler unvalidated');
    }

    public function testOtherCustomActionsAreStillValidated(): void
    {
        // A plain cms-actions CustomAction posts the whole edit form and must keep being validated
        $result = $this->submit($this->editForm(), [
            'action_doCustomAction' => ['somethingElse' => 'Go'],
        ]);
        $this->assertInstanceOf(HTTPResponse::class, $result, 'a non-modal custom action must not skip validation');
        $this->assertNotSame('ran:somethingElse:', $result);
    }

    public function testRegularSaveIsStillValidated(): void
    {
        $form = $this->editForm();
        $form->getRequestHandler()->setButtonClicked('doSave');
        $request = new HTTPRequest('POST', 'simpler-test/ItemEditForm', [], ['action_doSave' => 'Save']);
        $form->getRequestHandler()->setRequest($request);
        $this->assertFalse($form->validate()->isValid(), 'a save without Title must still fail validation');
    }

    public function testStandInIsAddedOnceAtTheEndAndIsNeverTheDefaultAction(): void
    {
        $form = $this->editForm();
        $actions = $form->Actions();
        $last = $actions->last();
        $this->assertInstanceOf(SimplerModalExemptAction::class, $last);
        $this->assertSame('rename', $last->getModalActionName());
        $this->assertSame($form, $last->getForm());
        $this->assertCount(
            1,
            array_filter($actions->dataFields(), fn ($f) => $f instanceof SimplerModalExemptAction)
        );

        // Setting the form again (readonly transformation, setActions) does not add a second one
        $form->setActions($actions);
        $this->assertCount(
            1,
            array_filter($form->Actions()->dataFields(), fn ($f) => $f instanceof SimplerModalExemptAction)
        );

        // The server-side default action (a POST without any action_ parameter) stays the first real button
        $this->assertSame('doSave', $form->defaultAction()->actionName());
    }

    public function testStandInRendersNothing(): void
    {
        $standIn = $this->editForm()->Actions()->last();
        $this->assertInstanceOf(SimplerModalExemptAction::class, $standIn);
        // Nothing in the CMS action bar to see or click, and no extra submit button for the Enter key
        $this->assertSame('', (string) $standIn->Field());
        $this->assertSame('', (string) $standIn->FieldHolder());
        $this->assertSame('', (string) $standIn->SmallFieldHolder());
    }
}
