<?php

namespace Restruct\Silverstripe\Simpler\Tests;

use PHPUnit\Framework\TestCase;
use Restruct\Silverstripe\Simpler\GridFieldToggleFieldButton;
use Restruct\Silverstripe\Simpler\GridFieldToggleIsActiveButton;

/**
 * Unit tests for GridFieldToggleFieldButton
 *
 * These are pure unit tests that don't require database or SilverStripe bootstrap.
 */
class GridFieldToggleFieldButtonTest extends TestCase
{
    // =========================================================================
    // Basic instantiation tests
    // =========================================================================

    public function testCreateWithFieldName(): void
    {
        $button = GridFieldToggleFieldButton::create('IsActive');
        $this->assertEquals('IsActive', $button->getFieldName());
    }

    public function testIsActiveButtonDefaults(): void
    {
        $button = GridFieldToggleIsActiveButton::create();
        $this->assertEquals('IsActive', $button->getFieldName());
        $this->assertEquals('Are you sure?', $button->getConfirmMessage());
    }

    public function testDefaultBooleanStates(): void
    {
        $button = GridFieldToggleFieldButton::create('IsActive');
        $states = $button->getStates();

        // PHP converts boolean keys to integers: false=0, true=1
        $this->assertArrayHasKey(0, $states);
        $this->assertArrayHasKey(1, $states);
        $this->assertEquals('Activate', $states[0]['title']);
        $this->assertEquals('Deactivate', $states[1]['title']);
    }

    // =========================================================================
    // State configuration tests
    // =========================================================================

    public function testCustomStates(): void
    {
        $button = GridFieldToggleFieldButton::create('Status')
            ->setStates([
                'draft' => ['icon' => 'edit', 'title' => 'Submit'],
                'review' => ['icon' => 'eye', 'title' => 'Publish'],
                'published' => ['icon' => 'check', 'title' => 'Archive'],
            ]);

        $states = $button->getStates();
        $this->assertCount(3, $states);
        $this->assertEquals('Submit', $states['draft']['title']);
        $this->assertEquals('Publish', $states['review']['title']);
    }

    public function testSetConfirmMessage(): void
    {
        $button = GridFieldToggleFieldButton::create('IsActive')
            ->setConfirmMessage('Really toggle?');

        $this->assertEquals('Really toggle?', $button->getConfirmMessage());
    }

    public function testSetConfirmMessageNull(): void
    {
        $button = GridFieldToggleFieldButton::create('IsActive')
            ->setConfirmMessage(null);

        $this->assertNull($button->getConfirmMessage());
    }

    // =========================================================================
    // State cycling tests
    // =========================================================================

    public function testGetNextValueBoolean(): void
    {
        $button = GridFieldToggleFieldButton::create('IsActive');

        // Use reflection to test protected method
        $method = new \ReflectionMethod($button, 'getNextValue');
        $method->setAccessible(true);

        // PHP converts boolean keys to integers: false=0, true=1
        // 0 (false) -> 1 (true)
        $this->assertEquals(1, $method->invoke($button, 0));
        $this->assertEquals(1, $method->invoke($button, false));
        // 1 (true) -> 0 (false)
        $this->assertEquals(0, $method->invoke($button, 1));
        $this->assertEquals(0, $method->invoke($button, true));
    }

    public function testGetNextValueMultiState(): void
    {
        $button = GridFieldToggleFieldButton::create('Status')
            ->setStates([
                'draft' => ['icon' => 'edit', 'title' => 'Submit'],
                'review' => ['icon' => 'eye', 'title' => 'Publish'],
                'published' => ['icon' => 'check', 'title' => 'Archive'],
            ]);

        $method = new \ReflectionMethod($button, 'getNextValue');
        $method->setAccessible(true);

        // draft -> review
        $this->assertEquals('review', $method->invoke($button, 'draft'));
        // review -> published
        $this->assertEquals('published', $method->invoke($button, 'review'));
        // published -> draft (cycles back)
        $this->assertEquals('draft', $method->invoke($button, 'published'));
    }

    public function testGetNextValueUnknown(): void
    {
        $button = GridFieldToggleFieldButton::create('Status')
            ->setStates([
                'draft' => ['icon' => 'edit', 'title' => 'Submit'],
                'published' => ['icon' => 'check', 'title' => 'Archive'],
            ]);

        $method = new \ReflectionMethod($button, 'getNextValue');
        $method->setAccessible(true);

        // Unknown value returns first state
        $this->assertEquals('draft', $method->invoke($button, 'unknown'));
    }

    // =========================================================================
    // Action provider tests
    // =========================================================================

    public function testGetActions(): void
    {
        $button = GridFieldToggleFieldButton::create('IsActive');

        $actions = $button->getActions(null);
        $this->assertEquals(['togglefield_isactive'], $actions);
    }

    public function testGetActionsCustomField(): void
    {
        $button = GridFieldToggleFieldButton::create('Status');

        $actions = $button->getActions(null);
        $this->assertEquals(['togglefield_status'], $actions);
    }

    // =========================================================================
    // Fluent interface tests
    // =========================================================================

    public function testFluentInterface(): void
    {
        $called = false;
        $callback = function () use (&$called) {
            $called = true;
        };

        $button = GridFieldToggleFieldButton::create('IsActive')
            ->setStates([true => ['icon' => 'x', 'title' => 'X']])
            ->setConfirmMessage('Sure?')
            ->setWriteWithoutVersion(false)
            ->setColumnName('CustomColumn')
            ->setStateRenderer($callback)
            ->setShouldShow($callback)
            ->setToggleAction($callback);

        // All setters should return self for fluent interface
        $this->assertInstanceOf(GridFieldToggleFieldButton::class, $button);
        $this->assertEquals('Sure?', $button->getConfirmMessage());
    }

    // =========================================================================
    // Callback setter tests
    // =========================================================================

    public function testSetStateRenderer(): void
    {
        $renderer = function ($record, $value) {
            return ['icon' => 'custom', 'title' => 'Custom'];
        };

        $button = GridFieldToggleFieldButton::create('IsActive')
            ->setStateRenderer($renderer);

        // Just verify it doesn't throw - actual rendering tested in integration tests
        $this->assertInstanceOf(GridFieldToggleFieldButton::class, $button);
    }

    public function testSetShouldShow(): void
    {
        $callback = fn($record) => $record->canEdit();

        $button = GridFieldToggleFieldButton::create('IsActive')
            ->setShouldShow($callback);

        $this->assertInstanceOf(GridFieldToggleFieldButton::class, $button);
    }

    public function testSetToggleAction(): void
    {
        $callback = function ($record, $newValue) {
            $record->IsActive = $newValue;
        };

        $button = GridFieldToggleFieldButton::create('IsActive')
            ->setToggleAction($callback);

        $this->assertInstanceOf(GridFieldToggleFieldButton::class, $button);
    }
}
