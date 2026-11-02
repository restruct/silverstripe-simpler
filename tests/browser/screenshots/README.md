# README screenshots

`readme.shot.ts` writes the PNGs in `docs/images/` that the module README shows. It is not a test
suite: it runs with its own config, `playwright.config.ts` in this directory, which the browser
tests and CI never load (their config, `../playwright.config.ts`, only looks in `../specs`), so a
normal test run never rewrites the images. Never edit the PNGs by hand; regenerate them.

The content comes from `fixtures/` here, not from the browser-test fixtures: a "Catalogue" admin
(`ShowcaseAdmin`) with six demo products (`ShowcaseProduct`, re-seeded on every database build),
using the module's GridField buttons, `EditProtectedTextField`, `SimplerModalField` and
`SimplerModalAction`. Like everything under `tests/browser/`, these classes never load in a real
install (`_manifest_exclude`, and `/tests` is export-ignored).

What it needs: a Silverstripe 6 host with this module, `lekoala/silverstripe-pure-modal:^2` and
`lekoala/silverstripe-cms-actions:^2` installed, and a default admin `admin` / `admin` in its
`.env`. That is the host the browser tests' shared runner builds for the `ss6` target, so in the
maintainers' workspace:

```bash
# Build (or reuse) the ss6 host and run the browser tests once
BROWSER_ONLY=ss6 tools/browser/run.sh silverstripe-simpler
# Then, from the module root: copy the fixtures in, build the database, start php -S, shoot
PHP_BIN=/path/to/php8.3 tests/browser/screenshots/shoot.sh ~/Library/Caches/ssmods-browser-hosts/silverstripe-simpler-ss6
```

`shoot.sh <host-dir> [port]` copies `fixtures/` to `<host>/app/src/ReadmeShowcase/`, runs
`sake db:build --flush`, serves the host with PHP's built-in server on the port (default 8902,
this module's `ss6` port in the runner's port registry) and runs this config. Against a host that
already has the fixtures and is being served, from `tests/browser/`:

```bash
npm ci
BROWSER_TARGET_URLS="ss6=http://127.0.0.1:8902" npx playwright test --config=screenshots/playwright.config.ts
```

The screenshots hide one thing only the test host has: the browser-test fixtures' menu entry
("Simpler browser test").
