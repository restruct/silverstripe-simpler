<?php

namespace Restruct\SpBrowser;

/**
 * BROWSER-TEST FIXTURE ONLY - the "toolbar" tab: a GridFieldToolbarModalAction subclass
 * (SpBRenameAction) in form mode. See SpBRecord.
 */
class SpBToolbarRecord extends SpBRecord
{
    private static $table_name = 'SpBToolbarRecord';

    protected const SEEDS = [
        'Toolbar one' => [],
        'Toolbar two' => [],
    ];
}
