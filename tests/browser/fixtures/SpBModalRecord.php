<?php

namespace Restruct\SpBrowser;

/**
 * BROWSER-TEST FIXTURE ONLY - the "modal" tab: a GridFieldModalButton per row (SpBDetailsButton),
 * and the record whose edit form shows EditProtectedTextField. See SpBRecord.
 */
class SpBModalRecord extends SpBRecord
{
    private static $table_name = 'SpBModalRecord';

    protected const SEEDS = [
        'Modal alpha' => ['Code' => 'ALPHA-1', 'Description' => 'Alpha <b>description</b> & more'],
        'Modal edit' => ['Code' => 'EDIT-1', 'Description' => 'For the edit form'],
        'Modal empty' => ['Code' => '', 'Description' => ''],
        'Modal save' => ['Code' => 'SAVE-1', 'Description' => 'For the save spec'],
    ];
}
