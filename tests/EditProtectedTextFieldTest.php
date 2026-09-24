<?php

namespace Restruct\Silverstripe\Simpler\Tests;

use Restruct\Silverstripe\Simpler\EditProtectedTextField;
use SilverStripe\Dev\SapphireTest;
use SilverStripe\Forms\TextField;

/**
 * EditProtectedTextField renders its own template: an input plus a Vue app seeded with the value.
 */
class EditProtectedTextFieldTest extends SapphireTest
{
    public function testIsATextField(): void
    {
        $this->assertInstanceOf(TextField::class, EditProtectedTextField::create('Code', 'Code'));
    }

    public function testRendersInputAndVueAppSeededWithJsonValue(): void
    {
        $field = EditProtectedTextField::create('Code', 'Code', 'ab"c</script>')->setMaxLength(12);
        $html = (string) $field->Field();

        $this->assertStringContainsString('id="edit-protected-' . $field->ID() . '"', $html);
        $this->assertMatchesRegularExpression('#<input type="text"\s+ref="input"\s+id="' . preg_quote($field->ID(), '#') . '"\s+name="Code"#', $html);
        $this->assertStringContainsString('maxlength="12"', $html);
        $this->assertStringContainsString("import { createApp, ref, computed, nextTick } from 'vue';", $html);

        // The value reaches the script as a JSON literal ($Value.JSON.RAW), so quotes are escaped
        // and a closing script tag in the value cannot end the <script> block
        $this->assertMatchesRegularExpression('#const originalValue = (.*);#', $html);
        preg_match('#const originalValue = (.*);#', $html, $m);
        $this->assertSame('ab"c</script>', json_decode($m[1]));
        $this->assertStringNotContainsString('ab"c</script>', $html);
    }

    public function testEmptyValueRendersAsEmptyJsonString(): void
    {
        $html = (string) EditProtectedTextField::create('Code', 'Code')->Field();

        preg_match('#const originalValue = (.*);#', $html, $m);
        $this->assertNotEmpty($m, 'originalValue not found in: ' . $html);
        $this->assertContains(json_decode($m[1]), ['', null]);
    }

    public function testDisabledFieldRendersDisabledInput(): void
    {
        $html = (string) EditProtectedTextField::create('Code', 'Code', 'x')->setDisabled(true)->Field();

        $this->assertMatchesRegularExpression('#<input[^>]*\sdisabled[\s>]#', $html);
    }
}
