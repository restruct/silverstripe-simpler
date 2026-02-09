<?php

namespace Restruct\Silverstripe\Simpler;

use SilverStripe\Core\ClassInfo;
use SilverStripe\Forms\GridField\GridField;
use SilverStripe\Forms\GridField\GridField_ActionMenuItem;
use SilverStripe\Forms\GridField\GridField_ActionProvider;
use SilverStripe\Forms\GridField\GridField_ColumnProvider;
use SilverStripe\Forms\GridField\GridField_FormAction;
use SilverStripe\ORM\DataObject;

/**
 * GridField component that adds a toggle button column for cycling field values.
 *
 * Supports boolean toggles, multi-state cycling, custom rendering, and callbacks.
 *
 * Basic usage (boolean field):
 * ```php
 * $config->addComponent(GridFieldToggleFieldButton::create('IsActive'));
 * ```
 *
 * With custom states:
 * ```php
 * $config->addComponent(
 *     GridFieldToggleFieldButton::create('Status')
 *         ->setStates([
 *             'draft' => ['icon' => 'edit', 'title' => 'Submit for Review'],
 *             'review' => ['icon' => 'eye', 'title' => 'Publish'],
 *             'published' => ['icon' => 'check-mark', 'title' => 'Archive'],
 *         ])
 * );
 * ```
 *
 * With callbacks:
 * ```php
 * $config->addComponent(
 *     GridFieldToggleFieldButton::create('IsActive')
 *         ->setShouldShow(fn($record) => $record->canEdit())
 *         ->setToggleAction(function($record, $newValue) {
 *             $record->IsActive = $newValue;
 *             $record->LastModified = DBDatetime::now();
 *         })
 * );
 * ```
 */
class GridFieldToggleFieldButton implements GridField_ColumnProvider, GridField_ActionProvider, GridField_ActionMenuItem
{
    protected string $fieldName;
    protected string $columnName = 'Actions';
    protected array $states = [];
    protected ?string $confirmMessage = null;
    protected bool $writeWithoutVersion = true;

    /** @var callable|null */
    protected $stateRenderer = null;

    /** @var callable|null */
    protected $shouldShowCallback = null;

    /** @var callable|null */
    protected $toggleActionCallback = null;

    /**
     * @param string $fieldName The field to toggle
     */
    public function __construct(string $fieldName)
    {
        $this->fieldName = $fieldName;

        // Default boolean states
        // Note: PHP converts boolean array keys to integers (false=0, true=1)
        // The getStateConfig() method uses loose comparison to handle both
        $this->states = [
            false => [
                'icon' => 'check-mark-circle',
                'title' => 'Activate',
                'buttonClass' => 'currently-inactive',
            ],
            true => [
                'icon' => 'minus-circle',
                'title' => 'Deactivate',
                'buttonClass' => 'currently-active',
            ],
        ];
    }

    /**
     * Create a new instance
     */
    public static function create(string $fieldName): static
    {
        return new static($fieldName);
    }

    /**
     * Set the states configuration.
     *
     * Each state maps a value to display config:
     * ```php
     * [
     *     false => ['icon' => 'check-mark', 'title' => 'Activate', 'buttonClass' => 'inactive'],
     *     true => ['icon' => 'minus', 'title' => 'Deactivate', 'buttonClass' => 'active'],
     * ]
     * ```
     *
     * For multi-state fields, values cycle in array order:
     * ```php
     * [
     *     'draft' => [...],      // clicking cycles to 'review'
     *     'review' => [...],     // clicking cycles to 'published'
     *     'published' => [...],  // clicking cycles back to 'draft'
     * ]
     * ```
     *
     * @param array $states Map of value => ['icon' => string, 'title' => string, 'buttonClass' => string]
     */
    public function setStates(array $states): static
    {
        $this->states = $states;
        return $this;
    }

    /**
     * Get the states configuration
     */
    public function getStates(): array
    {
        return $this->states;
    }

    /**
     * Set a custom state renderer callback.
     *
     * The callback receives the record and current value, and should return
     * an array with 'icon', 'title', and optionally 'buttonClass'.
     *
     * ```php
     * ->setStateRenderer(function(DataObject $record, $currentValue) {
     *     return [
     *         'icon' => $record->getStatusIcon(),
     *         'title' => $record->getNextStatusLabel(),
     *         'buttonClass' => $record->getStatusClass(),
     *     ];
     * })
     * ```
     *
     * @param callable $callback fn(DataObject $record, mixed $value): array
     */
    public function setStateRenderer(callable $callback): static
    {
        $this->stateRenderer = $callback;
        return $this;
    }

    /**
     * Set a callback to determine if the button should show.
     *
     * ```php
     * ->setShouldShow(fn($record) => $record->canEdit())
     * ```
     *
     * @param callable $callback fn(DataObject $record): bool
     */
    public function setShouldShow(callable $callback): static
    {
        $this->shouldShowCallback = $callback;
        return $this;
    }

    /**
     * Set a custom toggle action callback.
     *
     * Use this for complex toggle logic beyond simple field assignment.
     * The callback is responsible for setting values but NOT for saving.
     *
     * ```php
     * ->setToggleAction(function(DataObject $record, $newValue) {
     *     $record->Status = $newValue;
     *     $record->StatusChangedDate = DBDatetime::now();
     *     $record->StatusChangedBy = Security::getCurrentUser()->ID;
     * })
     * ```
     *
     * @param callable $callback fn(DataObject $record, mixed $newValue): void
     */
    public function setToggleAction(callable $callback): static
    {
        $this->toggleActionCallback = $callback;
        return $this;
    }

    /**
     * Set confirmation message (optional)
     */
    public function setConfirmMessage(?string $message): static
    {
        $this->confirmMessage = $message;
        return $this;
    }

    /**
     * Get confirmation message
     */
    public function getConfirmMessage(): ?string
    {
        return $this->confirmMessage;
    }

    /**
     * Set whether to use writeWithoutVersion() for versioned records
     */
    public function setWriteWithoutVersion(bool $value): static
    {
        $this->writeWithoutVersion = $value;
        return $this;
    }

    /**
     * Set the column name for the button
     */
    public function setColumnName(string $name): static
    {
        $this->columnName = $name;
        return $this;
    }

    /**
     * Get the field name being toggled
     */
    public function getFieldName(): string
    {
        return $this->fieldName;
    }

    // =========================================================================
    // State helpers
    // =========================================================================

    /**
     * Get the next value in the toggle cycle
     */
    protected function getNextValue($currentValue)
    {
        $keys = array_keys($this->states);
        $currentIndex = array_search($currentValue, $keys, true);

        // If not found, try loose comparison for boolean edge cases
        if ($currentIndex === false) {
            foreach ($keys as $i => $key) {
                if ($key == $currentValue) {
                    $currentIndex = $i;
                    break;
                }
            }
        }

        // If still not found, return first value
        if ($currentIndex === false) {
            return $keys[0] ?? $currentValue;
        }

        // Return next value, cycling back to start
        $nextIndex = ($currentIndex + 1) % count($keys);
        return $keys[$nextIndex];
    }

    /**
     * Get the state config for a value
     */
    protected function getStateConfig(DataObject $record, $value): array
    {
        // Use custom renderer if set
        if ($this->stateRenderer) {
            return call_user_func($this->stateRenderer, $record, $value);
        }

        // Look up in states array
        if (isset($this->states[$value])) {
            return $this->states[$value];
        }

        // Try loose comparison for booleans
        foreach ($this->states as $stateValue => $config) {
            if ($stateValue == $value) {
                return $config;
            }
        }

        // Fallback
        return [
            'icon' => 'menu-toggled',
            'title' => 'Toggle',
            'buttonClass' => '',
        ];
    }

    /**
     * Check if button should be shown for this record
     */
    protected function shouldShow(DataObject $record): bool
    {
        // Check if field exists
        if (!$record->hasField($this->fieldName)) {
            return false;
        }

        // Use custom callback if set
        if ($this->shouldShowCallback) {
            return (bool) call_user_func($this->shouldShowCallback, $record);
        }

        return true;
    }

    // =========================================================================
    // GridField_ColumnProvider
    // =========================================================================

    public function augmentColumns($gridField, &$columns)
    {
        if (!in_array($this->columnName, $columns)) {
            $columns[] = $this->columnName;
        }
    }

    public function getColumnsHandled($gridField)
    {
        return [$this->columnName];
    }

    public function getColumnAttributes($gridField, $record, $columnName)
    {
        return ['class' => 'grid-field__col-compact'];
    }

    public function getColumnMetadata($gridField, $columnName)
    {
        return ['title' => ''];
    }

    public function getColumnContent($gridField, $record, $columnName)
    {
        if (!$this->shouldShow($record)) {
            return '';
        }

        $field = $this->getToggleAction($gridField, $record);
        return $field ? $field->Field() : '';
    }

    // =========================================================================
    // GridField_ActionProvider
    // =========================================================================

    public function getActions($gridField)
    {
        return ['togglefield_' . strtolower($this->fieldName)];
    }

    public function handleAction(GridField $gridField, $actionName, $arguments, $data)
    {
        $expectedAction = 'togglefield_' . strtolower($this->fieldName);

        if ($actionName !== $expectedAction) {
            return;
        }

        $recordID = $arguments['RecordID'] ?? null;
        if (!$recordID) {
            return;
        }

        /** @var DataObject $record */
        $record = $gridField->getList()->byID($recordID);
        if (!$record) {
            return;
        }

        $currentValue = $record->{$this->fieldName};
        $newValue = $this->getNextValue($currentValue);

        // Use custom action callback or default field assignment
        if ($this->toggleActionCallback) {
            call_user_func($this->toggleActionCallback, $record, $newValue);
        } else {
            $record->{$this->fieldName} = $newValue;
        }

        // Save the record
        if ($this->writeWithoutVersion && ClassInfo::hasMethod($record, 'writeWithoutVersion')) {
            $record->writeWithoutVersion();
        } else {
            $record->write();
        }
    }

    // =========================================================================
    // GridField_ActionMenuItem
    // =========================================================================

    public function getTitle($gridField, $record, $columnName)
    {
        $value = $record->{$this->fieldName} ?? null;
        $config = $this->getStateConfig($record, $value);
        return $config['title'] ?? 'Toggle';
    }

    public function getGroup($gridField, $record, $columnName)
    {
        if (!$this->shouldShow($record)) {
            return null;
        }
        return GridField_ActionMenuItem::DEFAULT_GROUP;
    }

    public function getExtraData($gridField, $record, $columnName)
    {
        $field = $this->getToggleAction($gridField, $record);
        return $field ? $field->getAttributes() : null;
    }

    // =========================================================================
    // Button rendering
    // =========================================================================

    /**
     * Create the form action button for a record
     */
    protected function getToggleAction(GridField $gridField, DataObject $record): ?GridField_FormAction
    {
        if (!$this->shouldShow($record)) {
            return null;
        }

        $value = $record->{$this->fieldName} ?? null;
        $config = $this->getStateConfig($record, $value);

        $icon = $config['icon'] ?? 'menu-toggled';
        $title = $config['title'] ?? 'Toggle';
        $buttonClass = $config['buttonClass'] ?? '';

        $actionName = 'togglefield_' . strtolower($this->fieldName);

        $field = GridField_FormAction::create(
            $gridField,
            $actionName . '_' . $record->ID,
            false,
            $actionName,
            ['RecordID' => $record->ID]
        )
            ->addExtraClass("action--toggle btn--icon-md font-icon-{$icon} btn--no-text grid-field__icon-action action-menu--handled {$buttonClass}")
            ->setAttribute('classNames', "action--toggle font-icon-{$icon} {$buttonClass}")
            ->setDescription($title)
            ->setAttribute('aria-label', $title)
            ->setAttribute('title', $title);

        if ($this->confirmMessage) {
            $field->setAttribute('data-confirm', $this->confirmMessage);
        }

        return $field;
    }
}
