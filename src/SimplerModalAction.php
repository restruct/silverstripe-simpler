<?php

namespace Restruct\Silverstripe\Simpler;

use LeKoala\PureModal\PureModalAction;
use SilverStripe\Control\Controller;
use SilverStripe\Forms\FieldList;
use SilverStripe\Forms\Form;
use SilverStripe\Forms\FormAction;
use SilverStripe\ORM\FieldType\DBHTMLText;

// Only define class if parent exists (pure-modal is an optional dependency)
if (class_exists(PureModalAction::class)) {

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
     * Separate modal title (independent from submit button text)
     */
    protected ?string $modalTitle = null;

    /** @var string|false Icon prefix: 'ss' for font-icon-, 'bs' for bi bi-, false for no prefix */
    protected string|false $buttonIconPrefix = 'ss';

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
     * Set the modal dialog title independently from the submit button text.
     *
     * This allows for a descriptive title like "Generate questions with Claude"
     * while keeping the submit button concise like "Generate".
     *
     * @param string $title The modal dialog title
     */
    public function setModalTitle(string $title): self
    {
        $this->modalTitle = $title;
        return $this;
    }

    /**
     * Get the modal title
     */
    public function getModalTitle(): ?string
    {
        return $this->modalTitle;
    }

    /**
     * Set button icon with optional prefix
     *
     * @param string|null $icon Icon name (e.g., 'eye', 'file-pdf')
     * @param string|false $prefix Icon prefix: 'ss' for font-icon- (default), 'bs' for bi bi-, false for no prefix
     */
    public function setButtonIcon(?string $icon, string|false $prefix = 'ss'): self
    {
        $this->buttonIcon = $icon;
        $this->buttonIconPrefix = $prefix;
        return $this;
    }

    /**
     * Get the full CSS class string for the button icon
     */
    public function getButtonIconClass(): string
    {
        if (!$this->buttonIcon) {
            return '';
        }
        return match ($this->buttonIconPrefix) {
            'ss' => 'font-icon-' . $this->buttonIcon,
            'bs' => 'bi bi-' . $this->buttonIcon,
            false => $this->buttonIcon,
        };
    }

    /**
     * Build JSON config for data attribute
     */
    public function getModalConfig(): array
    {
        $config = [
            'title' => $this->getDialogTitle() ?: $this->Title(),
            'closeBtn' => false,  // Modal has X button; form has its own action button
            'closeTxt' => 'Cancel',
            'saveBtn' => false,
            'saveTxt' => 'Save',
        ];

        // Add size if set
        if ($this->modalSize) {
            $config['size'] = $this->modalSize;
        }

        // Render fieldList as proper SilverStripe Form
        $fieldList = $this->getFieldList();
        if ($fieldList && $fieldList->count()) {
            $config['bodyHtml'] = (string) $this->renderModalForm()->forTemplate();
        } else {
            $config['bodyHtml'] = '';
        }

        return $config;
    }

    /**
     * Get modal config as JSON string for use in template with .ATT
     */
    public function getModalConfigJson(): string
    {
        return json_encode($this->getModalConfig(), JSON_HEX_APOS | JSON_HEX_QUOT);
    }

    /**
     * Get the dialog title.
     *
     * Priority: modalTitle > dialogButtonTitle > title
     */
    protected function getDialogTitle(): ?string
    {
        return $this->modalTitle ?: $this->dialogButtonTitle ?: $this->title;
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
     * Get button title for template (icon is handled via ButtonIconClass on the button element)
     */
    public function getButtonTitle(): string
    {
        return $this->title;
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

} // end if class_exists