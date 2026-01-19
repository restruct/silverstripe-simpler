<?php

namespace Restruct\Silverstripe\Simpler;

use SilverStripe\Core\Manifest\ModuleResourceLoader;
use SilverStripe\View\HTML;
use SilverStripe\View\Requirements;
use SilverStripe\View\TemplateGlobalProvider;

/**
 * HeadRequirements - Manage JS requirements that must be placed in <head>
 *
 * Unlike SilverStripe's default Requirements which places JS at the bottom of <body>,
 * this class ensures scripts are inserted in <head> - necessary for:
 * - Import maps (must be before any ES module scripts)
 * - Scripts that need to run before DOM parsing
 * - Configuration scripts (like Sentry DSN)
 *
 * Requirements are injected immediately when added - no separate inject() call needed.
 * Calling the same method with the same uniquenessID will overwrite the previous value.
 *
 * Usage from PHP:
 *   HeadRequirements::import_map('vue', 'mymodule:client/dist/js/vue.esm-browser.js');
 *   HeadRequirements::javascript('mymodule:client/dist/js/early-script.js');
 *   HeadRequirements::javascript('https://cdn.example.com/lib.js', ['defer' => true]);
 *   HeadRequirements::custom_script('console.log("runs in head");', 'my-debug');
 *
 * Usage from templates (via TemplateGlobalProvider):
 *   $HeadReq_importMap('vue', 'mymodule:client/dist/js/vue.esm-browser.js')
 *   $HeadReq_javascript('mymodule:client/dist/js/early-script.js')
 *   $HeadReq_js('mymodule:client/dist/js/early-script.js')  <%-- alias --%>
 *   $HeadReq_customScript('console.log("runs in head");', 'my-debug')
 */
class HeadRequirements implements TemplateGlobalProvider
{
    /**
     * Import map entries: name => resolved URL
     * Stored separately because we need to rebuild the full import map JSON on each addition
     */
    private static array $imports = [];

    /**
     * Expose to templates as $HeadReq_* global functions
     */
    public static function get_template_global_variables(): array
    {
        return [
            'HeadReq_importMap' => 'import_map',
            'HeadReq_customScript' => 'custom_script',
            'HeadReq_javascript' => 'javascript',
            'HeadReq_js' => 'javascript',
        ];
    }

    /**
     * Add an import map entry
     *
     * Import maps are special: browsers only allow ONE import map per page.
     * Each call rebuilds and re-injects the complete import map with all entries.
     *
     * @param string $name The import specifier (e.g., 'vue', 'lodash')
     * @param string $resource resource path/url (e.g., 'mymodule:client/dist/js/vue.js')
     * @return void
     */
    public static function import_map(string $name, string $resource): void
    {
        self::$imports[$name] = ModuleResourceLoader::singleton()->resolveURL($resource);
        self::inject_import_map();
    }

    /**
     * Rebuild and inject the complete import map
     */
    private static function inject_import_map(): void
    {
        if (empty(self::$imports)) {
            return;
        }
        $json = json_encode(['imports' => self::$imports], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        $tag = HTML::createTag('script', ['type' => 'importmap'], $json);
        Requirements::insertHeadTags($tag, 'HeadRequirements-importmap');
    }

    /**
     * Add a JavaScript file to be loaded in <head>
     *
     * Accepts module resource paths (e.g., 'mymodule:client/dist/js/app.js')
     * or direct URLs (e.g., 'https://cdn.example.com/lib.js').
     *
     * @param string $resource (module) resource path or URL
     * @param array $options Additional attributes: type, async, defer, integrity, crossorigin, etc.
     */
    public static function javascript(string $resource, array $options = []): void
    {
        $url = ModuleResourceLoader::singleton()->resolveURL($resource);

        $key = $options['uniquenessID'] ?? md5($resource);
        unset($options['uniquenessID']);

        $attributes = self::normalize_attributes(['src' => $url] + $options);
        $tag = HTML::createTag('script', $attributes, '');
        Requirements::insertHeadTags($tag, 'HeadRequirements-js-' . $key);
    }

    /**
     * Add an inline script to be executed in <head>
     *
     * @param string $script JavaScript code (without <script> tags)
     * @param string|null $uniquenessID Optional unique ID (defaults to md5 of script)
     * @param array $options Additional attributes (e.g., ['type' => 'module'])
     */
    public static function custom_script(string $script, ?string $uniquenessID = null, array $options = []): void
    {
        $key = $uniquenessID ?: md5($script);
        $attributes = self::normalize_attributes($options);
        $tag = HTML::createTag('script', $attributes, $script);
        Requirements::insertHeadTags($tag, 'HeadRequirements-inline-' . $key);
    }

    /**
     * Normalize attributes for HTML::createTag
     * Converts boolean true to attribute name (e.g., defer => true becomes defer => 'defer')
     * Removes false/null values
     */
    private static function normalize_attributes(array $options): array
    {
        $result = [];
        foreach ($options as $name => $value) {
            if ($value === true) {
                $result[$name] = $name; // defer="defer" is valid HTML5
            } elseif ($value !== false && $value !== null) {
                $result[$name] = (string) $value;
            }
        }
        return $result;
    }

    /**
     * Clear all registered import map entries (useful for testing)
     * Note: This doesn't remove already-injected head tags from Requirements
     */
    public static function clear_imports(): void
    {
        self::$imports = [];
    }

    /**
     * Get current import map entries (for debugging/inspection)
     */
    public static function get_imports(): array
    {
        return self::$imports;
    }
}
