<?php

namespace Restruct\SimplerShowcase;

use Restruct\Silverstripe\Simpler\EditProtectedTextField;
use Restruct\Silverstripe\Simpler\SimplerModalAction;
use Restruct\Silverstripe\Simpler\SimplerModalField;
use SilverStripe\Forms\CheckboxField;
use SilverStripe\Forms\FieldList;
use SilverStripe\Forms\TextField;
use SilverStripe\ORM\DataObject;

/**
 * README SCREENSHOT FIXTURE ONLY - neutral demo content for the README screenshots
 * (tests/browser/screenshots/readme.shot.ts). Never loaded by a real install: it lives under
 * tests/browser/, which carries a _manifest_exclude marker; shoot.sh copies it into a scratch
 * host's app/src/ before the database build.
 *
 * Shows the edit-form side of the module: EditProtectedTextField on SKU, a SimplerModalField
 * (HTML content in simpler.modal) and a SimplerModalAction (a form in the modal that submits to
 * this record). The last two need lekoala/silverstripe-pure-modal (and -cms-actions), which the
 * browser-test hosts already carry (targets.sh SS<n>_EXTRA_REQUIRE).
 *
 * @property string $Title
 * @property string $SKU
 * @property float $Price
 * @property bool $IsActive
 * @property string $Status
 * @property string $Description
 */
class ShowcaseProduct extends DataObject
{
    private static $table_name = 'SimplerShowcaseProduct';

    private static $singular_name = 'Product';

    private static $plural_name = 'Products';

    private static $db = [
        'Title' => 'Varchar(255)',
        'SKU' => 'Varchar(50)',
        'Price' => 'Currency',
        'IsActive' => 'Boolean',
        'Status' => "Enum('draft,review,published','draft')",
        'Description' => 'Text',
    ];

    private static $default_sort = '"Title" ASC';

    private static $summary_fields = [
        'Title' => 'Product',
        'SKU' => 'SKU',
        'Price.Nice' => 'Price',
        'IsActive.Nice' => 'Active',
        'Status' => 'Status',
    ];

    /**
     * Seeded on every database build: Title => other field values.
     */
    protected const SEEDS = [
        'Brass desk lamp' => ['SKU' => 'LMP-0412', 'Price' => 89.00, 'IsActive' => true, 'Status' => 'published',
            'Description' => 'Adjustable arm, warm white bulb included.'],
        'Ceramic mug set' => ['SKU' => 'MUG-1180', 'Price' => 34.50, 'IsActive' => true, 'Status' => 'published',
            'Description' => 'Set of four stoneware mugs, dishwasher safe.'],
        'Linen cushion cover' => ['SKU' => 'CSH-2207', 'Price' => 24.95, 'IsActive' => false, 'Status' => 'review',
            'Description' => 'Washed linen, 50 x 50 cm, hidden zip.'],
        'Oak side table' => ['SKU' => 'TBL-0931', 'Price' => 149.00, 'IsActive' => true, 'Status' => 'draft',
            'Description' => 'Solid oak, oiled finish, 45 cm high.'],
        'Walnut serving board' => ['SKU' => 'BRD-3305', 'Price' => 42.00, 'IsActive' => false, 'Status' => 'draft',
            'Description' => 'End-grain walnut with juice groove.'],
        'Wool throw blanket' => ['SKU' => 'THR-1664', 'Price' => 79.00, 'IsActive' => true, 'Status' => 'review',
            'Description' => 'Merino wool, 130 x 180 cm.'],
    ];

    public function getCMSFields()
    {
        $fields = parent::getCMSFields();
        # The SKU is the field editors should not change in passing: read-only until unlocked.
        $fields->replaceField('SKU', EditProtectedTextField::create('SKU', 'SKU'));
        $fields->addFieldToTab(
            'Root.Main',
            SimplerModalField::create('ShopPreview', 'Shop preview')
                ->setDialogTitle('Shop preview: ' . $this->Title)
                ->setButtonIcon('eye')
                ->setContent($this->previewHtml())
                ->setModalSize('560px'),
            'Description'
        );
        return $fields;
    }

    public function getCMSActions()
    {
        $actions = parent::getCMSActions();
        $actions->push(
            SimplerModalAction::create('duplicateAs', 'Duplicate as...')
                ->setFieldList(FieldList::create(
                    TextField::create('NewTitle', 'Title of the copy', $this->Title . ' (copy)'),
                    CheckboxField::create('KeepPrice', 'Keep the price', true)
                ))
                ->setModalTitle('Duplicate this product')
                ->setDialogButtonTitle('Create copy')
        );
        return $actions;
    }

    /**
     * SimplerModalAction's handler: gets the modal form's data only.
     */
    public function duplicateAs($data)
    {
        $copy = $this->duplicate(false);
        $copy->Title = trim((string) ($data['NewTitle'] ?? '')) ?: $this->Title . ' (copy)';
        $copy->SKU = '';
        if (empty($data['KeepPrice'])) {
            $copy->Price = 0;
        }
        $copy->write();
        return 'Created "' . $copy->Title . '"';
    }

    /**
     * Product card for the SimplerModalField. Values are escaped: this is HTML content.
     */
    public function previewHtml(): string
    {
        return sprintf(
            '<div class="p-2"><h3 class="h5 mb-1">%s</h3><p class="text-muted mb-2">%s</p>'
            . '<p class="mb-0"><strong>%s</strong> <span class="text-muted">&middot; %s</span></p></div>',
            htmlspecialchars((string) $this->Title),
            htmlspecialchars((string) $this->Description),
            htmlspecialchars((string) $this->dbObject('Price')->Nice()),
            htmlspecialchars((string) $this->SKU)
        );
    }

    public function requireDefaultRecords()
    {
        parent::requireDefaultRecords();
        # Wipe and re-seed, so every build starts from the same content.
        foreach (static::get() as $old) {
            $old->delete();
        }
        foreach (static::SEEDS as $title => $values) {
            static::create(['Title' => $title] + $values)->write();
        }
    }
}
