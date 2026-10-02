import { test, expect, expectModalClosed, expectModalShown, modal, openTab, rowTitled } from './support';

// SimplerModalField and SimplerModalAction (README section 4): drop-in PureModal replacements that
// render in simpler.modal. They need lekoala/silverstripe-pure-modal (and the action
// lekoala/silverstripe-cms-actions), which targets.sh adds to the scratch hosts. The record edit
// form is opened with a full page load: reaching it through CMS navigation is #15 (the modal
// script cannot load through pjax), covered by modal.spec.ts.

/**
 * Open the record whose title is (or, for a RegExp, starts like) this one with a full page load.
 * The rename spec renames its record within the run, so it finds it by prefix on later repeats.
 */
async function openRecord(page: import('@playwright/test').Page, title: string | RegExp): Promise<void> {
    const grid = await openTab(page, 'puremodal');
    const row = typeof title === 'string'
        ? rowTitled(grid, title)
        : grid.locator('tr.ss-gridfield-item').filter({ has: page.locator('td.col-Title', { hasText: title }) });
    const id = await row.getAttribute('data-id');
    await page.goto(`/admin/simpler-browser/puremodal/EditForm/field/puremodal/item/${id}/edit`);
    await expect(page.locator('#Form_ItemEditForm input[name="Title"]')).toHaveValue(title);
}

test('SimplerModalField opens its HTML content in the modal, with its title and size', async ({ page }) => {
    await openRecord(page, 'Pure info');
    const button = page.locator('#Form_ItemEditForm_SpbInfo');
    await expect(button).toHaveText('Show info');
    await expect(button).toHaveAttribute('type', 'button');

    await button.click();
    await expectModalShown(page);
    await expect(modal(page).locator('.modal-title')).toHaveText('Info for Pure info');
    // setContent() is HTML and arrives as HTML.
    await expect(modal(page).locator('.modal-body p.spb-info strong')).toHaveText('PURE-1');
    // setModalSize('640px') is a custom width on the dialog (not 600px, which the admin CSS already gives a dialog).
    await expect(modal(page).locator('.modal-dialog')).toHaveCSS('max-width', '640px');
    // closeBtn defaults to false for the field: no footer close button.
    await expect(modal(page).locator('.modal-footer button').filter({ visible: true })).toHaveCount(0);

    await modal(page).locator('[data-simpler-dismiss]').first().click();
    await expectModalClosed(page);
});

test('SimplerModalAction shows its fields in the modal and submits them to the record', async ({ page }, testInfo) => {
    // https://github.com/restruct/silverstripe-simpler/issues/18 - on SS5 the stripped modal form
    // fails the edit form's validation (the Enum dropdown "(none) is not a valid option") and the
    // record method never runs. Measured red on SS5, green on SS6 (2026-10-02).
    test.fixme(testInfo.project.name === 'ss5', 'simpler#18: SimplerModalAction fails validation on SS5');
    await openRecord(page, /^Pure rename/);
    const button = page.locator('[data-simpler-modal]', { hasText: 'Rename' });
    await button.click();
    await expectModalShown(page);
    await expect(modal(page).locator('.modal-title')).toHaveText('Apply rename');
    const form = modal(page).locator('form.simpler-modal-form');
    await expect(form.locator('input[name="NewTitle"]')).toBeVisible();

    const newTitle = `Pure rename ${Date.now()}`;
    await form.locator('input[name="NewTitle"]').fill(newTitle);
    // The modal's form is a real form outside the CMS form: it submits straight to the record's
    // item edit form, through cms-actions' doCustomAction[spbRename].
    const posted = page.waitForRequest((r) => r.method() === 'POST' && /\/item\/\d+\/ItemEditForm$/.test(r.url()));
    await form.getByRole('button', { name: 'Apply rename' }).click();
    const request = await posted;
    expect(new URLSearchParams(request.postData() ?? '').get('action_doCustomAction[spbRename]')).toBe('Apply rename');

    // The record method ran: its message shows, and the record has the new title.
    await expect(page.getByText(`Renamed to ${newTitle}`)).toBeVisible();
    await expect(page.locator('#Form_ItemEditForm input[name="Title"]')).toHaveValue(newTitle);
    const grid = await openTab(page, 'puremodal');
    await expect(rowTitled(grid, newTitle)).toHaveCount(1);
});
