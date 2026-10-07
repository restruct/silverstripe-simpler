import { test, expect, expectAjaxOk, openTab, rowTitled } from './support';
import type { Page } from '@playwright/test';

// EditProtectedTextField (a Vue component in the record's edit form; needs the import map from
// AdminExtension). The fixture shows it as the Code field of the "modal" tab's records.

/** Open a record's edit form by clicking its row, which the CMS loads through pjax. */
async function openRecord(page: Page, title: string): Promise<void> {
    const grid = await openTab(page, 'modal');
    await rowTitled(grid, title).locator('td.col-Title').click();
    await expect(page.locator('#Form_ItemEditForm')).toBeVisible();
}

function parts(page: Page) {
    const field = page.locator('.edit-protected-field');
    return {
        field,
        input: field.locator('input[name="Code"]'),
        edit: field.locator('button[title="Edit"]'),
        // The second button: Cancel while unchanged, Revert once the value differs.
        cancel: field.locator('button').nth(1),
    };
}

test('starts read-only, unlocks with the edit button, and Revert restores the value', async ({ page }) => {
    await openRecord(page, 'Modal edit');
    const { field, input, edit, cancel } = parts(page);
    await expect(field).toHaveCount(1);
    // Mounted by Vue (the inline module ran after the pjax insert).
    expect(await field.evaluate((el) => !!(el as any).__vue_app__)).toBe(true);
    await expect(input).toHaveValue('EDIT-1');
    await expect(input).toHaveAttribute('readonly', '');
    await expect(edit).toBeVisible();
    await expect(cancel).toBeHidden();

    await edit.click();
    await expect(input).not.toHaveAttribute('readonly');
    await expect(input).toBeFocused();
    await expect(edit).toBeHidden();
    await expect(cancel).toBeVisible();
    await expect(cancel).toHaveClass(/font-icon-cancel/);
    await expect(cancel).toHaveAttribute('title', 'Cancel');

    await input.fill('CHANGED');
    await expect(cancel).toHaveClass(/font-icon-back-in-time/);
    await expect(cancel).toHaveAttribute('title', 'Revert');

    await cancel.click();
    await expect(input).toHaveValue('EDIT-1');
    await expect(input).toHaveAttribute('readonly', '');
    await expect(edit).toBeVisible();
});

test('an empty value shows a dash placeholder and muted text (#16 on SS6)', async ({ page }) => {
    // https://github.com/restruct/silverstripe-simpler/issues/16 - on SS6 a null value rendered as
    // "const originalValue = ;" in the inline module, which does not parse, so Vue never mounted
    // (the console guard catches the parse error as well).
    await openRecord(page, 'Modal empty');
    const { input } = parts(page);
    await expect(input).toHaveValue('');
    await expect(input).toHaveAttribute('placeholder', '—');
    await expect(input).toHaveClass(/text-muted/);
});

test('an unlocked, edited value is saved with the form', async ({ page }) => {
    await openRecord(page, 'Modal save');
    const { input, edit } = parts(page);
    const value = `SAVE-${Date.now()}`;
    await edit.click();
    await input.fill(value);

    const saved = page.waitForRequest((r) => r.method() === 'POST' && /\/ItemEditForm(\?|$)/.test(r.url()));
    await page.locator('#Form_ItemEditForm_action_doSave').click();
    await expectAjaxOk(await saved);

    // A full reload renders the field again from the database: read-only, with the new value.
    await page.reload();
    const after = parts(page);
    await expect(after.input).toHaveValue(value);
    await expect(after.input).toHaveAttribute('readonly', '');
});
