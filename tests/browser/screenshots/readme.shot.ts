import { test, expect, type Page } from '@playwright/test';
import * as path from 'path';

// Generates the README screenshots in docs/images/. Not a test suite: run it with
// ./playwright.config.ts (see README.md next to this file). The content comes from the screenshot
// fixtures in ./fixtures: a "Catalogue" admin (ShowcaseAdmin) with six demo products.

const IMAGES = path.join(__dirname, '..', '..', '..', 'docs', 'images');

/**
 * Hide what only the test host has: the browser-test fixtures' menu entry ("Simpler browser
 * test"). Presentation only; nothing about the module's own UI is changed.
 */
async function hideFixtureChrome(page: Page): Promise<void> {
    await page.addStyleTag({ content: '.cms-menu li:has(> a[href*="admin/simpler-browser"]) { display: none !important; }' });
}

/** No hover or focus highlight left on what was just clicked. */
async function settle(page: Page): Promise<void> {
    await page.mouse.move(1270, 790);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.waitForTimeout(500);
}

const modal = (page: Page) => page.locator('#simplerAdminModal');

/** Wait for the modal's fade-in to finish. */
async function modalShown(page: Page): Promise<void> {
    await expect(modal(page)).toHaveClass(/\bshow\b/);
    await expect(modal(page).locator('.modal-dialog')).toBeVisible();
    await page.waitForTimeout(600);
}

/** Open the products list and wait until the GridField and its row buttons are rendered. */
async function openProducts(page: Page): Promise<void> {
    await page.goto('/admin/catalogue/products');
    await expect(page.locator('.grid-field__table tbody tr.ss-gridfield-item')).toHaveCount(6);
    await expect(page.locator('button[data-simpler-modal]', { hasText: 'Adjust prices' })).toBeVisible();
    await hideFixtureChrome(page);
}

/** Clip from the top of the window down to just below the given element. */
async function clipTo(page: Page, selector: string, file: string, extra = 16): Promise<void> {
    const box = (await page.locator(selector).first().boundingBox())!;
    await page.screenshot({
        path: path.join(IMAGES, file),
        clip: { x: 0, y: 0, width: 1280, height: Math.min(800, Math.ceil(box.y + box.height + extra)) },
    });
}

test('GridField: toggle, status and details buttons per row, a modal action in the toolbar', async ({ page }) => {
    await openProducts(page);
    await settle(page);
    // The toggles are also items of the row's action menu: open it on one row to show them.
    const row = page.locator('.grid-field__table tr.ss-gridfield-item', { hasText: 'Oak side table' });
    await row.locator('.action-menu__toggle').click();
    await expect(row.locator('.action-menu__dropdown')).toBeVisible();
    await expect(row.locator('.action-menu__dropdown .dropdown-item', { hasText: 'Deactivate' })).toBeVisible();
    await page.mouse.move(1270, 790);
    await page.waitForTimeout(400);
    await clipTo(page, '.grid-field__table', 'gridfield-buttons.png');
});

test('GridField toolbar: a form in a modal', async ({ page }) => {
    await openProducts(page);
    await page.locator('button[data-simpler-modal]', { hasText: 'Adjust prices' }).click();
    await modalShown(page);
    await expect(modal(page).locator('.modal-title')).toHaveText('Adjust prices of all listed products');
    await settle(page);
    // Down to the end of the list underneath, so the modal is seen over the GridField it acts on.
    await clipTo(page, '.grid-field__table', 'toolbar-modal.png');
});

test('Edit form: EditProtectedTextField unlocked, a SimplerModalField and a SimplerModalAction', async ({ page }) => {
    await openProducts(page);
    await page.locator('.grid-field__table td.col-Title', { hasText: 'Oak side table' }).click();
    const form = page.locator('#Form_ItemEditForm');
    await expect(form.locator('.edit-protected-field')).toBeVisible();
    // Unlock the SKU and change it: the cancel button turns into a revert button.
    await form.locator('.edit-protected-field button.font-icon-edit-write').click();
    await form.locator('.edit-protected-field input').fill('TBL-0932');
    await expect(form.locator('.edit-protected-field button.font-icon-back-in-time')).toBeVisible();
    await hideFixtureChrome(page);
    await page.mouse.move(1270, 790);
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(IMAGES, 'edit-form.png') });
});

test('Edit form: SimplerModalAction opens its fields in a modal', async ({ page }) => {
    await openProducts(page);
    await page.locator('.grid-field__table td.col-Title', { hasText: 'Oak side table' }).click();
    const action = page.locator('#Form_ItemEditForm button[data-simpler-modal]', { hasText: 'Duplicate as...' });
    await expect(action).toBeVisible();
    await hideFixtureChrome(page);
    await action.click();
    await modalShown(page);
    await settle(page);
    await page.screenshot({ path: path.join(IMAGES, 'modal-action.png') });
});
