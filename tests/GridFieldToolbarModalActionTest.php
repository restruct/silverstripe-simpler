<?php

namespace Restruct\Silverstripe\Simpler\Tests;

use PHPUnit\Framework\TestCase;
use Restruct\Silverstripe\Simpler\GridFieldToolbarModalAction;

/**
 * Unit tests for GridFieldToolbarModalAction
 *
 * These are pure unit tests that don't require database or SilverStripe bootstrap.
 */
class GridFieldToolbarModalActionTest extends TestCase
{
    // =========================================================================
    // Basic instantiation tests
    // =========================================================================

    public function testCreateWithActionAndLabel(): void
    {
        $action = new GridFieldToolbarModalAction('myaction', 'My Button');

        $this->assertEquals('My Button', $action->getDialogTitle());
        $this->assertEquals('Submit', $action->getSubmitLabel());
    }

    // =========================================================================
    // Fluent setter tests
    // =========================================================================

    public function testSetDialogTitle(): void
    {
        $action = (new GridFieldToolbarModalAction('myaction', 'Button'))
            ->setDialogTitle('Custom Title');

        $this->assertEquals('Custom Title', $action->getDialogTitle());
    }

    public function testSetModalTitle(): void
    {
        $action = (new GridFieldToolbarModalAction('myaction', 'Button'))
            ->setModalTitle('Modal Title');

        $this->assertEquals('Modal Title', $action->getModalTitle());
        $this->assertEquals('Modal Title', $action->getDialogTitle());
    }

    public function testSetSubmitLabel(): void
    {
        $action = (new GridFieldToolbarModalAction('myaction', 'Button'))
            ->setSubmitLabel('Do It');

        $this->assertEquals('Do It', $action->getSubmitLabel());
    }

    public function testSetButtonClasses(): void
    {
        $action = (new GridFieldToolbarModalAction('myaction', 'Button'))
            ->setButtonClasses('btn btn-danger');

        $this->assertEquals('btn btn-danger', $action->getButtonClasses());
    }

    public function testSetButtonIcon(): void
    {
        $action = (new GridFieldToolbarModalAction('myaction', 'Button'))
            ->setButtonIcon('rocket');

        $this->assertEquals('rocket', $action->getButtonIcon());
    }

    public function testSetModalSize(): void
    {
        $action = (new GridFieldToolbarModalAction('myaction', 'Button'))
            ->setModalSize('lg');

        $this->assertEquals('lg', $action->getModalSize());
    }

    public function testSetTargetFragment(): void
    {
        $action = (new GridFieldToolbarModalAction('myaction', 'Button'))
            ->setTargetFragment('buttons-after-right');

        $this->assertEquals('buttons-after-right', $action->getTargetFragment());
    }

    public function testSetActionArguments(): void
    {
        $action = (new GridFieldToolbarModalAction('myaction', 'Button'))
            ->setActionArguments(['foo' => 'bar']);

        $this->assertEquals(['foo' => 'bar'], $action->getActionArguments());
    }

    // =========================================================================
    // FieldList tests
    // =========================================================================

    public function testGetFieldListNull(): void
    {
        $action = new GridFieldToolbarModalAction('myaction', 'Button');

        $this->assertNull($action->getFieldList());
    }

    // =========================================================================
    // Action provider tests
    // =========================================================================

    public function testGetActions(): void
    {
        $action = new GridFieldToolbarModalAction('myaction', 'Button');

        $this->assertEquals(['myaction'], $action->getActions(null));
    }

    public function testGetActionsWithDifferentName(): void
    {
        $action = new GridFieldToolbarModalAction('customaction', 'Button');

        $this->assertEquals(['customaction'], $action->getActions(null));
    }

    // =========================================================================
    // Fluent interface tests
    // =========================================================================

    public function testFluentInterface(): void
    {
        $action = (new GridFieldToolbarModalAction('myaction', 'Button'))
            ->setDialogTitle('Title')
            ->setSubmitLabel('Submit')
            ->setButtonClasses('btn')
            ->setButtonIcon('check')
            ->setModalSize('lg')
            ->setTargetFragment('buttons-before-left')
            ->setActionArguments(['key' => 'value']);

        // All setters should return self for fluent interface
        $this->assertInstanceOf(GridFieldToolbarModalAction::class, $action);
        $this->assertEquals('Title', $action->getDialogTitle());
        $this->assertEquals('Submit', $action->getSubmitLabel());
        $this->assertEquals('btn', $action->getButtonClasses());
        $this->assertEquals('check', $action->getButtonIcon());
        $this->assertEquals('lg', $action->getModalSize());
        $this->assertEquals('buttons-before-left', $action->getTargetFragment());
        $this->assertEquals(['key' => 'value'], $action->getActionArguments());
    }
}
