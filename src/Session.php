<?php

namespace Restruct\Silverstripe\Simpler;


use SilverStripe\Control\Controller;
use SilverStripe\Control\HTTPRequest;
use SilverStripe\Core\Injector\Injector;

class Session
{
    /**
     * The session resolved last. Only READ when there is no current controller and no injected
     * request (shutdown functions, a queued job run after the request, middleware after the
     * delegate), so those keep working on the session of the request they ran in, as before 1.0.3.
     * While a controller is current, its request's session is used and remembered here (#7).
     */
    protected static $curr_session = null;

    /**
     * The current request's session.
     *
     * Was cached in self::$curr_session on first use, for the rest of the process. Under PHP-FPM that
     * is one request, but in a long-running process (queue runner, worker, worker-mode runtime, a
     * test making several requests) every later request then read and wrote the FIRST request's
     * session (#7). So, in this order:
     * - a current controller: its request's session (remembered for the case below);
     * - no controller: the request registered with the Injector, as Director::currentRequest()
     *   uses it, if it has a session;
     * - otherwise the session remembered last (what 1.0.2 always returned once it had one);
     * - with nothing remembered either, the old lookup, which fails as it did before.
     */
    protected static function current_session()
    {
        // if(!self::$curr_session) {
        //     self::$curr_session = Controller::curr()->getRequest()->getSession();
        // }
        // return self::$curr_session;
        if (self::has_current_controller()) {
            self::$curr_session = Controller::curr()->getRequest()->getSession();
            return self::$curr_session;
        }

        # Only a REGISTERED request: Injector::get() alone would construct an empty singleton
        if (Injector::inst()->has(HTTPRequest::class)) {
            $request = Injector::inst()->get(HTTPRequest::class);
            if ($request instanceof HTTPRequest && $request->hasSession()) {
                return $request->getSession();
            }
        }

        if (self::$curr_session) {
            return self::$curr_session;
        }

        return Controller::curr()->getRequest()->getSession();
    }

    /**
     * Is a controller current, without SS5's "No current controller available" warning?
     *
     * Controller::curr() raises that E_USER_WARNING on Silverstripe 5 when the stack is empty (and
     * returns null without one on 6). has_curr() exists on 5 only (its deprecation notice is a
     * suppressed one), and on 6 curr() is silent, so each major uses the call that does not warn.
     */
    protected static function has_current_controller(): bool
    {
        if (method_exists(Controller::class, 'has_curr')) {
            return Controller::has_curr();
        }
        return Controller::curr() !== null;
    }

    /**
     * Add a value to a specific key in the session array
     */
    public static function add_to_array($name, $val) {
        self::current_session()->addToArray($name, $val);
    }

    /**
     * Set a key/value pair in the session
     *
     * @param string $name Key
     * @param string $val Value
     */
    public static function set($name, $val) {
        return self::current_session()->set($name, $val);
    }

    /**
     * Return a specific value by session key
     *
     * @param string $name Key to lookup
     */
    public static function get($name) {
        return self::current_session()->get($name);
    }

    /**
     * Return all the values in session
     *
     * @return array|\SilverStripe\Control\Session
     */
    public static function get_all() {
        return self::current_session()->getAll();
    }

    /**
     * Clear a given session key, value pair.
     *
     * @param string $name Key to lookup
     */
    public static function clear($name) {
        return self::current_session()->clear($name);
    }

    /**
     * Clear all the values
     *
     * @return void
     */
    public static function clear_all() {
        self::current_session()->clearAll();
    }

    /**
     * Save all the values in our session to $_SESSION
     */
    public static function save() {
        self::current_session()->save();
    }

}