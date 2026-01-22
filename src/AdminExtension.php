<?php

namespace Restruct\Silverstripe\Simpler;

use SilverStripe\Admin\LeftAndMain;
use SilverStripe\Core\Config\Configurable;
use SilverStripe\Core\Extension;
use SilverStripe\Control\Director;
use SilverStripe\View\Requirements;

/**
 * Extension for LeftAndMain to inject Vue 3 import map and optionally the modal JS
 * This allows developers to use Vue 3 in their own ES modules via: import { createApp } from 'vue'
 *
 * Configuration options:
 * - simpler_include_modal: Also load simpler-modal.js (default: false)
 * - simpler_skip_import_map_check: Skip the import map availability check (default: false)
 *
 * @extends Extension<LeftAndMain>
 */
class AdminExtension extends Extension
{
    use Configurable;

    /**
     * Flag set to true when import map was initialized during LeftAndMain::init()
     */
    private static bool $importMapInitialized = false;

    /**
     * Skip the import map check (for devs who know what they're doing)
     */
    private static bool $skip_import_map_check = false;

    public function onAfterInit(): void
    {
        self::$importMapInitialized = true;
        self::requireImportMap();

        // Optionally include modal JS via config
        if ($this->owner->config()->get('simpler_include_modal')) {
            self::requireModal();
        }
    }

    /**
     * Inject Vue 3 import map into the page head.
     * Can be called statically from anywhere (e.g., SimplerModalField).
     */
    public static function requireImportMap(): void
    {
        // Choose dev or prod Vue build based on environment
        $vueBuild = Director::isDev()
            ? 'vue.esm-browser.js'       // Dev: warnings, devtools (~530kb)
            : 'vue.esm-browser.prod.js'; // Prod: minified (~162kb)

        HeadRequirements::import_map('vue', "restruct/silverstripe-simpler:client/dist/js/{$vueBuild}");
    }

    /**
     * Assert that the import map is available (was set during initial page load).
     * Call this from FormFields that require Vue to warn developers if AdminExtension
     * is not properly configured.
     *
     * @throws \RuntimeException if import map was not initialized and check is not skipped
     */
    public static function assertImportMapAvailable(): void
    {
        if (self::$importMapInitialized || static::config()->get('skip_import_map_check')) {
            return;
        }

        $message = '[Simpler] Vue import map not available. '
            . 'Add AdminExtension to LeftAndMain in your config: '
            . 'SilverStripe\Admin\LeftAndMain: extensions: [Restruct\Silverstripe\Simpler\AdminExtension]. '
            . 'Set skip_import_map_check: true to disable this check.';

        user_error($message, E_USER_WARNING);
    }

    /**
     * Include the modal JS file.
     * Can be called statically from anywhere.
     */
    public static function requireModal(): void
    {
        Requirements::javascript('restruct/silverstripe-simpler:client/dist/js/simpler-modal.js', ['type' => 'module']);
    }
}
