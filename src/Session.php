<?php

namespace Restruct\Silverstripe\Simpler;


use SilverStripe\Control\Controller;

class Session
{
    /**
     * No longer read or written (#7). Kept so code that references it (a subclass, a test resetting
     * it through reflection) does not break.
     *
     * @deprecated The session is resolved from the current request on every call
     */
    protected static $curr_session = null;

    /**
     * The current request's session, resolved on every call.
     *
     * Was cached in self::$curr_session on first use, for the rest of the process. Under PHP-FPM that
     * is one request, but in a long-running process (queue runner, worker, worker-mode runtime, a
     * test making several requests) every later request then read and wrote the FIRST request's
     * session (#7). Resolving it is two getters, so there is nothing worth caching.
     */
    protected static function current_session()
    {
        // if(!self::$curr_session) {
        //     self::$curr_session = Controller::curr()->getRequest()->getSession();
        // }
        // return self::$curr_session;
        return Controller::curr()->getRequest()->getSession();
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