<?php

namespace Restruct\SimplerShowcase;

use Restruct\Silverstripe\Simpler\AdminExtension;
use Restruct\Silverstripe\Simpler\GridFieldModalButton;
use Restruct\Silverstripe\Simpler\GridFieldToggleFieldButton;
use Restruct\Silverstripe\Simpler\GridFieldToggleIsActiveButton;
use Restruct\Silverstripe\Simpler\GridFieldToolbarModalAction;
use SilverStripe\Admin\ModelAdmin;
use SilverStripe\Forms\DropdownField;
use SilverStripe\Forms\FieldList;
use SilverStripe\Forms\GridField\GridField;
use SilverStripe\Forms\NumericField;
use SilverStripe\ORM\DataObject;

/**
 * README SCREENSHOT FIXTURE ONLY - a "Catalogue" admin with the module's GridField components, as
 * the README shows them. See ShowcaseProduct for why this never loads in a real install.
 */
class ShowcaseAdmin extends ModelAdmin
{
    private static $url_segment = 'catalogue';

    private static $menu_title = 'Catalogue';

    private static $menu_icon_class = 'font-icon-p-shop';

    # The README's opt-in, applied to this admin only (a fixture cannot ship YAML config): the Vue
    # import map that the modal and EditProtectedTextField need.
    private static $extensions = [
        AdminExtension::class,
    ];

    private static $managed_models = [
        'products' => ['dataClass' => ShowcaseProduct::class, 'title' => 'Products'],
    ];

    protected function getGridFieldConfig(): \SilverStripe\Forms\GridField\GridFieldConfig
    {
        $config = parent::getGridFieldConfig();

        # Row buttons: the IsActive toggle, a three-state Status cycle and a view-only details modal.
        $config->addComponent(GridFieldToggleIsActiveButton::create());
        $config->addComponent(
            GridFieldToggleFieldButton::create('Status')
                ->setColumnName('StatusToggle')
                ->setStates([
                    'draft' => ['icon' => 'edit', 'title' => 'Submit for review'],
                    'review' => ['icon' => 'eye', 'title' => 'Publish'],
                    'published' => ['icon' => 'check-mark', 'title' => 'Back to draft'],
                ])
        );
        $config->addComponent(new ShowcaseDetailsButton());

        # Toolbar: a form in a modal that submits through the GridField.
        $config->addComponent(new ShowcasePriceAction());

        return $config;
    }
}

/**
 * GridFieldModalButton as the README shows it: a view-only modal per row.
 */
class ShowcaseDetailsButton extends GridFieldModalButton
{
    public function __construct()
    {
        $this->setCloseButtonText('Close');
    }

    protected function getButtonLabel(DataObject $record): string
    {
        return 'Details';
    }

    protected function getModalTitle(DataObject $record): string
    {
        return $record->Title;
    }

    protected function getModalContent(DataObject $record): string
    {
        /** @var ShowcaseProduct $record */
        return $record->previewHtml();
    }
}

/**
 * GridFieldToolbarModalAction in form mode: change every listed price by a percentage.
 */
class ShowcasePriceAction extends GridFieldToolbarModalAction
{
    public function __construct()
    {
        parent::__construct('adjustprices', 'Adjust prices');
        $this->setDialogTitle('Adjust prices of all listed products');
        $this->setSubmitLabel('Apply');
        $this->setButtonIcon('sync');
        $this->setFieldList(FieldList::create([
            DropdownField::create('Direction', 'Change', ['up' => 'Increase', 'down' => 'Decrease']),
            NumericField::create('Percentage', 'By percentage', 5),
        ]));
    }

    public function handleAction(GridField $gridField, $actionName, $arguments, $data)
    {
        if ($actionName !== 'adjustprices') {
            return;
        }
        $factor = (float) ($data['Percentage'] ?? 0) / 100;
        if (($data['Direction'] ?? 'up') === 'down') {
            $factor = -$factor;
        }
        foreach ($gridField->getList() as $record) {
            $record->Price = round($record->Price * (1 + $factor), 2);
            $record->write();
        }
    }
}
