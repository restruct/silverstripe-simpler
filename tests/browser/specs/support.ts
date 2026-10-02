import { test as base, expect, type Locator, type Page, type Request } from '@playwright/test';

// Shared fixtures and helpers for the simpler specs.
//
// The CMS screen is the fixture ModelAdmin in tests/browser/fixtures/ (copied into the scratch host
// by the runner): /admin/simpler-browser/<tab>, one tab per GridField setup, each seeded on every
// dev/build (fixtures/SpB*Record.php). AdminExtension is applied to that admin only.

/** The ModelAdmin tabs (managed_models keys), see fixtures/SpBAdmin.php. */
export type Tab = 'toggle' | 'modal' | 'toolbar' | 'puremodal';

/**
 * test, extended with an automatic console guard: every spec fails if the page logs a console
 * error or throws an uncaught exception at any point, page load included. "Failed to load
 * resource" (any 4xx/5xx asset or request) arrives as a console error too, so a missing module
 * script or a 500 from a GridField action is caught here as well. Warnings (the admin's own Apollo
 * deprecation notices) and simpler's console.debug for the suppressed Entwine/Vue error do not count.
 */
export const test = base.extend<{ consoleGuard: void }>({
    consoleGuard: [
        async ({ page }, use, testInfo) => {
            const errors: string[] = [];
            page.on('console', (msg) => {
                if (msg.type() === 'error') {
                    errors.push(`console.error: ${msg.text()} (${msg.location().url})`);
                }
            });
            page.on('pageerror', (err) => errors.push(`uncaught: ${err.message}`));

            await use();

            if (errors.length) {
                await testInfo.attach('console-errors', { body: errors.join('\n'), contentType: 'text/plain' });
            }
            expect(errors, 'no console errors or uncaught exceptions').toEqual([]);
        },
        { auto: true },
    ],
});

export { expect };

/** The GridField of a ModelAdmin tab (its name is the managed_models key). */
export function listGrid(page: Page, tab: Tab): Locator {
    return page.locator(`#Form_EditForm_${tab}`);
}

/** Open a ModelAdmin tab with a full page load and wait until its GridField has rows. */
export async function openTab(page: Page, tab: Tab): Promise<Locator> {
    await page.goto(`/admin/simpler-browser/${tab}`);
    const grid = listGrid(page, tab);
    await expect(grid.locator('tr.ss-gridfield-item').first()).toBeVisible();
    return grid;
}

/** The GridField row whose Title cell is exactly this title. */
export function rowTitled(grid: Locator, title: string): Locator {
    const exact = new RegExp(`^\\s*${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);
    return grid.locator('tr.ss-gridfield-item').filter({ has: grid.page().locator('td.col-Title', { hasText: exact }) });
}

/**
 * Open the row's action menu ("...") and return its items. The admin's React action menu renders
 * each item from the row's data-schema, as a .dropdown-item; a GridField_ActionMenuItem column
 * button (class action-menu--handled, like simpler's toggle) is moved in there.
 */
export async function openActionMenu(row: Locator): Promise<Locator> {
    await row.locator('.action-menu__toggle').click();
    const menu = row.locator('.action-menu__dropdown');
    await expect(menu).toBeVisible();
    return menu.locator('.dropdown-item');
}

/** Wait for a GridField action POST (action_gridFieldAlterAction) to the GridField's own URL. */
export function waitForGridPost(page: Page, gridName: string): Promise<Request> {
    const url = new RegExp(`/field/${gridName}(\\?|$)`);
    return page.waitForRequest(
        (r) => r.method() === 'POST' && url.test(r.url()) && (r.postData() ?? '').includes('action_gridFieldAlterAction'),
    );
}

/** Record every request to a GridField's URL from now on (the modal button must cause none). */
export function watchGridRequests(page: Page, gridName: string): () => string[] {
    const url = new RegExp(`/field/${gridName}(\\?|/|$)`);
    const seen: string[] = [];
    page.on('request', (r) => {
        if (url.test(r.url())) {
            seen.push(`${r.method()} ${r.url()}`);
        }
    });
    return () => [...seen];
}

/**
 * Record every DOCUMENT request of the main frame from now on. GridField actions must load
 * through the CMS's own XHR requests, never by replacing the page. Returns a getter for the URLs.
 */
export function watchDocumentNavigations(page: Page): () => string[] {
    const seen: string[] = [];
    page.on('request', (r) => {
        if (r.isNavigationRequest() && r.frame() === page.mainFrame()) {
            seen.push(`${r.method()} ${r.url()}`);
        }
    });
    return () => [...seen];
}

/** Assert a request was an AJAX request answered with 200 (else show the start of the body). */
export async function expectAjaxOk(request: Request): Promise<void> {
    expect(['xhr', 'fetch'], 'an AJAX request').toContain(request.resourceType());
    const response = await request.response();
    const status = response?.status();
    const body = status === 200 ? '' : ((await response?.text().catch(() => '')) ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 1500);
    expect(status, `response status${body ? `; body: ${body}` : ''}`).toBe(200);
}

/** The simpler modal (rendered by Vue into #simplerAdminModalContainer by simpler-modal.js). */
export function modal(page: Page): Locator {
    return page.locator('#simplerAdminModal');
}

/**
 * Wait until the modal is fully shown: visible AND Bootstrap's fade-in transition has ended. Both
 * Bootstrap majors ignore hide() (Escape, a dismiss click, show = false) while the instance is
 * still transitioning, so a spec that closes the modal straight after opening it must wait here.
 * The instance is the Bootstrap 5 Modal (SS6) or the Bootstrap 4 plugin's jQuery data (SS5).
 */
export async function expectModalShown(page: Page): Promise<void> {
    await expect(modal(page)).toBeVisible();
    await expect
        .poll(() =>
            page.evaluate(() => {
                const w = window as any;
                const inst = w.simpler?.modalInstance || w.jQuery?.('#simplerAdminModal').data('bs.modal');
                return !!inst && inst._isShown === true && inst._isTransitioning === false;
            }),
        )
        .toBe(true);
}

/** Wait until the modal has finished hiding and simpler-modal.js has reset its state. */
export async function expectModalClosed(page: Page): Promise<void> {
    await expect(modal(page)).toBeHidden();
    // hidden.bs.modal resets every property to its default (title "..."), on both Bootstrap paths.
    await expect.poll(() => page.evaluate(() => (window as any).simpler?.modal?.title)).toBe('...');
}

/** The path of the page URL (the admin rewrites the query string with GridField state). */
export function pathOf(page: Page): string {
    return new URL(page.url()).pathname;
}
