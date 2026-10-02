import { test, expect, openTab, rowTitled } from './support';

// The core bundle (always loaded in the CMS through LeftAndMain extra_requirements) and the Vue
// import map AdminExtension adds (README sections 1 and 2).

test('the core bundle and stylesheet load on a CMS page and set up window.simpler', async ({ page }) => {
    const assets: Record<string, number> = {};
    page.on('response', (r) => {
        const m = r.url().match(/silverstripe-simpler\/client\/dist\/(js\/simpler-silverstripe\.js|styles\/simpler-silverstripe\.css)/);
        if (m) {
            assets[m[1]] = r.status();
        }
    });
    await openTab(page, 'toggle');

    expect(assets, 'core JS and CSS requested once each, both 200').toEqual({
        'js/simpler-silverstripe.js': 200,
        'styles/simpler-silverstripe.css': 200,
    });
    // window.simpler with its spinner template; the modal is opt-in and not on this tab.
    const simpler = await page.evaluate(() => ({
        spinner: (window as any).simpler?.spinner ?? null,
        modal: typeof (window as any).simpler?.modal,
        dom: typeof (window as any).simpler_dom?.emitInsert,
    }));
    expect(simpler.spinner).toContain('spinner-border');
    expect(simpler.dom).toBe('function');
    expect(simpler.modal, 'no modal unless something requires it').toBe('undefined');
    // The xhr_buffer <template> the README describes, appended on DOMContentLoaded.
    await expect(page.locator('body > template#xhr_buffer')).toHaveCount(1);
});

test('DOMNodesInserted fires LOAD on page load and MUTATION after a CMS (pjax) navigation', async ({ page }) => {
    // Registered before any page script runs, so the LOAD event of the first load is seen too.
    await page.addInitScript(() => {
        (window as any).__spbEvents = [];
        document.addEventListener('DOMNodesInserted', (e: any) => (window as any).__spbEvents.push(e.detail.type));
    });
    const grid = await openTab(page, 'modal');
    await expect.poll(() => page.evaluate(() => (window as any).__spbEvents)).toContain('LOAD');

    // Open a record: the CMS loads the edit form through pjax, which the MutationObserver reports.
    await page.evaluate(() => ((window as any).__spbEvents = []));
    // (A record with a Code: an empty EditProtectedTextField errors on SS6, issue #16.)
    await rowTitled(grid, 'Modal edit').locator('td.col-Title').click();
    await expect(page.locator('#Form_ItemEditForm')).toBeVisible();
    await expect.poll(() => page.evaluate(() => (window as any).__spbEvents)).toContain('MUTATION');
    // Same document: the event came from inserted content, not from a new page load.
    expect(await page.evaluate(() => (window as any).__spbEvents)).not.toContain('LOAD');
});

test('AdminExtension puts a Vue import map in <head> that resolves to the bundled Vue build', async ({ page, request }) => {
    await openTab(page, 'toggle');
    const maps = await page.locator('head script[type="importmap"]').allTextContents();
    expect(maps, 'exactly one import map (browsers honour only one)').toHaveLength(1);
    const vue: string = JSON.parse(maps[0]).imports?.vue ?? '';
    // The host runs in dev mode, so the dev build (warnings, devtools) is mapped.
    expect(vue).toMatch(/\/silverstripe-simpler\/client\/dist\/js\/vue\.esm-browser\.js(\?|$)/);
    const res = await request.get(vue);
    expect(res.status(), `GET ${vue}`).toBe(200);
    expect(await res.text()).toContain('createApp');
});
