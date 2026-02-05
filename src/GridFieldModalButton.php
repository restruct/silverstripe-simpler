<?php

namespace Restruct\Silverstripe\Simpler;

use SilverStripe\Forms\GridField\GridField;
use SilverStripe\Forms\GridField\GridField_ColumnProvider;
use SilverStripe\ORM\DataObject;

/**
 * Reusable GridField component that adds a button column with a modal popup.
 *
 * Uses Simpler module's modal (appended to document.body) which works
 * reliably within SilverStripe's React-based GridField.
 *
 * Subclasses should override:
 * - getButtonLabel() - Return the button text
 * - getModalTitle() - Return the modal title
 * - getModalContent() - Return the modal body content HTML
 * - shouldShowButton() - Control when the button appears
 *
 * Usage example:
 * ```php
 * class MyModalButton extends GridFieldModalButton
 * {
 *     protected function getButtonLabel(DataObject $record): string
 *     {
 *         return 'View Details';
 *     }
 *
 *     protected function getModalTitle(DataObject $record): string
 *     {
 *         return 'Details for ' . $record->Title;
 *     }
 *
 *     protected function getModalContent(DataObject $record): string
 *     {
 *         return '<p>' . htmlspecialchars($record->Description) . '</p>';
 *     }
 *
 *     protected function shouldShowButton(DataObject $record): bool
 *     {
 *         return $record->canView();
 *     }
 * }
 *
 * // In GridField config:
 * $config->addComponent(new MyModalButton());
 * ```
 */
class GridFieldModalButton implements GridField_ColumnProvider
{
    /**
     * Column name for this button
     */
    protected string $columnName = 'ModalAction';

    /**
     * CSS classes for the button
     */
    protected string $buttonClasses = 'btn btn-sm btn-outline-info action';

    /**
     * Modal size: 'sm', 'lg', 'xl' or custom CSS value like '800px', '90vw'
     */
    protected ?string $modalSize = null;

    /**
     * Whether to show close button in modal footer
     */
    protected bool $showCloseButton = true;

    /**
     * Close button text
     */
    protected string $closeButtonText = 'Sluiten';

    /**
     * Set the column name for this button.
     */
    public function setColumnName(string $name): self
    {
        $this->columnName = $name;
        return $this;
    }

    /**
     * Set the CSS classes for the button.
     */
    public function setButtonClasses(string $classes): self
    {
        $this->buttonClasses = $classes;
        return $this;
    }

    /**
     * Set the modal size.
     *
     * @param string $size 'sm', 'lg', 'xl' or custom CSS value like '800px', '90vw'
     */
    public function setModalSize(string $size): self
    {
        $this->modalSize = $size;
        return $this;
    }

    /**
     * Set whether to show the close button.
     */
    public function setShowCloseButton(bool $show): self
    {
        $this->showCloseButton = $show;
        return $this;
    }

    /**
     * Set the close button text.
     */
    public function setCloseButtonText(string $text): self
    {
        $this->closeButtonText = $text;
        return $this;
    }

    /**
     * Get the button label. Override in subclasses.
     */
    protected function getButtonLabel(DataObject $record): string
    {
        return 'Action';
    }

    /**
     * Get the modal title. Override in subclasses.
     */
    protected function getModalTitle(DataObject $record): string
    {
        return 'Modal';
    }

    /**
     * Get the modal content HTML. Override in subclasses.
     */
    protected function getModalContent(DataObject $record): string
    {
        return '';
    }

    /**
     * Determine if the button should be shown for this record.
     * Override in subclasses to add conditional logic.
     */
    protected function shouldShowButton(DataObject $record): bool
    {
        return true;
    }

    // =========================================================================
    // GridField_ColumnProvider Implementation
    // =========================================================================

    public function augmentColumns($gridField, &$columns)
    {
        // Ensure Simpler modal is available
        AdminExtension::assertImportMapAvailable();
        AdminExtension::requireModal();

        if (!in_array($this->columnName, $columns)) {
            $columns[] = $this->columnName;
        }
    }

    public function getColumnsHandled($gridField)
    {
        return [$this->columnName];
    }

    public function getColumnContent($gridField, $record, $columnName)
    {
        if (!$this->shouldShowButton($record)) {
            return '';
        }

        // Build modal config for Simpler modal
        $modalConfig = [
            'title' => $this->getModalTitle($record),
            'bodyHtml' => $this->getModalContent($record),
            'closeBtn' => $this->showCloseButton,
            'closeTxt' => $this->closeButtonText,
            'saveBtn' => false,
        ];

        if ($this->modalSize) {
            $modalConfig['size'] = $this->modalSize;
        }

        $configJson = htmlspecialchars(
            json_encode($modalConfig, JSON_HEX_APOS | JSON_HEX_QUOT),
            ENT_QUOTES,
            'UTF-8'
        );

        return sprintf(
            '<button type="button" class="%s" data-simpler-modal=\'%s\'>%s</button>',
            htmlspecialchars($this->buttonClasses),
            $configJson,
            htmlspecialchars($this->getButtonLabel($record))
        );
    }

    public function getColumnAttributes($gridField, $record, $columnName)
    {
        return [
            'class' => 'grid-field__col-compact',
        ];
    }

    public function getColumnMetadata($gridField, $columnName)
    {
        return ['title' => ''];
    }
}