<?php

namespace Restruct\Silverstripe\Simpler;

use SilverStripe\Admin\LeftAndMain;
use SilverStripe\Core\Extension;
use SilverStripe\Core\Manifest\ModuleResourceLoader;
use SilverStripe\Control\Director;
use SilverStripe\View\Requirements;

/**
 * Extension for LeftAndMain to inject Vue 3 import map
 * This allows developers to use Vue 3 in their own ES modules via: import { createApp } from 'vue'
 *
 * @extends Extension<LeftAndMain>
 */
class AdminExtension extends Extension
{
    public function init(): void
    {
        // Choose dev or prod Vue build based on environment
        $vueBuild = Director::isDev()
            ? 'vue.esm-browser.js'       // Dev: warnings, devtools (~530kb)
            : 'vue.esm-browser.prod.js'; // Prod: minified (~162kb)

        $vueUrl = ModuleResourceLoader::singleton()->resolveURL(
            "restruct/silverstripe-simpler:client/dist/js/{$vueBuild}"
        );

        // Import map must be in <head> before any module scripts
        Requirements::insertHeadTags(
            '<script type="importmap">{"imports":{"vue":"' . $vueUrl . '"}}</script>',
            'simpler-importmap'
        );
    }
}
