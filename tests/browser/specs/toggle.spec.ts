import {
    test,
    expect,
    expectAjaxOk,
    openActionMenu,
    openTab,
    rowTitled,
    waitForGridPost,
    watchDocumentNavigations,
} from './support';
import type { Locator, Page } from '@playwright/test';

// GridFieldToggleFieldButton and GridFieldToggleIsActiveButton (README section 5). The fixture
// (fixtures/SpBAdmin.php) puts both on the "toggle" tab. The admin moves the toggle buttons into
// each row's action menu (they implement GridField_ActionMenuItem). The specs read the current
// value first instead of assuming the seed, so they stay valid under --repeat-each.

const STATUS_CYCLE: Record<string, { next: string; label: string; cls: string }> = {
    draft: { next: 'review', label: 'Submit for Review', cls: 'spb-draft' },
    review: { next: 'published', label: 'Publish', cls: 'spb-review' },
    published: { next: 'draft', label: 'Reset to Draft', cls: 'spb-published' },
};

async function cell(row: Locator, col: string): Promise<string> {
    return ((await row.locator(`td.col-${col}`).textContent()) ?? '').trim();
}

/** Click a toggle item in the row's action menu and wait for its AJAX POST to succeed. */
async function clickToggle(page: Page, row: Locator, label: string): Promise<void> {
    const items = await openActionMenu(row);
    const item = items.filter({ hasText: new RegExp(`^${label}$`) });
    await expect(item).toHaveCount(1);
    const posted = waitForGridPost(page, 'toggle');
    await item.click();
    await expectAjaxOk(await posted);
}

test('the IsActive toggle flips the value through an AJAX POST and re-renders the row', async ({ page }) => {
    // Any dialog is accepted here; that the confirm appears is checked by the #14 specs below.
    page.on('dialog', (d) => d.accept());
    const grid = await openTab(page, 'toggle');
    const row = rowTitled(grid, 'Toggle active');
    const wasActive = (await cell(row, 'IsActive-Nice')) === 'Yes';
    const label = wasActive ? 'Deactivate' : 'Activate';

    // The menu item carries the state class and icon of the current value.
    const items = await openActionMenu(row);
    const item = items.filter({ hasText: new RegExp(`^${label}$`) });
    await expect(item).toHaveClass(new RegExp(wasActive ? 'currently-active' : 'currently-inactive'));
    await expect(item).toHaveClass(new RegExp(wasActive ? 'font-icon-minus-circle' : 'font-icon-check-mark-circle'));
    await page.keyboard.press('Escape');

    const navigations = watchDocumentNavigations(page);
    await clickToggle(page, row, label);

    // The GridField re-rendered in place with the new value and the opposite action.
    await expect(row.locator('td.col-IsActive-Nice')).toHaveText(wasActive ? 'No' : 'Yes');
    const after = await openActionMenu(row);
    await expect(after.filter({ hasText: new RegExp(`^${wasActive ? 'Activate' : 'Deactivate'}$`) })).toHaveCount(1);
    expect(navigations(), 'document navigations after the toggle').toEqual([]);

    // Written to the database, not only re-rendered.
    await page.reload();
    await expect(rowTitled(grid, 'Toggle active').locator('td.col-IsActive-Nice')).toHaveText(wasActive ? 'No' : 'Yes');
});

test('a multi-state toggle cycles through its states in order and back to the start', async ({ page }) => {
    const grid = await openTab(page, 'toggle');
    const row = rowTitled(grid, 'Toggle status');
    const start = await cell(row, 'Status');
    expect(Object.keys(STATUS_CYCLE), 'seeded status is one of the configured states').toContain(start);

    let current = start;
    for (let i = 0; i < 3; i++) {
        const state = STATUS_CYCLE[current];
        const items = await openActionMenu(row);
        await expect(items.filter({ hasText: new RegExp(`^${state.label}$`) })).toHaveClass(new RegExp(state.cls));
        await page.keyboard.press('Escape');
        await clickToggle(page, row, state.label);
        await expect(row.locator('td.col-Status')).toHaveText(state.next);
        current = state.next;
    }
    expect(current, 'three clicks bring a three-state cycle back to the start').toBe(start);
    // The other toggle on the same row was left alone.
    await expect(row.locator('td.col-IsActive-Nice')).toHaveText(/^(Yes|No)$/);
});

test('the IsActive toggle asks "Are you sure?" and does nothing when declined (#14)', async ({ page }) => {
    // https://github.com/restruct/silverstripe-simpler/issues/14 - setConfirmMessage() only sets a
    // data-confirm attribute that nothing reads, so the toggle posts without a dialog.
    const grid = await openTab(page, 'toggle');
    const row = rowTitled(grid, 'Toggle confirm');
    const before = await cell(row, 'IsActive-Nice');
    const label = before === 'Yes' ? 'Deactivate' : 'Activate';

    const posts: string[] = [];
    page.on('request', (r) => {
        if (r.method() === 'POST' && r.url().includes('/field/toggle')) posts.push(r.url());
    });
    // The dialog is answered from a handler registered BEFORE the click: a dialog blocks the click
    // that opened it until it is handled, so awaiting the click first and the dialog after it never
    // returns (Playwright "Dialogs"); that is how this spec stood while it was fixme.
    const messages: string[] = [];
    page.on('dialog', (d) => {
        messages.push(d.message());
        void d.dismiss();
    });
    const items = await openActionMenu(row);
    await items.filter({ hasText: new RegExp(`^${label}$`) }).click();
    expect(messages, 'one confirm, with the configured message').toEqual(['Are you sure?']);

    await page.waitForTimeout(500);
    expect(posts, 'no toggle POST after declining').toEqual([]);
    await expect(row.locator('td.col-IsActive-Nice')).toHaveText(before);
});

test('the IsActive toggle posts once its "Are you sure?" is accepted (#14)', async ({ page }) => {
    // The other half of #14: the confirm handler must hand an accepted click on to the admin's
    // GridField action, so the toggle still posts through AJAX and the row re-renders.
    const grid = await openTab(page, 'toggle');
    const row = rowTitled(grid, 'Toggle confirm');
    const before = await cell(row, 'IsActive-Nice');
    const label = before === 'Yes' ? 'Deactivate' : 'Activate';

    const messages: string[] = [];
    page.on('dialog', (d) => {
        messages.push(d.message());
        void d.accept();
    });
    const navigations = watchDocumentNavigations(page);
    await clickToggle(page, row, label);

    expect(messages, 'exactly one confirm, with the configured message').toEqual(['Are you sure?']);
    await expect(row.locator('td.col-IsActive-Nice')).toHaveText(before === 'Yes' ? 'No' : 'Yes');
    expect(navigations(), 'document navigations after the toggle').toEqual([]);
});
