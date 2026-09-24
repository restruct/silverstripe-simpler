<?php

namespace Restruct\Silverstripe\Simpler\Tests\Stub;

use SilverStripe\Dev\TestOnly;
use SilverStripe\ORM\DataObject;

/**
 * Minimal record for the GridFieldToggleFieldButton tests.
 *
 * Deliberately NOT abstract (an abstract DataObject in a module's tests/ breaks every consuming
 * project's temp-database build) and with a short table name.
 *
 * @property bool $IsActive
 * @property string $Status
 */
class ToggleRecord extends DataObject implements TestOnly
{
    private static $table_name = 'SimplerToggleRecord';

    private static $db = [
        'Title' => 'Varchar',
        'IsActive' => 'Boolean',
        'Status' => 'Varchar(20)',
    ];
}
