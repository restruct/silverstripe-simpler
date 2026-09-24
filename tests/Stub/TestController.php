<?php

namespace Restruct\Silverstripe\Simpler\Tests\Stub;

use SilverStripe\Control\Controller;
use SilverStripe\Control\HTTPRequest;
use SilverStripe\Control\Session;
use SilverStripe\Dev\TestOnly;

/**
 * Controller with a fixed Link(), so forms and GridFields built in tests can produce URLs
 * without depending on routing configuration.
 */
class TestController extends Controller implements TestOnly
{
    public function Link($action = null)
    {
        return Controller::join_links('simpler-test', $action);
    }

    /**
     * A controller whose request carries a session, as pushCurrent() and GridField state need
     */
    public static function createWithSession(): static
    {
        $request = new HTTPRequest('GET', '/');
        $request->setSession(new Session([]));
        $controller = static::create();
        $controller->setRequest($request);
        return $controller;
    }
}
