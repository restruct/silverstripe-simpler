<?php

namespace Restruct\Silverstripe\Simpler;

use SilverStripe\Core\Injector\Injectable;
use SilverStripe\Core\Injector\Injector;
use SilverStripe\Forms\FieldList;
use SilverStripe\Forms\GridField\GridField;
use SilverStripe\Forms\GridField\GridField_ActionProvider;
use SilverStripe\Forms\GridField\GridField_FormAction;
use SilverStripe\Forms\GridField\GridField_HTMLProvider;
use SilverStripe\Forms\GridField\FormAction\StateStore;
use SilverStripe\ORM\FieldType\DBHTMLText;

/**
 * GridField toolbar button that opens a modal with configurable content.
 *
 * Supports two modes:
 * 1. **Form mode**: Modal with form fields that submit through GridField action routing
 * 2. **View-only mode**: Modal with static HTML or iframe content (no form buttons)
 *
 * The mode is automatically determined:
 * - If `setIframeSrc()` or `setBodyHtml()` is called → view-only mode
 * - If `setFieldList()` is called → form mode
 *
 * Key difference from SimplerModalAction:
 * - SimplerModalAction is for DataObject edit forms (FieldList in form actions)
 * - GridFieldToolbarModalAction is for GridField toolbars (action routing via StateID)
 *
 * Usage:
 * ```php
 * // Form mode - extend and override handleAction():
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
 *         if ($actionName !== 'myaction') return;
 *         $option = $data['Option'] ?? null;
 *         // Do something...
 *     }
 * }
 *
 * // View-only mode - iframe content (e.g., PDF viewer):
 * GridFieldToolbarModalAction::create('view', 'View PDF')
 *     ->setIframeSrc('/path/to/document.pdf')
 *     ->setIframeHeight('85vh')
 *     ->setModalSize('60vw')
 *     ->setButtonIcon('file-pdf', 'bs')  // 'ss' (default) = font-icon-, 'bs' = bi bi-
 *     ->setButtonClasses('btn btn-outline-info');
 *
 * // View-only mode - HTML content:
 * GridFieldToolbarModalAction::create('preview', 'Preview')
 *     ->setBodyHtml('<div class="preview">...</div>');
 * ```
 */
class GridFieldToolbarModalAction implements GridField_HTMLProvider, GridField_ActionProvider
{
    use Injectable;

    protected string $actionName;
    protected string $buttonLabel;
    protected string $targetFragment = 'buttons-before-left';
    protected ?FieldList $fieldList = null;
    protected string $dialogTitle = '';
    protected string $submitLabel = 'Submit';
    protected string $buttonClasses = 'btn btn-outline-primary';
    protected ?string $buttonIcon = null;
    /** @var string|false Icon prefix: 'ss' for font-icon-, 'bs' for bi bi-, false for no prefix */
    protected string|false $buttonIconPrefix = 'ss';
    protected ?string $modalSize = null;
    protected array $actionArguments = [];

    // View-only mode properties
    protected ?string $iframeSrc = null;
    protected string $iframeHeight = '70vh';
    protected ?string $bodyHtml = null;

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
     * Alias for setDialogTitle() for API consistency
     */
    public function setModalTitle(string $title): self
    {
        return $this->setDialogTitle($title);
    }

    /**
     * Get the dialog title
     */
    public function getDialogTitle(): string
    {
        return $this->dialogTitle;
    }

    /**
     * Alias for getDialogTitle() for API consistency
     */
    public function getModalTitle(): string
    {
        return $this->getDialogTitle();
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
     * Set button icon name (without prefix)
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
     * Set iframe source URL for modal body (enables view-only mode)
     */
    public function setIframeSrc(string $url): self
    {
        $this->iframeSrc = $url;
        return $this;
    }

    /**
     * Get iframe source
     */
    public function getIframeSrc(): ?string
    {
        return $this->iframeSrc;
    }

    /**
     * Set iframe height (CSS value like '70vh', '500px')
     */
    public function setIframeHeight(string $height): self
    {
        $this->iframeHeight = $height;
        return $this;
    }

    /**
     * Get iframe height
     */
    public function getIframeHeight(): string
    {
        return $this->iframeHeight;
    }

    /**
     * Set HTML content for modal body (enables view-only mode)
     */
    public function setBodyHtml(string $html): self
    {
        $this->bodyHtml = $html;
        return $this;
    }

    /**
     * Get body HTML
     */
    public function getBodyHtml(): ?string
    {
        return $this->bodyHtml;
    }

    /**
     * Check if this is a view-only modal (no form submission)
     */
    public function isViewOnly(): bool
    {
        return $this->iframeSrc !== null || $this->bodyHtml !== null;
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
            $iconClass = match ($this->buttonIconPrefix) {
                'ss' => 'font-icon-' . $this->buttonIcon,
                'bs' => 'bi bi-' . $this->buttonIcon,
                false => $this->buttonIcon,
            };
            $classes .= ' ' . $iconClass;
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
     * Build the modal configuration including the body HTML
     */
    protected function buildModalConfig(GridField $gridField): array
    {
        $config = [
            'title' => $this->dialogTitle,
            'closeBtn' => false,
            'saveBtn' => false,
        ];

        if ($this->modalSize) {
            $config['size'] = $this->modalSize;
        }

        // View-only mode: render iframe or static HTML
        if ($this->isViewOnly()) {
            $config['bodyHtml'] = $this->renderViewOnlyHtml();
        } else {
            // Form mode: render form with GridField action routing
            $config['bodyHtml'] = $this->renderModalFormHtml($gridField);
        }

        return $config;
    }

    /**
     * Render view-only content (iframe or static HTML)
     */
    protected function renderViewOnlyHtml(): string
    {
        if ($this->iframeSrc) {
            return sprintf(
                '<iframe src="%s" style="width:100%%;height:%s;border:none" frameborder="0"></iframe>',
                htmlspecialchars($this->iframeSrc),
                htmlspecialchars($this->iframeHeight)
            );
        }

        return $this->bodyHtml ?? '';
    }

    /**
     * Render the modal form HTML with AJAX submit support.
     *
     * Instead of a native form submit (which replaces the page with raw HTML),
     * we render a container with data attributes that JS uses for AJAX submission.
     * This provides:
     * - Loading state feedback during long-running operations
     * - Proper modal close and page reload on success
     * - Error display in modal on failure
     */
    protected function renderModalFormHtml(GridField $gridField): string
    {
        // Get the form from the GridField
        $form = $gridField->getForm();

        // Render fields (if any)
        $fieldsHtml = '';
        if ($this->fieldList && $this->fieldList->count()) {
            foreach ($this->fieldList as $field) {
                $field->setForm($form);
                # Cast to string — LiteralField::FieldHolder() returns string, others return DBHTMLText
                $fieldsHtml .= (string) $field->FieldHolder();
            }
        }

        // Get GridField URL and security token for AJAX submission
        $gridFieldUrl = htmlspecialchars($gridField->Link());
        $securityId = $form ? $form->getSecurityToken()->getSecurityID() : '';

        // Build the action button name manually (same logic as GridField_FormAction)
        $state = [
            'grid' => $gridField->getName(),
            'actionName' => $this->actionName,
            'args' => $this->actionArguments,
        ];
        $stateKey = GridField_FormAction::STATE_KEY_PREFIX . substr(md5(serialize($state)), 0, 8);
        $actionName = 'action_gridFieldAlterAction?StateID=' . $stateKey;

        // Store the state in session (same as GridField_FormAction does)
        $store = Injector::inst()->create(StateStore::class . '.' . $gridField->getName());
        $store->save($stateKey, $state);

        $submitLabel = htmlspecialchars($this->submitLabel);

        // Container with data attributes for JS AJAX handler
        // Uses btn-toolbar for proper button alignment (matches SilverStripe Form styling)
        $html = <<<HTML
<div class="simpler-modal-gridfield-form"
     data-gridfield-url="{$gridFieldUrl}"
     data-security-id="{$securityId}"
     data-action-name="{$actionName}">
    <div class="modal-form-fields">
        {$fieldsHtml}
    </div>
    <div class="btn-toolbar mt-3 justify-content-end" role="toolbar">
        <button type="button" class="btn btn-outline-secondary mr-2" data-dismiss="modal">Annuleren</button>
        <button type="button" class="btn btn-primary font-icon-tick simpler-modal-ajax-submit">
            {$submitLabel}
        </button>
    </div>
</div>
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
