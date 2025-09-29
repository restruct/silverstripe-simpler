<?php

namespace Restruct\Silverstripe\Simpler;

use SilverStripe\Control\HTTPResponse;
use SilverStripe\Core\Extension;
use SilverStripe\ORM\FieldType\DBHTMLText;
use SilverStripe\View\SSViewer;

class AdminExtension
    extends Extension
{

    // Adapted from jonom/betternav, works for SS4 as well as 5 (replaces BrowserWarning.ss template override)
    public function afterCallActionHandler($request, $action, $result)
    {
        $isHtmlResponse = $result instanceof DBHTMLText || ($result instanceof HTTPResponse && strpos($result->getHeader('content-type'), 'text/html') !== false);
        if (!$isHtmlResponse ) {
            return $result;
        }

        $html = $result instanceof DBHTMLText ? $result->getValue() : $result->getBody();
        $simplerAdminItems = $this->owner->renderWith(SSViewer::fromString('<% include SimplerAdminItems %>'));

        // Inject the NavigatorHTML before the closing </body> tag
        $html = preg_replace(
            '/(<\/body[^>]*>)/i',
            $simplerAdminItems . '\\1',
            $html ?? ''
        );
        if ($result instanceof DBHTMLText) {
            $result->setValue($html);
        } else {
            $result->setBody($html);
        }

        return $result;
    }

}
