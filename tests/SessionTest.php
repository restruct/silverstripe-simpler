<?php

namespace Restruct\Silverstripe\Simpler\Tests;

use ReflectionProperty;
use Restruct\Silverstripe\Simpler\Session;
use Restruct\Silverstripe\Simpler\Tests\Stub\TestController;
use SilverStripe\Control\Controller;
use SilverStripe\Control\HTTPRequest;
use SilverStripe\Control\Session as CoreSession;
use SilverStripe\Core\Injector\Injector;
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
     * Session remembers the last session it resolved in a static that outlives the controller. It is
     * only read when there is no current controller (and no injected request); with a controller,
     * that controller's request session is the source of truth (#7).
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

    /**
     * #7: a second request in the same process gets its own session, not the first request's
     * (queue runners, workers, worker-mode runtimes, tests that make several requests).
     */
    public function testFollowsTheCurrentRequestSession(): void
    {
        Session::set('simpler.key', 'first');

        $secondSession = new CoreSession([]);
        $secondRequest = new HTTPRequest('GET', '/second');
        $secondRequest->setSession($secondSession);
        $second = TestController::create();
        $second->setRequest($secondRequest);
        $second->pushCurrent();
        try {
            $this->assertNull(Session::get('simpler.key'), 'the second request does not see the first session');
            Session::set('simpler.key', 'second');
            $this->assertSame('second', $secondSession->get('simpler.key'));
            $this->assertSame('first', $this->coreSession->get('simpler.key'), 'the first session is untouched');
        } finally {
            $second->popCurrent();
        }

        # Back on the first controller, the helpers use its session again
        $this->assertSame('first', Session::get('simpler.key'));
    }

    /**
     * Run $test with an empty controller stack (as in a shutdown function, a queued job run after
     * the request, or middleware after the delegate), then put the stack back.
     *
     * Through reflection so the test itself raises no SS5 "No current controller available"
     * warning; with no injected HTTPRequest unless the test registers one.
     */
    private static function withoutControllers(callable $test): void
    {
        $stack = new ReflectionProperty(Controller::class, 'controller_stack');
        $stack->setAccessible(true);
        $saved = $stack->getValue();
        $stack->setValue(null, []);
        try {
            # SapphireTest nests the Injector per test, so this unregister does not leak
            Injector::inst()->unregisterNamedObject(HTTPRequest::class);
            $test();
        } finally {
            $stack->setValue(null, $saved);
        }
    }

    /**
     * Without a current controller the helpers keep working on the session used last, as 1.0.2 did
     * (#7 must not turn that into a fatal "getRequest() on null"); on SS5 without a warning either.
     */
    public function testWithoutAControllerUsesTheLastSession(): void
    {
        Session::set('simpler.key', 'value');

        self::withoutControllers(function () {
            $this->assertSame('value', Session::get('simpler.key'));
            Session::set('simpler.other', 'later');
        });

        $this->assertSame('later', $this->coreSession->get('simpler.other'));
    }

    /**
     * Without a current controller, a request registered with the Injector (what
     * Director::currentRequest() falls back to) wins over the remembered session.
     */
    public function testWithoutAControllerPrefersTheInjectedRequest(): void
    {
        Session::set('simpler.key', 'from controller');

        $injectedSession = new CoreSession(['simpler' => ['key' => 'from injected request']]);
        $injected = new HTTPRequest('GET', '/injected');
        $injected->setSession($injectedSession);

        self::withoutControllers(function () use ($injected) {
            Injector::inst()->registerService($injected, HTTPRequest::class);
            $this->assertSame('from injected request', Session::get('simpler.key'));
        });
    }
}
