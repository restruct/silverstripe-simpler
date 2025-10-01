<?php

namespace Restruct\Silverstripe\Simpler;

use SilverStripe\Control\HTTPResponse;
use SilverStripe\Core\Extension;
use SilverStripe\ORM\FieldType\DBHTMLText;
use SilverStripe\TemplateEngine\SSTemplateEngine;
use SilverStripe\View\SSViewer;
use SilverStripe\View\ViewLayerData;

class AdminExtension
    extends Extension
{

    // Adapted from jonom/betternav, works for SS4 as well as 5 (replaces BrowserWarning.ss template override)
    public function afterCallActionHandler($request, $action, $result)
    {
        $isHtmlResponse = $result instanceof DBHTMLText || ($result instanceof HTTPResponse && str_contains($result->getHeader('content-type'), 'text/html'));
        if (!$isHtmlResponse ) {
            return $result;
        }

        $html = $result instanceof DBHTMLText ? $result->getValue() : $result->getBody();
        $simplerAdminItems = SSTemplateEngine::create()->renderString('<% include SimplerAdminItems %>', ViewLayerData::create($this->getOwner()));

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
