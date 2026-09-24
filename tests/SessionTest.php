<?php

namespace Restruct\Silverstripe\Simpler\Tests;

use ReflectionProperty;
use Restruct\Silverstripe\Simpler\Session;
use Restruct\Silverstripe\Simpler\Tests\Stub\TestController;
use SilverStripe\Control\HTTPRequest;
use SilverStripe\Control\Session as CoreSession;
use SilverStripe\Dev\SapphireTest;

/**
 * Static Session helpers read and write the current controller's request session.
 */
class SessionTest extends SapphireTest
{
    private ?TestController $controller = null;

    private ?CoreSession $coreSession = null;

    protected function setUp(): void
    {
        parent::setUp();
        self::resetCachedSession();

        $this->coreSession = new CoreSession([]);
        $request = new HTTPRequest('GET', '/');
        $request->setSession($this->coreSession);
        $this->controller = TestController::create();
        $this->controller->setRequest($request);
        $this->controller->pushCurrent();
    }

    protected function tearDown(): void
    {
        $this->controller->popCurrent();
        self::resetCachedSession();
        parent::tearDown();
    }

    /**
     * Session caches the resolved session in a static that outlives the controller
     */
    private static function resetCachedSession(): void
    {
        $cached = new ReflectionProperty(Session::class, 'curr_session');
        $cached->setAccessible(true);
        $cached->setValue(null, null);
    }

    public function testSetAndGetUseTheRequestSession(): void
    {
        Session::set('simpler.key', 'value');

        $this->assertSame('value', $this->coreSession->get('simpler.key'));
        $this->assertSame('value', Session::get('simpler.key'));
    }

    public function testGetMissingKeyReturnsNull(): void
    {
        $this->assertNull(Session::get('simpler.missing'));
    }

    public function testClearRemovesKey(): void
    {
        Session::set('simpler.key', 'value');
        Session::clear('simpler.key');

        $this->assertNull($this->coreSession->get('simpler.key'));
    }

    public function testAddToArray(): void
    {
        Session::add_to_array('simpler.list', 'a');
        Session::add_to_array('simpler.list', 'b');

        $this->assertSame(['a', 'b'], $this->coreSession->get('simpler.list'));
    }

    public function testGetAllAndClearAll(): void
    {
        Session::set('simpler.one', 1);
        Session::set('simpler.two', 2);

        $all = Session::get_all();
        $this->assertSame(1, $all['simpler']['one'] ?? null);
        $this->assertSame(2, $all['simpler']['two'] ?? null);

        Session::clear_all();
        $this->assertNull($this->coreSession->get('simpler.one'));
        $this->assertNull($this->coreSession->get('simpler.two'));
    }
}
