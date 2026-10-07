<?php

namespace Restruct\Silverstripe\Simpler;

use SilverStripe\Control\Controller;
use SilverStripe\Control\HTTPRequest;
use SilverStripe\Forms\FormAction;
use SilverStripe\ORM\FieldType\DBHTMLText;

/**
 * Server-side stand-in for a SimplerModalAction's submit button, so the modal's POST skips the
 * edit form's validation (issue #18).
 *
 * The modal form (SimplerModalAction::renderModalForm()) is a separate form that posts only its own
 * fields, SecurityID and `action_doCustomAction[<name>]` to the edit form's URL, so the request is
 * handled as a submission of the whole edit form. Form::validate() then validates the edit form
 * against data that lacks all of its fields: on Silverstripe 5 any dropdown without an empty option
 * (an Enum) fails, as would any RequiredFields. The record method receives the modal's data only and
 * cms-actions' forwardActionToRecord() does not save the form, so the edit form's validation has
 * nothing to protect here.
 *
 * Form::validate() can only skip validation for a clicked button that
 * FormRequestHandler::buttonClicked() finds, and that only finds FormAction instances (a
 * SimplerModalAction is a DatalessField). Hence this button: SimplerModalAction::setForm() adds one
 * per modal action to the form, it renders nothing, and it is exempt only when the POST is for a
 * modal action.
 *
 * Not for direct use.
 */
class SimplerModalExemptAction extends FormAction
{
    /**
     * The custom action name this button stands in for (the <name> in doCustomAction[<name>]).
     */
    protected string $modalActionName;

    public function __construct(string $modalActionName)
    {
        $this->modalActionName = $modalActionName;
        # Same name as the modal's submit button, so it is unique per modal action in the FieldList and
        # recognisable in a debugger; the FormAction constructor prefixes it with action_.
        parent::__construct('doCustomAction[' . $modalActionName . ']', '');
    }

    public function getModalActionName(): string
    {
        return $this->modalActionName;
    }

    /**
     * The name FormRequestHandler resolves for the modal's POST.
     *
     * PHP parses `action_doCustomAction[<name>]` into `action_doCustomAction => [<name> => ...]`, so
     * httpSubmission() derives the function name `doCustomAction` and buttonClicked() looks for an
     * action whose actionName() is exactly that. Every cms-actions custom action resolves to the same
     * name, which is why getValidationExempt() checks which one was actually posted.
     */
    public function actionName()
    {
        return 'doCustomAction';
    }

    /**
     * Exempt only when the posted custom action is one of the form's modal actions.
     *
     * buttonClicked() returns the FIRST matching button, so for a POST of any custom action this may be
     * the stand-in of a different modal action, or the POST may be a plain cms-actions CustomAction
     * submitted with the whole edit form (which must keep being validated). So the decision is taken
     * on the posted name against every stand-in in the form, not against this button alone.
     */
    public function getValidationExempt()
    {
        $requested = $this->getRequestedCustomAction();
        if ($requested === null) {
            return false;
        }
        $form = $this->getForm();
        if (!$form) {
            return $requested === $this->modalActionName;
        }
        foreach ([$form->Fields(), $form->Actions()] as $list) {
            if (!$list) {
                continue;
            }
            foreach ($list->dataFields() as $field) {
                if ($field instanceof self && $field->getModalActionName() === $requested) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * The <name> of a posted `action_doCustomAction[<name>]`, or null when the request posted none
     * (a GET, a regular save, or a default-action submit without any action_ parameter).
     */
    protected function getRequestedCustomAction(): ?string
    {
        $request = $this->getCurrentRequest();
        if (!$request) {
            return null;
        }
        $posted = $request->postVar('action_doCustomAction');
        # cms-actions' doCustomAction() takes key() of this array; a scalar or empty value is not a
        # modal submit, and nothing should be exempted for it.
        if (!is_array($posted) || count($posted) !== 1) {
            return null;
        }
        return (string) array_key_first($posted);
    }

    protected function getCurrentRequest(): ?HTTPRequest
    {
        # The form's request handler holds the request it is processing (RequestHandler::handleRequest()
        # sets it); the current controller is the fallback for a form handled some other way.
        $handlerRequest = $this->getForm()?->getRequestHandler()?->getRequest();
        if ($handlerRequest instanceof HTTPRequest) {
            return $handlerRequest;
        }
        if (Controller::has_curr()) {
            $request = Controller::curr()->getRequest();
            return $request instanceof HTTPRequest ? $request : null;
        }
        return null;
    }

    /**
     * Never rendered: the modal has its own visible submit button, and a button here would show in the
     * CMS action bar and could become the browser's default (Enter-key) submit button of the edit form.
     *
     * @param array<string,mixed> $properties
     */
    public function Field($properties = [])
    {
        return DBHTMLText::create();
    }

    /**
     * @param array<string,mixed> $properties
     */
    public function FieldHolder($properties = [])
    {
        return DBHTMLText::create();
    }

    /**
     * @param array<string,mixed> $properties
     */
    public function SmallFieldHolder($properties = [])
    {
        return DBHTMLText::create();
    }
}
