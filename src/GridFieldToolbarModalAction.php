<?php

namespace Restruct\Silverstripe\Simpler;

use SilverStripe\Forms\FieldList;
use SilverStripe\Forms\GridField\GridField;
use SilverStripe\Forms\GridField\GridField_ActionProvider;
use SilverStripe\Forms\GridField\GridField_FormAction;
use SilverStripe\Forms\GridField\GridField_HTMLProvider;
use SilverStripe\ORM\FieldType\DBHTMLText;

/**
 * GridField toolbar button that opens a modal with configurable form fields.
 *
 * This component:
 * - Renders a button in the GridField toolbar (buttons-before-left by default)
 * - Opens a modal dialog via simpler.modal when clicked
 * - The modal contains form fields that submit through GridField's action routing
 * - Uses GridField_FormAction for proper action state management
 *
 * Key difference from SimplerModalAction:
 * - SimplerModalAction is for DataObject edit forms (FieldList in form actions)
 * - GridFieldToolbarModalAction is for GridField toolbars (action routing via StateID)
 *
 * Usage:
 * ```php
 * // Basic - extend and override handleAction():
 * class MyGridFieldAction extends GridFieldToolbarModalAction
 * {
 *     public function __construct()
 *     {
 *         parent::__construct('myaction', 'Do Something');
 *         $this->setDialogTitle('Configure Action');
 *         $this->setFieldList(FieldList::create([
 *             DropdownField::create('Option', 'Choose', $options),
 *         ]));
 *     }
 *
 *     public function handleAction(GridField $gridField, $actionName, $arguments, $data)
 *     {
 *         if ($actionName !== 'myaction') {
 *             return;
 *         }
 *         $option = $data['Option'] ?? null;
 *         // Do something with the form data...
 *     }
 * }
 *
 * // Then add to GridField config:
 * $config->addComponent(new MyGridFieldAction());
 * ```
 */
class GridFieldToolbarModalAction implements GridField_HTMLProvider, GridField_ActionProvider
{
    protected string $actionName;
    protected string $buttonLabel;
    protected string $targetFragment = 'buttons-before-left';
    protected ?FieldList $fieldList = null;
    protected string $dialogTitle = '';
    protected string $submitLabel = 'Submit';
    protected string $buttonClasses = 'btn btn-outline-primary';
    protected ?string $buttonIcon = null;
    protected ?string $modalSize = null;
    protected array $actionArguments = [];

    /**
     * @param string $actionName The GridField action name (lowercase, no spaces)
     * @param string $buttonLabel Label shown on the toolbar button
     */
    public function __construct(string $actionName, string $buttonLabel)
    {
        $this->actionName = $actionName;
        $this->buttonLabel = $buttonLabel;
        $this->dialogTitle = $buttonLabel;
    }

    /**
     * Set the fields to show in the modal form
     */
    public function setFieldList(FieldList $fieldList): self
    {
        $this->fieldList = $fieldList;
        return $this;
    }

    /**
     * Get the field list
     */
    public function getFieldList(): ?FieldList
    {
        return $this->fieldList;
    }

    /**
     * Set the modal dialog title
     */
    public function setDialogTitle(string $title): self
    {
        $this->dialogTitle = $title;
        return $this;
    }

    /**
     * Get the dialog title
     */
    public function getDialogTitle(): string
    {
        return $this->dialogTitle;
    }

    /**
     * Set the submit button label in the modal
     */
    public function setSubmitLabel(string $label): self
    {
        $this->submitLabel = $label;
        return $this;
    }

    /**
     * Get the submit label
     */
    public function getSubmitLabel(): string
    {
        return $this->submitLabel;
    }

    /**
     * Set button CSS classes
     */
    public function setButtonClasses(string $classes): self
    {
        $this->buttonClasses = $classes;
        return $this;
    }

    /**
     * Get button classes
     */
    public function getButtonClasses(): string
    {
        return $this->buttonClasses;
    }

    /**
     * Set button icon (font-icon-xxx name without the prefix)
     */
    public function setButtonIcon(?string $icon): self
    {
        $this->buttonIcon = $icon;
        return $this;
    }

    /**
     * Get button icon
     */
    public function getButtonIcon(): ?string
    {
        return $this->buttonIcon;
    }

    /**
     * Set modal size ('sm', 'lg', 'xl' or custom like '800px')
     */
    public function setModalSize(?string $size): self
    {
        $this->modalSize = $size;
        return $this;
    }

    /**
     * Get modal size
     */
    public function getModalSize(): ?string
    {
        return $this->modalSize;
    }

    /**
     * Set target fragment for button placement
     */
    public function setTargetFragment(string $fragment): self
    {
        $this->targetFragment = $fragment;
        return $this;
    }

    /**
     * Get target fragment
     */
    public function getTargetFragment(): string
    {
        return $this->targetFragment;
    }

    /**
     * Set additional action arguments (passed to handleAction)
     */
    public function setActionArguments(array $args): self
    {
        $this->actionArguments = $args;
        return $this;
    }

    /**
     * Get action arguments
     */
    public function getActionArguments(): array
    {
        return $this->actionArguments;
    }

    /**
     * Check if this action should be shown.
     * Override in subclass for conditional display.
     */
    protected function shouldShow(GridField $gridField): bool
    {
        return true;
    }

    /**
     * Render the button HTML
     */
    public function getHTMLFragments($gridField)
    {
        if (!$this->shouldShow($gridField)) {
            return [];
        }

        SimplerModalField::set_requirements();

        // Build modal config
        $modalConfig = $this->buildModalConfig($gridField);

        // Build button classes with icon
        $classes = $this->buttonClasses;
        if ($this->buttonIcon) {
            $classes .= ' font-icon-' . $this->buttonIcon;
        }

        // Create the button with data-simpler-modal attribute
        $html = sprintf(
            '<button type="button" class="%s" data-simpler-modal=\'%s\'>%s</button>',
            htmlspecialchars($classes),
            htmlspecialchars(json_encode($modalConfig), ENT_QUOTES, 'UTF-8'),
            htmlspecialchars($this->buttonLabel)
        );

        return [
            $this->targetFragment => DBHTMLText::create()->setValue($html),
        ];
    }

    /**
     * Build the modal configuration including the form HTML
     */
    protected function buildModalConfig(GridField $gridField): array
    {
        $config = [
            'title' => $this->dialogTitle,
            'closeBtn' => true,
            'closeTxt' => 'Annuleren',
            'saveBtn' => false,  // We use our own form submit button
        ];

        if ($this->modalSize) {
            $config['size'] = $this->modalSize;
        }

        // Build the form HTML with GridField action routing
        $config['bodyHtml'] = $this->renderModalFormHtml($gridField);

        return $config;
    }

    /**
     * Render the modal form HTML with GridField action button
     */
    protected function renderModalFormHtml(GridField $gridField): string
    {
        // Create a GridField_FormAction for proper action routing
        $submitAction = GridField_FormAction::create(
            $gridField,
            $this->actionName . '_submit',
            $this->submitLabel,
            $this->actionName,
            $this->actionArguments
        );
        $submitAction->addExtraClass('btn btn-primary font-icon-tick');

        // Get the form from the GridField
        $form = $gridField->getForm();

        // Render fields (if any)
        $fieldsHtml = '';
        if ($this->fieldList && $this->fieldList->count()) {
            foreach ($this->fieldList as $field) {
                $field->setForm($form);
                $fieldsHtml .= $field->FieldHolder()->forTemplate();
            }
        }

        // Build form HTML that posts to the main form
        // The GridField_FormAction button will handle proper routing
        $formAction = $form ? $form->FormAction() : '';
        $securityToken = $form ? $form->getSecurityToken()->getSecurityID() : '';

        $html = <<<HTML
<form method="post" action="{$formAction}" class="simpler-modal-gridfield-form">
    <input type="hidden" name="SecurityID" value="{$securityToken}" />
    <div class="modal-form-fields">
        {$fieldsHtml}
    </div>
    <div class="modal-form-actions mt-3 text-right">
        {$submitAction->Field()->forTemplate()}
    </div>
</form>
HTML;

        return $html;
    }

    /**
     * Return the actions this component provides
     */
    public function getActions($gridField)
    {
        return [$this->actionName];
    }

    /**
     * Handle the action - override in subclass
     *
     * @param GridField $gridField The GridField
     * @param string $actionName The action name
     * @param array $arguments Arguments passed via setActionArguments()
     * @param array $data Form data including modal form fields
     */
    public function handleAction(GridField $gridField, $actionName, $arguments, $data)
    {
        // Override in subclass to handle the action
    }
}
