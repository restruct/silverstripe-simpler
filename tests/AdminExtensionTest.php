<?php

namespace Restruct\Silverstripe\Simpler\Tests;

use ReflectionProperty;
use Restruct\Silverstripe\Simpler\AdminExtension;
use Restruct\Silverstripe\Simpler\HeadRequirements;
use SilverStripe\Admin\LeftAndMain;
use SilverStripe\Core\Config\Config;
use SilverStripe\Core\Injector\Injector;
use SilverStripe\Core\Kernel;
use SilverStripe\Dev\FunctionalTest;
use SilverStripe\View\Requirements;
use SilverStripe\View\Requirements_Backend;

/**
 * AdminExtension: the Vue import map, the opt-in modal, and the import map check.
 *
 * The request tests go through a real CMS page, so they also prove that the extension hook
 * (onAfterInit) still fires on the framework major under test - a renamed hook fails silently.
 */
class AdminExtensionTest extends FunctionalTest
{
    protected $usesDatabase = true;

    protected static $required_extensions = [
        LeftAndMain::class => [AdminExtension::class],
    ];

    private ?Requirements_Backend $previousBackend = null;

    protected function setUp(): void
    {
        parent::setUp();
        // Requirements and these two statics are process-wide: SapphireTest does not reset them
        $this->previousBackend = Requirements::backend();
        Requirements::set_backend(Requirements_Backend::create());
        self::resetStatics();
    }

    protected function tearDown(): void
    {
        self::resetStatics();
        if ($this->previousBackend) {
            Requirements::set_backend($this->previousBackend);
        }
        parent::tearDown();
    }

    /**
     * AdminExtension::$importMapInitialized and HeadRequirements::$imports survive between tests
     */
    private static function resetStatics(): void
    {
        $flag = new ReflectionProperty(AdminExtension::class, 'importMapInitialized');
        $flag->setAccessible(true);
        $flag->setValue(null, false);
        HeadRequirements::clear_imports();
    }

    public function testModuleConfigLoadsCoreBundleInAdmin(): void
    {
        $this->logInWithPermission('ADMIN');
        $response = $this->get('admin/security');

        $this->assertEquals(200, $response->getStatusCode());
        $body = $response->getBody();
        // _config/config.yml: extra_requirements_javascript / extra_requirements_css on LeftAndMain
        $this->assertStringContainsString('client/dist/js/simpler-silverstripe.js', $body);
        $this->assertStringContainsString('client/dist/styles/simpler-silverstripe.css', $body);
    }

    public function testImportMapIsInjectedIntoAdminHead(): void
    {
        $this->logInWithPermission('ADMIN');
        $body = $this->get('admin/security')->getBody();

        $this->assertMatchesRegularExpression('#<script type="importmap">#', $body);
        // The import map must sit in <head>: browsers ignore one that follows a module script
        $head = substr($body, 0, (int) stripos($body, '</head>'));
        $this->assertStringContainsString('<script type="importmap">', $head);
        $this->assertStringContainsString('"vue":', $head);
        // Dev environment (the test default) gets the dev build of Vue
        $this->assertStringContainsString('client/dist/js/vue.esm-browser.js', $head);
    }

    public function testModalIsNotLoadedByDefault(): void
    {
        $this->logInWithPermission('ADMIN');
        $body = $this->get('admin/security')->getBody();

        $this->assertStringNotContainsString('simpler-modal.js', $body);
    }

    public function testSimplerIncludeModalLoadsModalAsModule(): void
    {
        Config::modify()->set(LeftAndMain::class, 'simpler_include_modal', true);

        $this->logInWithPermission('ADMIN');
        $body = $this->get('admin/security')->getBody();

        $this->assertMatchesRegularExpression(
            '#<script type="module"[^>]*src="[^"]*client/dist/js/simpler-modal\.js#',
            $body
        );
    }

    public function testRequireImportMapUsesProductionVueOutsideDev(): void
    {
        $kernel = Injector::inst()->get(Kernel::class);
        $previous = $kernel->getEnvironment();
        try {
            $kernel->setEnvironment('live');
            AdminExtension::requireImportMap();
            $this->assertStringEndsWith('client/dist/js/vue.esm-browser.prod.js', strtok(HeadRequirements::get_imports()['vue'], '?'));

            $kernel->setEnvironment('dev');
            AdminExtension::requireImportMap();
            $this->assertStringEndsWith('client/dist/js/vue.esm-browser.js', strtok(HeadRequirements::get_imports()['vue'], '?'));
        } finally {
            $kernel->setEnvironment($previous);
        }
    }

    public function testRequireModalAddsModuleScript(): void
    {
        AdminExtension::requireModal();

        $scripts = Requirements::backend()->getJavascript();
        $matches = array_filter(
            $scripts,
            fn ($options, $file) => str_contains($file, 'client/dist/js/simpler-modal.js'),
            ARRAY_FILTER_USE_BOTH
        );
        $this->assertCount(1, $matches);
        $this->assertSame('module', reset($matches)['type'] ?? null);
    }

    public function testAssertImportMapAvailableWarnsWhenNotInitialised(): void
    {
        $warnings = $this->captureUserWarnings(fn () => AdminExtension::assertImportMapAvailable());

        $this->assertCount(1, $warnings);
        $this->assertStringContainsString('Vue import map not available', $warnings[0]);
    }

    public function testAssertImportMapAvailableIsSilentWhenSkipped(): void
    {
        Config::modify()->set(AdminExtension::class, 'skip_import_map_check', true);

        $warnings = $this->captureUserWarnings(fn () => AdminExtension::assertImportMapAvailable());

        $this->assertSame([], $warnings);
    }

    public function testAssertImportMapAvailableIsSilentAfterAdminInit(): void
    {
        // What a CMS request does: LeftAndMain init fires onAfterInit on the extension
        $this->logInWithPermission('ADMIN');
        $this->get('admin/security');

        $warnings = $this->captureUserWarnings(fn () => AdminExtension::assertImportMapAvailable());

        $this->assertSame([], $warnings);
    }

    /**
     * Collect E_USER_WARNING messages raised by $callback.
     *
     * A local handler rather than expectWarning(): PHPUnit 9 (SS5) converts warnings to
     * exceptions by default and PHPUnit 11 (SS6) does not, so this is the portable form.
     *
     * @return string[]
     */
    private function captureUserWarnings(callable $callback): array
    {
        $warnings = [];
        set_error_handler(function (int $errno, string $errstr) use (&$warnings) {
            $warnings[] = $errstr;
            return true;
        }, E_USER_WARNING);
        try {
            $callback();
        } finally {
            restore_error_handler();
        }
        return $warnings;
    }
}
