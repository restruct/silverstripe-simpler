import {
    test,
    expect,
    expectModalClosed,
    expectModalShown,
    listGrid,
    modal,
    openTab,
    pathOf,
    rowTitled,
    watchDocumentNavigations,
    watchGridRequests,
} from './support';

// GridFieldModalButton (README section 5) and the simpler.modal JS API (section 3). The fixture
// button (fixtures/SpBDetailsButton.php) loads the modal itself; simpler_include_modal is off.

test.describe('GridFieldModalButton', () => {
    test('opens the modal with the row title and escaped body, with no GridField request', async ({ page }) => {
        const grid = await openTab(page, 'modal');
        const pathBefore = pathOf(page);
        const button = rowTitled(grid, 'Modal alpha').locator('button[data-simpler-modal]');
        await expect(button).toHaveText('Details');
        await expect(button).toHaveClass('btn btn-sm btn-outline-info');
        // #5: the button sits in span.action (so the row click does not open the record) and does
        // not carry .action itself (which made the admin AJAX-reload the GridField on every click).
        await expect(button.locator('xpath=..')).toHaveClass('action');

        const gridRequests = watchGridRequests(page, 'modal');
        const navigations = watchDocumentNavigations(page);
        await button.click();

        await expectModalShown(page);
        await expect(modal(page).locator('.modal-title')).toHaveText('Details for Modal alpha');
        // The body is the component's HTML; the description inside it was escaped, so its markup
        // shows as text and creates no element.
        await expect(modal(page).locator('.modal-body .spb-desc')).toHaveText('Alpha <b>description</b> & more');
        await expect(modal(page).locator('.modal-body b')).toHaveCount(0);
        // Footer: the close button with the default text, no save button.
        await expect(modal(page).locator('.modal-footer button', { hasText: 'Sluiten' })).toBeVisible();
        await expect(modal(page).locator('#simpleAdminModalPrimaryBtn')).toBeHidden();

        expect(gridRequests(), 'requests to the GridField after the click').toEqual([]);
        expect(navigations(), 'document navigations after the click').toEqual([]);
        expect(pathOf(page), 'the record did not open').toBe(pathBefore);
        await expect(page.locator('#Form_ItemEditForm')).toHaveCount(0);
    });

    test('shows no button where shouldShowButton() says no', async ({ page }) => {
        const grid = await openTab(page, 'modal');
        await expect(rowTitled(grid, 'Modal edit').locator('button[data-simpler-modal]')).toHaveCount(1);
        await expect(rowTitled(grid, 'Modal empty').locator('button[data-simpler-modal]')).toHaveCount(0);
    });

    test('closes by the footer button, the header X and Escape, and resets its state each time', async ({ page }) => {
        const grid = await openTab(page, 'modal');
        const button = rowTitled(grid, 'Modal alpha').locator('button[data-simpler-modal]');
        // The header close button differs per Bootstrap major (see the Bootstrap spec below).
        const closers = [
            async () => modal(page).locator('.modal-footer button', { hasText: 'Sluiten' }).click(),
            async () => modal(page).locator('.modal-header [data-simpler-dismiss]').click(),
            async () => page.keyboard.press('Escape'),
        ];
        for (const close of closers) {
            await button.click();
            await expectModalShown(page);
            await expect(modal(page).locator('.modal-title')).toHaveText('Details for Modal alpha');
            await close();
            await expectModalClosed(page);
        }
        // And it opens again for another row, with that row's content.
        await rowTitled(grid, 'Modal edit').locator('button[data-simpler-modal]').click();
        await expect(modal(page).locator('.modal-title')).toHaveText('Details for Modal edit');
        await expect(modal(page).locator('.spb-desc')).toHaveText('For the edit form');
    });

    test('uses the Bootstrap modal that matches the admin CSS (4 on SS5, 5 on SS6)', async ({ page }, testInfo) => {
        const grid = await openTab(page, 'modal');
        await rowTitled(grid, 'Modal alpha').locator('button[data-simpler-modal]').click();
        await expectModalShown(page);
        const state = await page.evaluate(() => ({
            bs5Instance: !!(window as any).simpler.modalInstance,
            bs4Data: !!(window as any).jQuery('#simplerAdminModal').data('bs.modal'),
        }));
        const close = modal(page).locator('.modal-header [data-simpler-dismiss]');
        if (testInfo.project.name === 'ss5') {
            // Bootstrap 4 jQuery plugin: .close (the template's × span, which the SS5 admin CSS
            // replaces with its own icon), instance in jQuery data.
            await expect(close).toHaveClass(/(^|\s)close(\s|$)/);
            await expect(close.locator('span')).toHaveText('\u00d7');
            expect(state).toEqual({ bs5Instance: false, bs4Data: true });
        } else {
            // Bootstrap 5 native API: .btn-close (CSS draws the X, the × span is v-show'n off),
            // a Modal instance.
            await expect(close).toHaveClass(/(^|\s)btn-close(\s|$)/);
            await expect(close.locator('span')).toHaveCSS('display', 'none');
            expect(state.bs5Instance).toBe(true);
        }
        // Either way a backdrop is shown and the body is locked.
        await expect(page.locator('.modal-backdrop')).toHaveCount(1);
        await expect(page.locator('body')).toHaveClass(/modal-open/);
    });

    test('opens after the tab was reached through CMS navigation (#15)', async ({ page }) => {
        // https://github.com/restruct/silverstripe-simpler/issues/15 - the modal script arrives
        // through X-Include-JS, which the admin evaluates as a classic script: the module throws
        // ("Cannot use import statement outside a module") and window.simpler.modal stays undefined.
        await openTab(page, 'toggle');
        await page.locator('.cms-tabset-nav-primary a, .cms-content-header-tabs a', { hasText: 'Modal buttons' }).first().click();
        const grid = listGrid(page, 'modal');
        await expect(rowTitled(grid, 'Modal alpha')).toBeVisible();
        await rowTitled(grid, 'Modal alpha').locator('button[data-simpler-modal]').click();
        await expect(modal(page).locator('.modal-title')).toHaveText('Details for Modal alpha');
    });
});

test.describe('simpler.modal JS API', () => {
    test('title, HTML body, custom size, footer buttons and save callback', async ({ page }) => {
        await openTab(page, 'modal');
        await page.evaluate(() => {
            const m = (window as any).simpler.modal;
            m.title = 'API dialog';
            m.bodyHtml = '<p id="spb-api-body">From <em>JS</em></p>';
            m.size = '640px';
            m.saveBtn = true;
            m.saveTxt = 'Go';
            m.closeBtn = true;
            m.closeTxt = 'Cancel';
            m.onSave = () => ((window as any).__spbSaved = ((window as any).__spbSaved ?? 0) + 1);
            m.show = true;
        });
        await expectModalShown(page);
        await expect(modal(page).locator('.modal-title')).toHaveText('API dialog');
        await expect(modal(page).locator('#spb-api-body em')).toHaveText('JS');
        // A size that is not sm/lg/xl becomes an inline max-width.
        await expect(modal(page).locator('.modal-dialog')).toHaveCSS('max-width', '640px');
        // The save button calls onSave and leaves the modal open.
        await modal(page).locator('#simpleAdminModalPrimaryBtn', { hasText: 'Go' }).click();
        expect(await page.evaluate(() => (window as any).__spbSaved)).toBe(1);
        await expect(modal(page)).toBeVisible();
        await modal(page).locator('.modal-footer button', { hasText: 'Cancel' }).click();
        await expectModalClosed(page);

        // Bootstrap size keywords become a class instead; show = false closes it from JS.
        await page.evaluate(() => {
            const m = (window as any).simpler.modal;
            m.title = 'Large';
            m.size = 'lg';
            m.show = true;
        });
        await expectModalShown(page);
        await expect(modal(page).locator('.modal-dialog')).toHaveClass(/(^|\s)modal-lg(\s|$)/);
        await page.evaluate(() => ((window as any).simpler.modal.show = false));
        await expectModalClosed(page);
    });

    test('static mode: neither Escape nor a backdrop click closes it (#8 on SS5)', async ({ page }, testInfo) => {
        // https://github.com/restruct/silverstripe-simpler/issues/8 - on SS5, setting bodyHtml
        // before show creates the Bootstrap 4 instance with the default (closable) options, which
        // the static options of the show that follows do not replace.
        test.fixme(testInfo.project.name === 'ss5', 'https://github.com/restruct/silverstripe-simpler/issues/8');
        await openTab(page, 'modal');
        await page.evaluate(() => {
            const m = (window as any).simpler.modal;
            m.title = 'Static';
            m.bodyHtml = '<p>Busy</p>';
            m.closeBtn = true;
            m.closeTxt = 'Cancel';
            m.static = true;
            m.show = true;
        });
        await expectModalShown(page);
        await page.keyboard.press('Escape');
        await page.mouse.click(5, 5);
        await page.waitForTimeout(400);
        await expect(modal(page)).toBeVisible();
        // The footer close button still closes it.
        await modal(page).locator('.modal-footer button', { hasText: 'Cancel' }).click();
        await expectModalClosed(page);
    });

    test('static mode applies when the modal is reopened (#8 on SS5)', async ({ page }, testInfo) => {
        // https://github.com/restruct/silverstripe-simpler/issues/8 - the Bootstrap 4 plugin keeps
        // the options of the first opening, so a later static modal still closes on Escape.
        test.fixme(testInfo.project.name === 'ss5', 'https://github.com/restruct/silverstripe-simpler/issues/8');
        await openTab(page, 'modal');
        await page.evaluate(() => {
            const m = (window as any).simpler.modal;
            m.title = 'First, closable';
            m.show = true;
        });
        await expectModalShown(page);
        await page.keyboard.press('Escape');
        await expectModalClosed(page);

        await page.evaluate(() => {
            const m = (window as any).simpler.modal;
            m.title = 'Second, static';
            m.static = true;
            m.show = true;
        });
        await expectModalShown(page);
        await expect(modal(page).locator('.modal-title')).toHaveText('Second, static');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);
        await expect(modal(page)).toBeVisible();
    });
});
