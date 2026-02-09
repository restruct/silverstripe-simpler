<?php

namespace Restruct\Silverstripe\Simpler;

/**
 * GridField toggle button pre-configured for IsActive boolean fields.
 *
 * A common pattern in SilverStripe projects - provides sensible defaults
 * for toggling IsActive with appropriate icons and confirmation.
 *
 * Usage:
 * ```php
 * $config->addComponent(GridFieldToggleIsActiveButton::create());
 * ```
 *
 * Equivalent to:
 * ```php
 * $config->addComponent(
 *     GridFieldToggleFieldButton::create('IsActive')
 *         ->setStates([
 *             false => ['icon' => 'check-mark-circle', 'title' => 'Activate', 'buttonClass' => 'currently-inactive'],
 *             true => ['icon' => 'minus-circle', 'title' => 'Deactivate', 'buttonClass' => 'currently-active'],
 *         ])
 *         ->setConfirmMessage('Are you sure?')
 * );
 * ```
 */
class GridFieldToggleIsActiveButton extends GridFieldToggleFieldButton
{
    public function __construct()
    {
        parent::__construct('IsActive');

        $this->setStates([
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
        ]);

        $this->setConfirmMessage('Are you sure?');
    }

    /**
     * Create a new instance
     */
    public static function create(string $fieldName = 'IsActive'): static
    {
        $instance = new static();
        if ($fieldName !== 'IsActive') {
            // Allow overriding field name while keeping IsActive defaults
            $instance->fieldName = $fieldName;
        }
        return $instance;
    }
}
