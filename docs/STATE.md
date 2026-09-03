# STATE — per-phase notes for the 2026-09 remediation batch

## PHASE-0 — Upstream the vendored 0.3.0

**Closed by PHASE-0:** R-25 (vendored divergence), R-6 (email half), R-16
(svelte-check warnings).

### What was ported

`docs/phases/reference/vendored-0.3.0.patch` applied cleanly on HEAD with
`git apply` (HEAD had only moved by the docs-only commit `71d3507` since the
patch's base `e9f059b`). No hunks were rejected and nothing was hand-ported or
altered — the vendored semantics are in verbatim:

- **Email validation**: `isValidEmail` (pattern `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
  on the trimmed value) in `src/lib/validation/validator.ts`, exported from
  `src/lib/index.ts`. `questionStatus` returns `'invalid'` for a non-empty
  malformed `text-input` with `inputType: 'email'`; empty + not required stays
  `'ok'` (the `isAnswered` early-return precedes the email check).
- **`consent` question type**: `ConsentCheckbox.svelte` (new, exported),
  wired in `QuestionRenderer`; answer value is `boolean`; `required` ⇒ only
  `true` is `'ok'` (`false`/`undefined`/`'true'` are `'missing'`);
  `formatAnswer` renders `'Yes'` (translate key) or `'—'`; `validateConfig`
  warns when a consent question carries `options`.
- **Honeypot** (`settings.honeypot: true`): off-screen input in
  `MultiStepForm.svelte` (`absolute -left-[9999px]`, not `display:none`,
  `aria-hidden`, `tabindex="-1"`, `autocomplete="off"`), named
  `HONEYPOT_FIELD` = `'website'` (exported from `src/lib/submission.js` via
  `index.ts`). A filled honeypot shows the success flow (or navigates to
  `submit.successUrl`) without POSTing and without firing submit callbacks.
  `buildSubmitPayload` gained an optional 4th param `honeypotValue` and emits
  `payload.honeypot: { field, value }` whenever `settings.honeypot` is on.
- **svelte-check warning fixes (R-16)**: deliberate
  `svelte-ignore state_referenced_locally` suppressions for the documented
  mount-time captures (L-1 contract) in `MultiStepForm.svelte` and
  `FormStep.svelte`; `settings` became `$derived`.
- **`lead-capture` example** registered in `src/examples/index.ts` and the
  README examples table; README gained Email validation / Consent checkbox /
  Anti-spam honeypot sections and the updated exports list (13 inputs).
- **Tests (ported, not new)**: `tests/unit/email-consent-honeypot.test.ts`
  (17 cases), `tests/lead-capture.spec.ts` (4 browser tests).

### Reconciliation outside the patch

- `package.json` version → `0.3.0` (nothing else changed there).
- CHANGELOG 0.3.0 entry kept as ported, plus the line "Upstreamed from the
  consumer project's vendored copy on 2026-09-03." — note this line landed in
  the port commit together with the ported CHANGELOG entry, not in the bump
  commit.

### Commits

- `1611648` feat: upstream vendored 0.3.0 — email validation, consent type,
  honeypot (all 16 patch files, including the upstream-note line in
  CHANGELOG.md)
- `4ba2c47` chore: bump version to 0.3.0, note the upstream date in the
  changelog (package.json only, see note above)

### Verification run (2026-09-03, all from the project root)

- `npx svelte-kit sync && npx svelte-check --tsconfig ./tsconfig.json
  --fail-on-warnings` → 257 files, **0 errors, 0 warnings**.
- `npm run test:unit` → 5 files, **41 passed**.
- `npx playwright install chromium && CI=1 npm run test:e2e` → **19 passed**
  (15 existing + 4 in `lead-capture.spec.ts`), fresh build on port 4322.
- `npm run package` → succeeds; `dist/components/inputs/ConsentCheckbox.svelte`
  exists and `dist/index.d.ts` exports `ConsentCheckbox`, `isValidEmail`,
  `HONEYPOT_FIELD`. The packaging advisory about `import.meta.env` is
  pre-existing and expected (the mission requires the optional-chained
  `import.meta.env?.DEV`). `dist/` is gitignored, not committed.

### For the next phases

- Later phases build on this 0.3.0 code as-is; the `state_referenced_locally`
  suppressions document the mount-time-capture contract (L-1) — do not
  "fix" them into reactivity.
- `buildSubmitPayload`'s signature is now
  `(config, getResponse, translate?, honeypotValue?)`.
- Nothing was deferred and nothing disagreed with in this phase.

## PHASE-1 — Test harness for rune modules, repo hygiene

**Closed by PHASE-1:** R-20 (rune modules testable, form-state covered),
R-15 (the `version` default only — the shared storage-key default stays in
the backlog), R-17 (home page imports the example), R-18 (favicon out of
the package), R-19 (package metadata), R-21 (README project map). R-16
stays at zero warnings.

### What changed

- **Vitest harness**: `vitest.config.ts` now loads `svelte()` from
  `@sveltejs/vite-plugin-svelte` (it reads `svelte.config.js`, so
  `runes: true` applies), which compiles `*.svelte.ts` rune modules for unit
  tests. `jsdom` 30 is a devDependency. Tests default to the node
  environment; a DOM test opts in with `// @vitest-environment jsdom` as the
  first line (under jsdom Vitest uses the web transform, so `$state` compiles
  to the real client runtime, not the server stub). `include` is unchanged
  (`tests/unit/**/*.test.ts`).
- **`tests/unit/form-state.test.ts`** (20 cases, jsdom, fake timers): fresh
  buckets / index / `currentStepId` / `stepCount`; set/get/getStepResponses
  including an unknown step id; `nextStep` / `prevStep` / `goToStep` bounds;
  the debounced `{ responses, currentStepIndex, version }` entry, one save
  for two rapid writes, the index setter saving, `localStorage` writes;
  `persist: false` never calling `Storage.prototype.getItem/setItem`;
  hydration from both storages; corrupt JSON; index clamping (beyond and
  negative); version mismatch / match / absent; explicit option beating
  `config.version`; and the R-15 default. Storage spies go on
  `Storage.prototype` — spying on the `sessionStorage` instance would store a
  key under jsdom.
- **`createFormState` version default (R-15)**: `version = config.version`
  in the options destructuring. Test-first: `c609e9e` adds the failing case,
  `97399d2` the one-line fix. `MultiStepForm` still passes
  `{ version: config.version }` explicitly; the examples route (which passes
  only `storageKey`) now invalidates on config version bumps too. The
  `FormStateOptions.version` doc comment states the default.
- **`package.json`** (R-19): `description`, `license: BSD-3-Clause`,
  `repository`, `homepage`, `bugs`, `keywords`, `engines.node >=20`,
  `sideEffects: ["**/*.css"]`, `exports["./package.json"]`, and
  `files: ["dist", "CHANGELOG.md"]`. Version stays `0.3.0`.
- **Favicon** (R-18): `static/favicon.svg`; `+layout.svelte` links it with
  `asset('/favicon.svg')` from `$app/paths` (the `Asset` type is generated
  from `static/` by `svelte-kit sync`). `src/lib/assets/` is gone, so
  `dist/assets/` is gone.
- **Home page** (R-17): `src/routes/+page.svelte` is 37 lines and renders
  `sleepAssessmentConfig` from `$examples`. The inline copy differed from the
  example only by an ASCII `...` vs `…` in one placeholder. It keeps the
  default `formcomp-state` storage key (unchanged behaviour); the example
  route uses `formcomp-example-sleep-assessment`.
- **`tests/demo-pages.spec.ts`** (3 Playwright cases): favicon href resolves
  with `image/svg+xml`; `/` and `/examples/sleep-assessment` render the
  sleep form. Committed before the favicon/home-page commits.
- **README**: "Project structure" lists all 59 files under `src/lib`,
  `src/examples`, `src/routes`, `static`, `tests` (verified by a script that
  parses the block and diffs it against `find`); State-management snippet
  shows `version` defaulting to `config.version`; the Development paragraph
  mentions the state-controller unit tests.
- **CHANGELOG**: `## Unreleased` with Changed (version default, package
  metadata, favicon, home page) and Added (harness + tests, demo-shell
  browser tests, README map).

### Commits

- `f624811` test(harness): compile rune modules under Vitest, add jsdom
- `d725100` test(state): cover createFormState buckets, bounds, persistence, hydration
- `c609e9e` test(state): version defaults to config.version (failing, R-15)
- `97399d2` fix(state): default the persistence version to config.version
- `e574f26` chore(package): add license, repository, keywords, engines, sideEffects
- `b2c9fdb` test(e2e): demo shell serves the favicon and renders the sleep example
- `fe37049` refactor(demo): move the favicon out of the package into static/
- `8833a08` refactor(demo): home page renders the sleep-assessment example
- (this commit) docs: changelog Unreleased, README map and defaults, STATE.md

### Verification run (2026-09-03, project root)

- `npx svelte-kit sync && npx svelte-check --tsconfig ./tsconfig.json
  --fail-on-warnings` → 259 files, **0 errors, 0 warnings**.
- `npm run test:unit` → 6 files, **61 passed** (41 existing + 20 new).
- `npx playwright install chromium && CI=1 npm run test:e2e` → **22 passed**
  (19 existing + 3 in `demo-pages.spec.ts`), fresh build on port 4322.
- `npm run package` → succeeds (the pre-existing `import.meta.env` advisory
  remains); `dist/assets/` does not exist.
- `npm pack --dry-run` → 73 files: 69 under `dist/` plus `CHANGELOG.md`,
  `LICENSE`, `README.md`, `package.json`; no `assets/` entry.

### For the next phases

- PHASE-4/5 extend `tests/unit/form-state.test.ts`; keep the
  `// @vitest-environment jsdom` first line, the `Storage.prototype` spies
  and the fake-timer `beforeEach`/`afterEach`. The `makeConfig(version?)`
  helper builds a three-step config.
- PHASE-5 moves storage reads out of the constructor into `hydrate()`; the
  hydration/clamp/version cases here assert construction-time hydration and
  will need to call `hydrate()` first (the phase plan lists the new set).
- `npm install` runs `prepare` → `npm run package`, so `dist/` is rebuilt on
  every install; it stays gitignored.
- Deferred (backlog, per the phase text): the shared `formcomp-state`
  storage-key default (R-15 second half). Nothing disagreed with.
