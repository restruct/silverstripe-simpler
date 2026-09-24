<?php

namespace Restruct\Silverstripe\Simpler\Tests;

use DOMDocument;
use DOMElement;
use LeKoala\PureModal\PureModal;
use Restruct\Silverstripe\Simpler\AdminExtension;
use Restruct\Silverstripe\Simpler\SimplerModalField;
use SilverStripe\Core\Config\Config;
use SilverStripe\Dev\SapphireTest;
use SilverStripe\View\Requirements;
use SilverStripe\View\Requirements_Backend;

/**
 * SimplerModalField: the modal config contract and the rendered button.
 *
 * Needs lekoala/silverstripe-pure-modal (a composer "suggest"): the class is only declared
 * when its parent exists. The CI host installs it on every leg, so the test count is equal
 * across majors; without it these tests are skipped, never silently passed.
 */
class SimplerModalFieldTest extends SapphireTest
{
    private ?Requirements_Backend $previousBackend = null;

    protected function setUp(): void
    {
        parent::setUp();
        if (!class_exists(PureModal::class)) {
            $this->markTestSkipped('lekoala/silverstripe-pure-modal is not installed');
        }
        // Field() asserts the admin import map; that check has its own tests in AdminExtensionTest
        Config::modify()->set(AdminExtension::class, 'skip_import_map_check', true);
        $this->previousBackend = Requirements::backend();
        Requirements::set_backend(Requirements_Backend::create());
    }

    protected function tearDown(): void
    {
        if ($this->previousBackend) {
            Requirements::set_backend($this->previousBackend);
        }
        parent::tearDown();
    }

    public function testDefaultConfig(): void
    {
        $field = SimplerModalField::create('info', 'Info');

        $this->assertSame([
            'title' => 'Info',
            'closeBtn' => false,
            'closeTxt' => 'Close',
            'saveBtn' => false,
            'saveTxt' => 'Save',
            // No content: empty body, and no size key at all
            'bodyHtml' => '',
        ], $field->getModalConfig());
    }

    public function testContentTitleAndSize(): void
    {
        $field = SimplerModalField::create('info', 'Info', '<p>Some info</p>')
            ->setDialogTitle('Item details')
            ->setModalSize('xl')
            ->setCloseBtn(true);

        $config = $field->getModalConfig();
        $this->assertSame('Item details', $config['title']);
        $this->assertSame('xl', $config['size']);
        $this->assertTrue($config['closeBtn']);
        $this->assertSame('<p>Some info</p>', $config['bodyHtml']);
    }

    public function testSetModalTitleIsAliasOfDialogTitle(): void
    {
        $field = SimplerModalField::create('info', 'Info')->setModalTitle('Via alias');

        $this->assertSame('Via alias', $field->getDialogTitle());
        $this->assertSame('Via alias', $field->getModalConfig()['title']);
    }

    public function testIframeTakesPrecedenceOverContent(): void
    {
        $field = SimplerModalField::create('preview', 'Preview', '<p>ignored</p>')
            ->setIframeSrc('/admin/preview?a=1&b="2"')
            ->setIframeHeight('80vh');

        $body = $field->getModalConfig()['bodyHtml'];
        $this->assertStringStartsWith('<iframe ', $body);
        // src is HTML-escaped
        $this->assertStringContainsString('src="/admin/preview?a=1&amp;b=&quot;2&quot;"', $body);
        $this->assertStringContainsString('height:80vh', $body);
        $this->assertStringNotContainsString('ignored', $body);
    }

    public function testConfigJsonEscapesQuotes(): void
    {
        $field = SimplerModalField::create('info', "It's \"quoted\"");

        $json = $field->getModalConfigJson();
        $this->assertStringNotContainsString("'", $json);
        $this->assertStringContainsString('\\u0027', $json);
        $this->assertSame($field->getModalConfig(), json_decode($json, true));
    }

    public function testButtonIconClassPerPrefix(): void
    {
        $field = SimplerModalField::create('info', 'Info');
        $this->assertSame('', $field->getButtonIconClass());

        $this->assertSame('font-icon-eye', $field->setButtonIcon('eye')->getButtonIconClass());
        $this->assertSame('bi bi-eye', $field->setButtonIcon('eye', 'bs')->getButtonIconClass());
        $this->assertSame('my-icon', $field->setButtonIcon('my-icon', false)->getButtonIconClass());
    }

    public function testFieldRendersButtonCarryingTheConfig(): void
    {
        $field = SimplerModalField::create('info', 'Info <b>', '<p>Body with "quotes" & \'apostrophes\'</p>')
            ->setButtonIcon('eye', 'bs')
            ->addExtraClass('btn-outline-info');

        $button = $this->renderButton((string) $field->Field());

        $this->assertSame('button', $button->getAttribute('type'));
        $classes = explode(' ', $button->getAttribute('class'));
        $this->assertContains('btn', $classes);
        $this->assertContains('bi', $classes);
        $this->assertContains('bi-eye', $classes);
        $this->assertContains('btn-outline-info', $classes);
        // The attribute round-trips to exactly the PHP config (template: $ModalConfigJson.ATT)
        $this->assertSame($field->getModalConfig(), json_decode($button->getAttribute('data-simpler-modal'), true));
        // Button text is escaped (template: $Title.XML)
        $this->assertSame('Info <b>', trim($button->textContent));
    }

    public function testFieldRequiresModalScript(): void
    {
        SimplerModalField::create('info', 'Info')->Field();

        $modalScripts = array_filter(
            array_keys(Requirements::backend()->getJavascript()),
            fn ($file) => str_contains($file, 'client/dist/js/simpler-modal.js')
        );
        $this->assertCount(1, $modalScripts);
    }

    private function renderButton(string $html): DOMElement
    {
        $doc = new DOMDocument();
        // Silence HTML5-unknown warnings from libxml; the assertions below check the structure
        $doc->loadHTML('<?xml encoding="utf-8"?><body>' . $html . '</body>', LIBXML_NOERROR | LIBXML_NOWARNING);
        $buttons = $doc->getElementsByTagName('button');
        $this->assertSame(1, $buttons->length, 'Expected exactly one <button> in: ' . $html);
        return $buttons->item(0);
    }
}
