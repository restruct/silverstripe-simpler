<?php

namespace Restruct\SpBrowser;

/**
 * BROWSER-TEST FIXTURE ONLY - the "toggle" tab: GridFieldToggleIsActiveButton (with its default
 * confirm message) and a three-state GridFieldToggleFieldButton on Status. See SpBRecord.
 */
class SpBToggleRecord extends SpBRecord
{
    private static $table_name = 'SpBToggleRecord';

    protected const SEEDS = [
        'Toggle active' => ['IsActive' => true, 'Status' => 'draft'],
        'Toggle confirm' => ['IsActive' => false, 'Status' => 'draft'],
        'Toggle status' => ['IsActive' => true, 'Status' => 'draft'],
    ];
}
