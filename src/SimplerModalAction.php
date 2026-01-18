<?php

namespace Restruct\Silverstripe\Simpler;

use LeKoala\PureModal\PureModalAction;
use SilverStripe\Control\Controller;
use SilverStripe\Forms\FieldList;
use SilverStripe\Forms\Form;
use SilverStripe\Forms\FormAction;
use SilverStripe\ORM\FieldType\DBHTMLText;

/**
 * Drop-in replacement for PureModalAction that uses simpler.modal.
 *
 * Key advantage: Modal is appended to document.body (outside CMS form),
 * so the form fields can be wrapped in a real <form> that submits directly!
 * No need for the hacky "move modal, add hidden field, submit parent form" approach.
 *
 * Usage: Change "use LeKoala\PureModal\PureModalAction" to
 *        "use Restruct\Silverstripe\Simpler\SimplerModalAction as PureModalAction"
 */
class SimplerModalAction extends PureModalAction
{
    /**
     * Modal size: 'sm', 'lg', 'xl' for Bootstrap sizes, or custom CSS value like '800px', '90vw'
     */
    protected ?string $modalSize = null;

    /**
     * Set modal size: 'sm', 'lg', 'xl' for Bootstrap sizes, or custom CSS value like '800px', '90vw'
     */
    public function setModalSize(string $size): self
    {
        $this->modalSize = $size;
        return $this;
    }

    public function getModalSize(): ?string
    {
        return $this->modalSize;
    }

    /**
     * Build JSON config for data attribute
     */
    public function getModalConfig(): array
    {
        $config = [
            'title' => $this->getDialogTitle() ?: $this->Title(),
            'closeBtn' => true,
            'closeTxt' => 'Cancel',
            'saveBtn' => false,  // Form has its own submit button
            'saveTxt' => 'Save',
        ];

        // Add size if set
        if ($this->modalSize) {
            $config['size'] = $this->modalSize;
        }

        // Render fieldList as proper SilverStripe Form
        $fieldList = $this->getFieldList();
        if ($fieldList && $fieldList->count()) {
            $config['bodyHtml'] = $this->renderModalForm()->forTemplate();
        } else {
            $config['bodyHtml'] = '';
        }

        return $config;
    }

    /**
     * Get the dialog title
     */
    protected function getDialogTitle(): ?string
    {
        return $this->dialogButtonTitle ?: $this->title;
    }

    /**
     * Build a proper SilverStripe Form for the modal
     * Works because modal is outside CMS form - no nested form issues!
     */
    protected function renderModalForm(): Form
    {
        $actionName = $this->actionName();
        $actionUrl = $this->form ? $this->form->FormAction() : '';

        // Create action button
        $actions = FieldList::create();
        if ($this->getShowDialogButton()) {
            $actions->push(
                FormAction::create('doCustomAction[' . $actionName . ']', $this->getDialogButtonTitle())
                    ->addExtraClass('btn-primary font-icon-tick')
            );
        }

        // Build form with fields and action
        $form = Form::create(
            Controller::curr(),
            'SimplerModalForm_' . $actionName,
            $this->getFieldList(),
            $actions
        );

        $form->setFormAction($actionUrl);
        $form->addExtraClass('simpler-modal-form');

        return $form;
    }

    /**
     * JSON-encoded config for data attribute
     */
    public function getModalConfigJSON(): string
    {
        return json_encode($this->getModalConfig(), JSON_HEX_APOS | JSON_HEX_QUOT);
    }

    /**
     * Get button title with icon for template
     */
    public function getButtonTitle(): string
    {
        $title = $this->title;
        if ($this->buttonIcon) {
            $title = '<span class="font-icon-' . $this->buttonIcon . '"></span> ' . $title;
        }
        return $title;
    }

    /**
     * @param array<string,mixed> $properties
     * @return DBHTMLText
     */
    public function Field($properties = []): DBHTMLText
    {
        SimplerModalField::set_requirements();
        return $this->renderWith(self::class);
    }
}
