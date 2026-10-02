import { test, expect, expectAjaxOk, expectModalClosed, listGrid, modal, waitForGridPost } from './support';

// GridFieldToolbarModalAction in form mode (README section 5): the fixture SpBRenameAction asks for
// a suffix in the modal and appends it to every listed record's Title.

test.fixme('the toolbar button opens a form modal that submits through the GridField (#13, #17)', async ({ page }) => {
    // https://github.com/restruct/silverstripe-simpler/issues/13 - without
    // lekoala/silverstripe-pure-modal the tab does not render at all: Class
    // "Restruct\Silverstripe\Simpler\SimplerModalField" not found (GridFieldToolbarModalAction.php).
    // https://github.com/restruct/silverstripe-simpler/issues/17 - with #13 patched on a throwaway
    // copy this passed on SS6 but stuck on "Processing..." on SS5: the local server answers within
    // the 50 ms before the progress indicator starts, so complete() is lost.
    const response = await page.goto('/admin/simpler-browser/toolbar');
    expect(response?.status()).toBe(200);
    const grid = listGrid(page, 'toolbar');
    const button = grid.locator('button[data-simpler-modal]', { hasText: 'Rename all' });
    await expect(button).toBeVisible();

    await button.click();
    await expect(modal(page).locator('.modal-title')).toHaveText('Rename all records');
    const suffix = `S${Date.now() % 100000}`;
    await modal(page).locator('input[name="Suffix"]').fill(suffix);
    const posted = waitForGridPost(page, 'toolbar');
    await modal(page).locator('.simpler-modal-ajax-submit', { hasText: 'Apply suffix' }).click();
    const request = await posted;
    expect(request.postData() ?? '').toContain(suffix);
    await expectAjaxOk(request);

    // On success the modal closes and the GridField reloads in place with the renamed rows.
    await expectModalClosed(page);
    await expect(grid.locator('td.col-Title', { hasText: new RegExp(`^Toolbar one .*${suffix}$`) })).toHaveCount(1);
    await expect(grid.locator('td.col-Title', { hasText: new RegExp(`^Toolbar two .*${suffix}$`) })).toHaveCount(1);
});
