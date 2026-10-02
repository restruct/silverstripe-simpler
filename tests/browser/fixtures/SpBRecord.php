<?php

namespace Restruct\SpBrowser;

use Restruct\Silverstripe\Simpler\EditProtectedTextField;
use SilverStripe\ORM\DataObject;

/**
 * BROWSER-TEST FIXTURE ONLY - the record behind every tab of the fixture ModelAdmin (SpBAdmin), and
 * the base of the per-tab records (one subclass per tab, so each tab has its own GridField setup).
 *
 * Never loaded by a real install: it lives under tests/browser/, which carries a _manifest_exclude
 * marker, and the browser-test runner copies it into a scratch host's app/ before dev/build.
 * Written to load on both Silverstripe 5 and 6 (no class imports that moved between the two).
 * Deliberately NOT abstract: an abstract DataObject anywhere in a manifest fatals the test-database
 * build (SOP "Never declare an abstract DataObject"), and a copy of this pattern may end up in one.
 *
 * Every dev/build (the runner does one per run) wipes and re-seeds each subclass's rows.
 *
 * @property string $Title
 * @property bool $IsActive
 * @property string $Status
 * @property string $Code
 * @property string $Description
 */
class SpBRecord extends DataObject
{
    # Short table names throughout: no namespaced defaults, MySQL caps table names at 64 characters.
    private static $table_name = 'SpBRecord';

    private static $singular_name = 'Browser Record';

    private static $db = [
        'Title' => 'Varchar(255)',
        'IsActive' => 'Boolean',
        'Status' => "Enum('draft,review,published','draft')",
        'Code' => 'Varchar(50)',
        'Description' => 'Text',
    ];

    private static $default_sort = '"Title" ASC, "ID" ASC';

    private static $summary_fields = [
        'Title' => 'Title',
        'IsActive.Nice' => 'Active',
        'Status' => 'Status',
    ];

    /**
     * The rows each subclass seeds on dev/build: Title => other field values.
     */
    protected const SEEDS = [];

    public function getCMSFields()
    {
        $fields = parent::getCMSFields();
        # The field under test: starts read-only, an edit button unlocks it (Vue, via the import map
        # that AdminExtension on SpBAdmin provides).
        $fields->replaceField('Code', EditProtectedTextField::create('Code', 'Code'));
        return $fields;
    }

    public function requireDefaultRecords()
    {
        parent::requireDefaultRecords();

        # requireDefaultRecords() runs once per class in the hierarchy; each class seeds only its own rows.
        if (!static::SEEDS) {
            return;
        }
        foreach (static::get()->filter('ClassName', static::class) as $old) {
            $old->delete();
        }
        foreach (static::SEEDS as $title => $values) {
            static::create(['Title' => $title] + $values)->write();
        }
    }
}
