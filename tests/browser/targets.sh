# Browser-test targets for this module, sourced by the shared runner
# (~/Sites/0_ss-mods-maintenance/tools/browser/run.sh) and by .github/workflows/browser-tests.yml
# once that is synced in. Plain bash assignments only. CI tests only the targets with an empty
# SS<n>_SRC_REF (= this checkout): on this branch that is both.
# Ports are assigned in ~/Sites/0_ss-mods-maintenance/tools/browser/PORTS.md; take new ones there.

BROWSER_PACKAGE="restruct/silverstripe-simpler"
BROWSER_TARGETS="ss5 ss6"

# This branch (main, 1.x) requires framework ^5 || ^6, so it serves BOTH majors (empty ref = the
# checkout the runner was given). The ss5 branch (0.3.x) serves ^4 || ^5; Silverstripe 4 is end of
# life and no longer tested here (README "Version compatibility"), so it is not a target.
SS5_RECIPE="^5"
SS5_PHP="8.3"
SS5_PORT="8901"
SS5_SRC_REF=""

SS6_RECIPE="^6"
SS6_PHP="8.3"
SS6_PORT="8902"
SS6_SRC_REF=""

# SimplerModalField / SimplerModalAction extend lekoala/silverstripe-pure-modal, which the module only
# suggests (README section 4), and SimplerModalAction posts through lekoala/silverstripe-cms-actions
# (doCustomAction), which pure-modal only suggests. The fixture's "puremodal" tab needs both.
SS5_EXTRA_REQUIRE="lekoala/silverstripe-pure-modal:^1.2 lekoala/silverstripe-cms-actions:^1.7"
SS6_EXTRA_REQUIRE="lekoala/silverstripe-pure-modal:^2 lekoala/silverstripe-cms-actions:^2"
