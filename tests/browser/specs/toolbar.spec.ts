import { test, expect, expectAjaxOk, expectModalClosed, listGrid, modal, waitForGridPost } from './support';

// GridFieldToolbarModalAction in form mode (README section 5): the fixture SpBRenameAction asks for
// a suffix in the modal and appends it to every listed record's Title.

test('the toolbar button opens a form modal that submits through the GridField (#13, #17)', async ({ page }) => {
    // https://github.com/restruct/silverstripe-simpler/issues/13 - without
    // lekoala/silverstripe-pure-modal the tab did not render at all: Class
    // "Restruct\Silverstripe\Simpler\SimplerModalField" not found (GridFieldToolbarModalAction.php).
    // The scratch hosts install pure-modal for the puremodal tab, so #13 itself is covered by the
    // unit tests on the CI legs without it; this spec covers the toolbar flow end to end.
    // https://github.com/restruct/silverstripe-simpler/issues/17 - this stuck on "Processing..." on
    // SS5 when the local server answered within 50 ms; the next spec forces that timing.
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

test('the form modal closes and reloads the GridField when the server answers at once (#17)', async ({ page }) => {
    // https://github.com/restruct/silverstripe-simpler/issues/17 - the progress indicator started
    // 50 ms after the fetch() was sent, so a faster response called complete() before start(): the
    // modal stayed on "Processing..." (static, so it could not be closed) and the GridField never
    // reloaded. The action POST is answered immediately here, so the timing does not depend on how
    // fast the host is. Only that one POST is faked; the GridField reload after it goes through.
    await page.goto('/admin/simpler-browser/toolbar');
    const grid = listGrid(page, 'toolbar');
    await grid.locator('button[data-simpler-modal]', { hasText: 'Rename all' }).click();
    await expect(modal(page).locator('.modal-title')).toHaveText('Rename all records');
    await modal(page).locator('input[name="Suffix"]').fill('fast');

    let faked = 0;
    await page.route(/\/field\/toolbar(\?|$)/, async (route) => {
        const post = route.request().method() === 'POST' && (route.request().postData() ?? '').includes('fast');
        if (post && faked === 0) {
            faked++;
            await route.fulfill({ status: 200, contentType: 'text/html', body: '' });
            return;
        }
        await route.continue();
    });
    const reloaded = page.waitForRequest((r) => /\/field\/toolbar(\?|$)/.test(r.url()) && !(r.postData() ?? '').includes('fast'));
    await modal(page).locator('.simpler-modal-ajax-submit', { hasText: 'Apply suffix' }).click();

    await expectModalClosed(page);
    expect(faked, 'the action POST was answered by the spec').toBe(1);
    await reloaded;
});
