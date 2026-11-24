# Yarn Resolutions

This file documents every entry in the `resolutions` block of `package.json`, every dependency decision taken because of a vulnerability, and every finding left open. Each entry answers three questions: **what is being pinned**, **why it exists**, and **when it can be removed**.

`package.json` doesn't allow comments, so this file is the only place that knowledge lives. **If you add or remove a resolution, update this file in the same commit.**

Based on the conventions of [dhis2-app-skeleton](https://github.com/EyeSeeTea/dhis2-app-skeleton/blob/master/RESOLUTIONS.md) and [data-approval-dev](https://github.com/EyeSeeTea/data-approval-dev/blob/master/RESOLUTIONS.md). Process: [internal wiki](https://github.com/EyeSeeTea/internal-know-how/wiki/Resolving-Dependency-Vulnerabilities).

## Conventions

- **`^` range or exact version?** A _floor_ ("never below this") takes a `^` range. Every entry below is a security floor, none is a compatibility fixture.
- **A floor names the version that fixes every advisory it covers.** It is the highest patched version across the advisories of the package, not the first one found.
- Prefer **per-parent** paths (`parent/child`) over standalone descriptors. Yarn only matches a standalone descriptor on exact text.
- **A versioned-parent path such as `execa@npm:0.7.0/cross-spawn` is keyed on the resolved version of the parent.** When the parent moves to another version it matches nothing and yarn does not warn. Re-check it at every audit.
- **Prefer re-resolution to a new constraint.** Most transitive findings were a stale lockfile: `yarn up -R <package>` reached the patched release with no manifest change. Resolutions are only for what that could not fix.
- **Every entry below was tested by removing it**, running `yarn install` and comparing the _resolved versions_ in `yarn.lock` (not the lockfile bytes), on 2026-11-23. Removing each one brought back at least one vulnerable version and raised the `yarn npm audit -R` count.

## Audit cadence

Re-audit the dependency tree monthly, before every release, and again immediately before requesting review on a change that claims a clean gate.

`yarn npm audit -R` is not the CI gate: **the gate follows Dependency-Track**. Measure there before concluding the app is clean, and never quote a before/after count that mixes sources.

| Source | Before | After |
|---|---|---|
| `yarn npm audit -R` (2026-11-23) | 190 advisories: 15 critical, 82 high, 70 moderate, 23 low | 8 advisories: 0 critical, 2 high, 5 moderate, 1 low |
| Dependency-Track, branch `chore/add-dependency-track-workflow` (first scan, 2026-11-23) | 232 alert instances: 15 critical, 94 high, 104 medium, 19 low | to be re-measured on the PR |

---

## Active resolutions

### Application dependencies

Verified against DHIS2 2.42.6 with the built app installed and with the dev server, running the whole smoke test (`/smoke-test-data-quality`): new report, configuration, outliers, validation (52 issues, 52 tracker imports), manual issue, status edit, export, dashboard actions, delete and the admin pages. The smoke test ran with PR #92 applied locally; without it the analysis page does not load (#88). The "Send feedback" flow and links inside issue descriptions are **not** exercised by it.

#### `axios: ^1.20.0`

- **Why:** four consumers request four incompatible lines: `@eyeseetea/d2-api@1.14.0` exactly `0.19.2`, `@eyeseetea/d2-api@1.21.0` exactly `1.6.4`, `@eyeseetea/feedback-component@0.3.0` `^0.27.2` and `@dhis2/cli-app-scripts` `^0.25.0`. A global entry makes them one copy.
- **Fixes:** 57 advisories (24 high, 31 moderate, 2 low) against `0.19.2`, `0.25.0`, `0.27.2` and `1.6.4`. The floor is `1.20.0`, the highest patched version on the 1.x line (GHSA-9fr6-4gfg-395g covers `>= 1.0.0, < 1.20.0`). It resolves to 1.21.1.
- **Drop when:** `@eyeseetea/d2-api`, `@eyeseetea/d2-logger` and `@eyeseetea/feedback-component` request `axios >= 1.20.0` and `@dhis2/cli-app-scripts` drops `axios@0.x`. Check with `yarn why axios -R`.

#### `lodash: ^4.18.0`

- **Why:** `@eyeseetea/d2-api@1.21.0` and `@eyeseetea/d2-ui-components@2.10.1` request `lodash` at exactly `4.17.21`. The application's own dependency is `^4.18.0`.
- **Fixes:** GHSA `>= 4.0.0, <= 4.17.23` (high) and `<= 4.17.22` (moderate). Resolves to 4.18.1.
- **Drop when:** every parent requests `lodash >= 4.18.0`. Check with `yarn why lodash -R`.

#### `qs: ^6.16.1`

- **Why:** `@eyeseetea/d2-api@1.21.0` requests `qs` at exactly `6.9.7` and `request` requests `~6.5.2`. The advisories end at `6.16.0`.
- **Fixes:** five advisories (moderate, and one low) against `6.5.5` and `6.9.7`: GHSA-6rw7-vpxm-498p, GHSA-4mjr-xmp4-gh2g, GHSA-6pq8-jhm2-2vcw and GHSA-w7fw-mjwx-w883. Resolves to 6.17.x.
- **Drop when:** every consumer requests `qs >= 6.16.1` natively. `@eyeseetea/d2-api` is the blocker.

#### `node-fetch: ^2.6.7`

- **Why:** `d2@31.10.2` → `isomorphic-fetch@2.2.1` requests `node-fetch@^1.0.1`. The advisory covers `< 2.6.7` (high).
- **Fixes:** GHSA on `node-fetch@1.7.3`. This crosses a major for `isomorphic-fetch@2.2.1`; the smoke test passed with it.
- **Drop when:** `isomorphic-fetch@2` leaves the tree or requests `node-fetch >= 2.6.7`.

#### `@eyeseetea/d2-ui-components/moment: ^2.31.0`

- **Why:** `@eyeseetea/d2-ui-components@2.10.1` requests a `moment` in `2.29.x`. GHSA-4p3w-j4w9-5jqw covers `>= 2.29.2, < 2.31.0` (moderate).
- **Drop when:** `@eyeseetea/d2-ui-components` requests `moment >= 2.31.0` natively.

#### `react-linkify/linkify-it: ^5.0.2`

- **Why:** `react-linkify@1.0.0-alpha` (through `@eyeseetea/d2-ui-components` and `@eyeseetea/feedback-component`) requests `linkify-it@^2.0.3`. Two high advisories cover `<= 5.0.1`.
- **Fixes:** the two advisories on `linkify-it@2.2.0`. This crosses three majors for `react-linkify`; **no test exercises links in rendered text**, so check it by hand where text with URLs is shown before relying on it.
- **Drop when:** `@eyeseetea/d2-ui-components` and `@eyeseetea/feedback-component` drop or replace `react-linkify`.

#### `log4js/flatted: ^3.4.2`

- **Why:** `log4js@4.5.1` requests `flatted@^2.0.0`. It is in the tree through `@eyeseetea/d2-logger@1.2.0-beta.1` → `@eyeseetea/d2-api@1.14.0`. Two high advisories cover `< 3.4.0` and `<= 3.4.1`.
- **Drop when:** `@eyeseetea/d2-logger` is upgraded to `1.3.0` (PR #92), which brings `@eyeseetea/d2-api@1.21.0` and takes `log4js` out of the tree.

#### `styled-jsx/loader-utils: ^1.4.2`

- **Why:** `styled-jsx@3.4.5` requests `loader-utils` at exactly `1.2.3`. `styled-jsx` has to stay: `@dhis2-ui/header-bar` imports `styled-jsx/style` as a peer dependency (`^3.2`), and without it `App.spec.tsx` fails with `Failed to load url styled-jsx/style`. The latest 3.x, `3.4.7`, still requests `1.2.3`.
- **Fixes:** one critical (`< 1.4.1`) and two high (`< 1.4.2`) advisories. The patch stays inside the 1.x line.
- **Drop when:** `@dhis2/ui` no longer needs `styled-jsx@3`.

### Build tooling: `@dhis2/cli-app-scripts` chain

None of these reach the browser bundle. They arrive with `@dhis2/cli-app-scripts@12.11.1`, which replaces the archived `@dhis2/d2-i18n-extract` and `@dhis2/d2-i18n-generate` (same decision as dhis2-app-skeleton #121). This repository only runs `d2-app-scripts i18n extract` and `i18n generate` (`extract-pot`, `localize`). With these entries `yarn localize` leaves `i18n/*.pot` and `*.po` unchanged.

#### `@dhis2/cli-app-scripts/vite: ^7.3.7`

- **Why:** `@dhis2/cli-app-scripts` requests `vite@^5.2.9` (5.4.21), a second copy next to the application's own `vite@^7.3.7`. Eight advisories cover `<= 6.4.3`.
- **Drop when:** `@dhis2/cli-app-scripts` requests `vite >= 7.3.7` natively.

#### `@dhis2/cli-helpers-engine/tar: ^7.5.21`

- **Why:** `@dhis2/cli-helpers-engine@3.2.2` requests `tar@^4.4.8` (4.4.19).
- **Fixes:** 13 advisories (1 critical, 8 high, 4 moderate). The floor is `7.5.21` because GHSA-r292-9mhp-454m covers `<= 7.5.20`. `tar` is only used to unpack project templates, which this repository never runs.
- **Drop when:** `@dhis2/cli-helpers-engine` requests `tar >= 7.5.21` natively.

#### `execa@npm:0.7.0/cross-spawn: ^6.0.6`

- **Why:** `execa@0.7.0` (through `term-size` → `boxen` → `update-notifier@3`) requests `cross-spawn@^5.0.1`. One high advisory covers `< 6.0.6`.
- **Versioned parent.** The path is keyed on `execa@0.7.0`; it stops applying silently if that version changes. Re-check at every audit.
- **Drop when:** `execa@0.7.0` leaves the tree.

#### `external-editor/tmp: ^0.2.6`

- **Why:** `external-editor@3.1.0` (through `inquirer@7`) requests `tmp@^0.0.33`. One high advisory covers `< 0.2.6` and one low `<= 0.2.3`. Resolves to 0.2.7.
- **Drop when:** `external-editor` requests `tmp >= 0.2.6`, or leaves the tree.

#### `http-proxy-agent/@tootallnate/once: ^2.0.1`

- **Why:** `http-proxy-agent@4.0.1` (through `jsdom@16.7.0` from `jest-environment-jsdom@27`) requests `@tootallnate/once@1` (resolves to 1.1.2). One low advisory covers `< 2.0.1`.
- **Drop when:** `http-proxy-agent@4` leaves the tree.

#### `latest-version/package-json: ^7.0.0`

- **Why:** `latest-version@5.1.0` (through `update-notifier@3`) requests `package-json@^6.3.0`, which pulls `got@9.6.0` (GHSA-pfrx-2q88-qq97, moderate, `< 11.8.5`). `package-json@7` requests `got@^11.8.2` (resolves to 11.8.6).
- **Drop when:** `latest-version` requests `package-json >= 7`, or `update-notifier@3` leaves the tree.

#### `request/form-data: ^2.5.6` and `request/tough-cookie: ^4.1.3`

- **Why:** `request@2.88.2` requests `form-data@~2.3.2` and `tough-cookie@~2.5.0`. `form-data` has one critical (`< 2.5.4`) and one high (`< 2.5.6`) advisory; `tough-cookie` one moderate (`< 4.1.3`).
- **Drop when:** `@dhis2/cli-helpers-engine` drops `request`.

#### `i18next-conv/node-gettext: ^3.0.1`

- **Why:** `i18next-conv@9.2.1` requests `node-gettext@^2.0.0`. One high advisory covers `<= 3.0.0`. `node-gettext` is on the `yarn localize` path; the `.po` files it produces did not change.
- **Drop when:** `i18next-conv` requests `node-gettext >= 3.0.1` natively, or drops it.

---

## Dependency decisions taken for the same round

These are changes to the direct dependencies, not resolutions. They are listed because the reason for each is not visible in the diff.

- **`@eyeseetea/d2-api` `1.14.0` → `1.21.0`.** The 1.21.0 release no longer ships `@eyeseetea/d2-api/2.36`; the imports now use `@eyeseetea/d2-api/2.41`, the same as data-approval-dev. The tracker responses are typed by their `fields`, `order` for tracked entities is a `TrackedOrderBase[]` (the request string is unchanged, `order=<attribute>:<direction>`), and pagination comes from `pager` through `getTrackerPagination`, identical to the helper in PR #92. Payloads that d2-api types do not accept (`attributes` on a tracked entity, `relationships` on an enrollment, audit fields on data values) are cast with a comment so what is sent does not change.
- **`@eyeseetea/feedback-component` `0.0.3` → `0.3.0`.** Removes a second `moment` copy. Not exercised by the smoke test.
- **`lodash` `4.17.21` → `^4.18.0`.** See the resolution above.
- **`@dhis2/d2-i18n-extract` and `@dhis2/d2-i18n-generate` replaced by `@dhis2/cli-app-scripts@12.11.1`.** The new generator does **not** make the app namespace the default one, so Spanish translations stopped applying (`Back` instead of `Volver`, found by comparing against the original build). `configI18n` in `Dhis2App.tsx` now calls `i18n.setDefaultNamespace("data-quality")` after the platform adapter has set `"default"`. Keep it in sync with `-n data-quality` in the `localize` script.
- **Toolchain: `vite ^7.3.7`, `vitest ^4.1.12`, `@vitejs/plugin-react ^5.1.0`, `vite-plugin-checker ^0.11.0`, Node 22 (`.nvmrc` `v22.22.2`).** Same lines as home-page-app-dev, Bulk-Load and dhis2-app-skeleton. `vite-plugin-eslint`, `@vitest/coverage-v8` and `bundle-phobia-cli` were removed because nothing uses them. The `test-unit` script no longer passes `--reporter=basic`, which vitest 4 does not have. The JS bundle grew from 3,317 kB to 4,323 kB with `vite 7` and the other changes of the round; this was not investigated.
- **`@babel/core` re-resolved with `yarn up -R`.** The lockfile held 7.22.20, below the fix for a low advisory.
- **`styled-jsx` kept.** See the `styled-jsx/loader-utils` entry.

---

## Known findings left open

Registry advisory data for the final tree, 2026-11-23: 0 critical, 2 high, 5 moderate, 1 low. Dependency-Track may score some of them higher; check there.

#### `xlsx@0.18.5`: GHSA-4r6h-8v6p-xvw6 (`< 0.19.3`) and GHSA-5pgg-2g8v-p4x9 (`< 0.20.2`), both high

- **Chain:** direct dependency (`xlsx@^0.18.5`).
- **Why it cannot be fixed:** `0.18.5` is the latest release on npm (last modified 2026-07-17). SheetJS publishes fixed releases only from its own site, not to npm, so no patched version is reachable from the registry. A resolution cannot help either. The same decision was taken in d2-autogen-forms and `EyeSeeTea/d2-tools#109`.
- **Exposure:** `xlsx` is imported in one place, `src/data/common/SpreadSheet.ts`, which only builds and writes a workbook (`book_new`, `book_append_sheet`, `write`) for the issues export. The application never reads a spreadsheet, so input from a third-party file does not reach it. Confirm against the text of each advisory that they concern parsing before accepting this for good.
- **Approval:** pending. Record the approver and the dismissed alert here.
- **Drop when:** SheetJS publishes a patched build to npm, or the export moves to another writer.

#### `uuid@3.4.0`: GHSA-w5hq-g745-h8pq (moderate)

- **Chain:** `@dhis2/cli-app-scripts` → `@dhis2/cli-helpers-engine@3.2.2` → `request@2.88.2` → `uuid@^3.3.2`.
- **Not reachable in this tree.** The advisory is a missing bounds check in `v3()`, `v5()` and `v6()` when the caller supplies an output buffer. `request` only requires the `uuid/v4` subpath (`lib/auth.js`, `lib/oauth.js` and `lib/multipart.js`) and calls it with no arguments (`uuid()`). Checked in `node_modules` on 2026-11-24: `uuid@3.4.0` is the only copy and `request` its only consumer.
- **Why it cannot be fixed:** the advisory is patched at 11.1.1, but the `uuid/v4` subpath was removed in uuid 7, so no version both fixes it and keeps what `request` imports. Forcing `request/uuid: ^11.1.1` fails at load with `ERR_PACKAGE_PATH_NOT_EXPORTED`, as recorded in [dhis2-app-skeleton](https://github.com/EyeSeeTea/dhis2-app-skeleton/blob/master/RESOLUTIONS.md).
- **Impact:** build tooling only. Dependency-Track scores it high; the GitHub advisory database rates it medium.
- **Why the gate counts it:** `@dhis2/cli-app-scripts` (and so `request` and `uuid`) enters the tree in this PR, replacing the archived `d2-i18n-extract` and `d2-i18n-generate`, so Dependency-Track reports alert [#234](https://github.com/EyeSeeTea/data-quality-extended-app/security/code-scanning/234) as new against the base.
- **Approval:** alert [#234](https://github.com/EyeSeeTea/data-quality-extended-app/security/code-scanning/234) dismissed as "won't fix" on 2026-11-24 by @xurxodev ([comment in #95](https://github.com/EyeSeeTea/data-quality-extended-app/pull/95#issuecomment-7123943458)), following the same decision on dhis2-app-skeleton [#735](https://github.com/EyeSeeTea/dhis2-app-skeleton/security/code-scanning/735), accepted and dismissed by @cgbautista ([comment in #121](https://github.com/EyeSeeTea/dhis2-app-skeleton/pull/121#issuecomment-6984611519)), and on data-approval-dev [#226](https://github.com/EyeSeeTea/data-approval-dev/security/code-scanning/226).
- **Drop when:** `request` leaves the tree.

#### `request@2.88.2`: GHSA-p8p7-x288-28g6 (moderate)

- **Chain:** `@dhis2/cli-app-scripts` → `@dhis2/cli-helpers-engine@3.2.2` → `request@^2.88.0`.
- **Why it cannot be fixed:** the advisory affects `<= 2.88.2`, the last release `request` published (deprecated).
- **Impact:** build tooling only; never reaches the browser bundle.
- **Drop when:** `@dhis2/cli-helpers-engine` drops `request`.

#### `elliptic@6.6.1`: GHSA-848j-6mx2-7j84 (low)

- **Chain:** `vite-plugin-node-stdlib-browser` → `node-stdlib-browser` → `crypto-browserify` → `browserify-sign` and `create-ecdh`.
- **Why it cannot be fixed:** the advisory covers every version `<= 6.6.1`, and 6.6.1 is the latest.
- **Impact:** the ECDSA signing path is not used by the application; the polyfills exist for the Node globals the dependencies expect.
- **Drop when:** `elliptic` publishes a fix, or the polyfill chain leaves the tree.

#### `log4js@4.5.1`: GHSA-82v2-mx6x-wq7q (moderate)

- **Chain:** `@eyeseetea/d2-logger@1.2.0-beta.1` → `@eyeseetea/d2-api@1.14.0` → `log4js@^4.5.1`.
- **Why it is not fixed here:** the fix is `log4js >= 6.4.0`, two majors up, in a logger that only the old `d2-api` copy uses. Forcing it on a parent that never tested it is the pattern that breaks consumers. The real fix is PR #92 (`@eyeseetea/d2-logger@1.3.0`), which removes that `d2-api` copy.
- **Drop when:** PR #92 is merged.

#### `glob@10.5.0`, `glob@11.1.0`: GHSA-3g3m-2fjr-6pw4. `minimatch@9.0.9`, `minimatch@10.2.6`: GHSA-g3hv-75wg-m249 (moderate)

- **Chain:** `glob@10` through `archiver-utils` and `glob@11` through `workbox-build`, both under `@dhis2/cli-app-scripts`. `minimatch@10` comes from `glob@11`, and `minimatch@9` from `glob@10` and from `typedoc@0.25.7` (direct dependency, `generate-docs` script).
- **Why it is not fixed here:** both are fixed only on a new major (`glob@14.0.2`, `minimatch@11.0.1`), and no released parent requests them. the latest `typedoc` requests `minimatch@^10.2.5`, still below the fix.
- **Impact:** build and documentation tooling only. The `minimatch` advisory needs an attacker-supplied pattern; every pattern here comes from the repository's own configuration.
- **Drop when:** each parent requests the patched major.
