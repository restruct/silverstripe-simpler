<?php

namespace Restruct\SpBrowser;

use Restruct\Silverstripe\Simpler\AdminExtension;
use Restruct\Silverstripe\Simpler\GridFieldToggleFieldButton;
use Restruct\Silverstripe\Simpler\GridFieldToggleIsActiveButton;
use SilverStripe\Admin\ModelAdmin;

/**
 * BROWSER-TEST FIXTURE ONLY - the CMS screen the specs open: /admin/simpler-browser/<tab>
 * (see SpBRecord for why this never loads in a real install). One tab per simpler GridField setup.
 */
class SpBAdmin extends ModelAdmin
{
    private static $url_segment = 'simpler-browser';

    private static $menu_title = 'Simpler browser test';

    # The README's opt-in, applied to this admin only instead of to every LeftAndMain (a fixture
    # cannot ship YAML config): the Vue import map on every page of this admin. simpler_include_modal
    # stays OFF, so the modal JS on the "modal" tab is loaded by GridFieldModalButton itself.
    private static $extensions = [
        AdminExtension::class,
    ];

    # Keyed managed_models (SS5 and SS6): the key becomes the URL segment.
    private static $managed_models = [
        'toggle' => ['dataClass' => SpBToggleRecord::class, 'title' => 'Toggle buttons'],
        'modal' => ['dataClass' => SpBModalRecord::class, 'title' => 'Modal buttons'],
        'toolbar' => ['dataClass' => SpBToolbarRecord::class, 'title' => 'Toolbar modal'],
        'puremodal' => ['dataClass' => SpBPureModalRecord::class, 'title' => 'PureModal classes'],
    ];

    protected function getGridFieldConfig(): \SilverStripe\Forms\GridField\GridFieldConfig
    {
        $config = parent::getGridFieldConfig();

        switch ($this->modelClass) {
            case SpBToggleRecord::class:
                # README "GridFieldToggleFieldButton": the pre-configured IsActive toggle (confirms
                # with "Are you sure?") and a multi-state Status cycle without a confirm.
                $config->addComponent(GridFieldToggleIsActiveButton::create());
                $config->addComponent(
                    GridFieldToggleFieldButton::create('Status')
                        ->setColumnName('StatusToggle')
                        ->setStates([
                            'draft' => ['icon' => 'edit', 'title' => 'Submit for Review', 'buttonClass' => 'spb-draft'],
                            'review' => ['icon' => 'eye', 'title' => 'Publish', 'buttonClass' => 'spb-review'],
                            'published' => ['icon' => 'check-mark', 'title' => 'Reset to Draft', 'buttonClass' => 'spb-published'],
                        ])
                );
                break;
            case SpBModalRecord::class:
                $config->addComponent(new SpBDetailsButton());
                break;
            case SpBToolbarRecord::class:
                $config->addComponent(new SpBRenameAction());
                break;
        }

        return $config;
    }
}
