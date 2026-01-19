<?php

namespace Restruct\Silverstripe\Simpler;

use SilverStripe\Admin\LeftAndMain;
use SilverStripe\Core\Extension;
use SilverStripe\Control\Director;
use SilverStripe\View\Requirements;

/**
 * Extension for LeftAndMain to inject Vue 3 import map and optionally the modal JS
 * This allows developers to use Vue 3 in their own ES modules via: import { createApp } from 'vue'
 *
 * Configuration options:
 * - include_modal: Also load simpler-modal.js (default: false)
 *
 * @extends Extension<LeftAndMain>
 */
class AdminExtension extends Extension
{
    public function init(): void
    {
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
     * Include the modal JS file.
     * Can be called statically from anywhere.
     */
    public static function requireModal(): void
    {
        Requirements::javascript('restruct/silverstripe-simpler:client/dist/js/simpler-modal.js', ['type' => 'module']);
    }
}
