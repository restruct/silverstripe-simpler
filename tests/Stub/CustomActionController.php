<?php

namespace Restruct\Silverstripe\Simpler\Tests\Stub;

/**
 * Stands in for cms-actions' ActionsGridFieldItemRequest in the issue #18 tests: the edit form's
 * controller with a doCustomAction() handler, so a POST of action_doCustomAction[<name>] runs through
 * the real FormRequestHandler::httpSubmission() (validation included) without needing cms-actions.
 */
class CustomActionController extends TestController
{
    private static $allowed_actions = [
        'doCustomAction',
    ];

    /**
     * Reports which custom action ran and the data it got, the way cms-actions reads the action name.
     *
     * @param array<string,mixed> $data
     */
    public function doCustomAction($data, $form): string
    {
        return 'ran:' . key($data['action_doCustomAction']) . ':' . ($data['NewTitle'] ?? '');
    }
}
