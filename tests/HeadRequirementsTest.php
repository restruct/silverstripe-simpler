<?php

namespace Restruct\Silverstripe\Simpler\Tests;

use Restruct\Silverstripe\Simpler\HeadRequirements;
use SilverStripe\Dev\SapphireTest;
use SilverStripe\View\Requirements;
use SilverStripe\View\Requirements_Backend;

/**
 * HeadRequirements: import map, head scripts and inline head scripts.
 */
class HeadRequirementsTest extends SapphireTest
{
    private ?Requirements_Backend $previousBackend = null;

    protected function setUp(): void
    {
        parent::setUp();
        // Requirements and HeadRequirements::$imports are process-wide: SapphireTest does not reset them
        $this->previousBackend = Requirements::backend();
        Requirements::set_backend(Requirements_Backend::create());
        HeadRequirements::clear_imports();
    }

    protected function tearDown(): void
    {
        HeadRequirements::clear_imports();
        if ($this->previousBackend) {
            Requirements::set_backend($this->previousBackend);
        }
        parent::tearDown();
    }

    /**
     * @return string[] head tags keyed by uniquenessID
     */
    private function headTags(): array
    {
        return Requirements::backend()->getCustomHeadTags();
    }

    public function testImportMapAccumulatesIntoOneTag(): void
    {
        HeadRequirements::import_map('vue', 'restruct/silverstripe-simpler:client/dist/js/vue.esm-browser.js');
        HeadRequirements::import_map('lodash', 'https://cdn.example.com/lodash.js');

        $importMaps = array_filter($this->headTags(), fn ($tag) => str_contains($tag, 'importmap'));
        // Browsers honour only one import map per page, so every entry must land in the same tag
        $this->assertCount(1, $importMaps);
        $this->assertArrayHasKey('HeadRequirements-importmap', $importMaps);

        $tag = $importMaps['HeadRequirements-importmap'];
        $this->assertMatchesRegularExpression('#^<script type="importmap">.*</script>$#s', $tag);
        $json = json_decode(strip_tags($tag), true);
        $this->assertSame(['vue', 'lodash'], array_keys($json['imports']));
        // Module resource resolved to a URL; an absolute URL is passed through untouched
        $this->assertStringContainsString('client/dist/js/vue.esm-browser.js', $json['imports']['vue']);
        $this->assertStringNotContainsString('restruct/silverstripe-simpler:', $json['imports']['vue']);
        $this->assertSame('https://cdn.example.com/lodash.js', $json['imports']['lodash']);
        // Slashes are not escaped in the JSON
        $this->assertStringNotContainsString('\/', $tag);
    }

    public function testImportMapSameNameOverwrites(): void
    {
        HeadRequirements::import_map('vue', 'https://cdn.example.com/vue-a.js');
        HeadRequirements::import_map('vue', 'https://cdn.example.com/vue-b.js');

        $this->assertSame(['vue' => 'https://cdn.example.com/vue-b.js'], HeadRequirements::get_imports());
    }

    public function testClearImportsEmptiesRegistry(): void
    {
        HeadRequirements::import_map('vue', 'https://cdn.example.com/vue.js');
        HeadRequirements::clear_imports();

        $this->assertSame([], HeadRequirements::get_imports());
    }

    public function testJavascriptAttributes(): void
    {
        HeadRequirements::javascript('https://cdn.example.com/lib.js', [
            'defer' => true,
            'async' => false,
            'integrity' => null,
            'crossorigin' => 'anonymous',
            'uniquenessID' => 'my-lib',
        ]);

        $tags = $this->headTags();
        $this->assertArrayHasKey('HeadRequirements-js-my-lib', $tags);
        $tag = $tags['HeadRequirements-js-my-lib'];
        $this->assertStringContainsString('src="https://cdn.example.com/lib.js"', $tag);
        // true -> attribute name as value; false and null -> omitted
        $this->assertStringContainsString('defer="defer"', $tag);
        $this->assertStringNotContainsString('async', $tag);
        $this->assertStringNotContainsString('integrity', $tag);
        $this->assertStringContainsString('crossorigin="anonymous"', $tag);
        // uniquenessID is a key, not an HTML attribute
        $this->assertStringNotContainsString('uniquenessID', $tag);
    }

    public function testJavascriptDefaultKeyIsStablePerResource(): void
    {
        HeadRequirements::javascript('https://cdn.example.com/lib.js');
        HeadRequirements::javascript('https://cdn.example.com/lib.js');

        $jsTags = array_filter(array_keys($this->headTags()), fn ($key) => str_starts_with($key, 'HeadRequirements-js-'));
        $this->assertCount(1, $jsTags);
    }

    public function testCustomScriptWithAndWithoutId(): void
    {
        HeadRequirements::custom_script('window.CONFIG = {debug: true};', 'my-config', ['type' => 'module']);
        HeadRequirements::custom_script('window.CONFIG = {debug: false};', 'my-config');
        HeadRequirements::custom_script('console.log(1);');

        $tags = $this->headTags();
        // Same uniquenessID replaces the earlier script
        $this->assertSame('<script>window.CONFIG = {debug: false};</script>', $tags['HeadRequirements-inline-my-config']);
        // Without an ID the key is derived from the script itself
        $this->assertSame('<script>console.log(1);</script>', $tags['HeadRequirements-inline-' . md5('console.log(1);')]);
    }

    public function testTemplateGlobals(): void
    {
        $this->assertSame([
            'HeadReq_importMap' => 'import_map',
            'HeadReq_customScript' => 'custom_script',
            'HeadReq_javascript' => 'javascript',
            'HeadReq_js' => 'javascript',
        ], HeadRequirements::get_template_global_variables());
    }
}
