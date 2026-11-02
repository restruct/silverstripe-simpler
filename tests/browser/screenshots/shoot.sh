#!/usr/bin/env bash
# Regenerate the README screenshots in docs/images/ against an existing Silverstripe 6 host.
#
#   tests/browser/screenshots/shoot.sh <host-dir> [port]
#
# The host is a Silverstripe 6 project with this module, lekoala/silverstripe-pure-modal ^2 and
# lekoala/silverstripe-cms-actions ^2 installed and a default admin admin/admin in its .env, as the
# browser-test runner builds it (see README.md next to this script). This script:
#   1. copies the screenshot fixtures (./fixtures) into <host>/app/src/ReadmeShowcase/,
#   2. builds the database (which seeds the demo products),
#   3. starts PHP's built-in server on the port (default 8902, this module's ss6 browser-test port),
#   4. runs the screenshot config, then stops the server again.
# Set PHP_BIN to pick the PHP binary (default: php on PATH).

set -euo pipefail

HOST="${1:?usage: $0 <host-dir> [port]}"
PORT="${2:-8902}"
PHP_BIN="${PHP_BIN:-php}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BROWSER_DIR="$(cd "$HERE/.." && pwd)"
HOST="$(cd "$HOST" && pwd)"

[ -f "$HOST/vendor/autoload.php" ] || { echo "no Silverstripe host at $HOST" >&2; exit 1; }

# 1. Fixtures: their own directory, so the browser-test fixtures the runner copies stay untouched.
mkdir -p "$HOST/app/src/ReadmeShowcase"
rsync -a --delete "$HERE/fixtures/" "$HOST/app/src/ReadmeShowcase/"

# 2. Database build (Silverstripe 6 sake).
(cd "$HOST" && "$PHP_BIN" vendor/bin/sake db:build --flush) >"$HOST/readme-shots-db-build.log" 2>&1 \
    || { tail -30 "$HOST/readme-shots-db-build.log" >&2; exit 1; }

# 3. Server. More than one worker, or the CMS deadlocks on its own parallel requests.
PHP_CLI_SERVER_WORKERS=4 "$PHP_BIN" -S "127.0.0.1:$PORT" -t "$HOST/public" "$BROWSER_DIR/router.php" \
    >"$HOST/readme-shots-php-s.log" 2>&1 &
SERVER=$!
trap 'kill "$SERVER" 2>/dev/null || true' EXIT
for _ in $(seq 1 60); do
    # ?flush=1: the web server keeps its own manifest cache, separate from the CLI's.
    curl -fs "http://127.0.0.1:$PORT/Security/login?flush=1" 2>/dev/null | grep -q 'name="Email"' && break
    sleep 0.5
done

# 4. Screenshots.
cd "$BROWSER_DIR"
[ -d node_modules/@playwright/test ] || npm ci --no-audit --no-fund
BROWSER_TARGET_URLS="ss6=http://127.0.0.1:$PORT" npx playwright test --config=screenshots/playwright.config.ts
