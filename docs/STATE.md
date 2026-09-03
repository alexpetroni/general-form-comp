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

### Verification run, review round 1 (2026-09-03, project root)

- `npx svelte-kit sync && npx svelte-check --tsconfig ./tsconfig.json
  --fail-on-warnings` → 262 files, **0 errors, 0 warnings**.
- `npm run test:unit` → 7 files, **129 passed** (unchanged; round 1 added
  browser cases only).
- `npx playwright install chromium && CI=1 npm run test:e2e` → **34 passed**
  (33 + the home-page inline-group case; the likert case gained the marker
  assertion), fresh build on port 4322. Run against the unfixed build first:
  the two changed cases failed exactly as the review described (no
  `aria-invalid` on "Usual bedtime"; no marker in the likert rows).
- `npm run package` → succeeds (pre-existing `import.meta.env` advisory);
  `dist/components/core/GroupRenderer.svelte` passes `warning` /
  `describedBy` in both the inline and the individual branch.

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

## PHASE-2 — Likert: standalone rendering and accessible names; config sanity checks

**Closed by PHASE-2:** R-1 (standalone likert renders), R-7 (likert accessible
names and row grouping), R-13 (the `validateConfig` checks only — the
discriminated `Question` union stays in the backlog).

### What changed

- **Standalone likert (R-1)**: `QuestionRenderer.svelte` gained a `'likert'`
  branch that renders `<LikertGroup questions={[question]} {warning}
  class={question.class} />`. `LikertGroup` reads the answer from context and
  already honoured `question.optionClass`, so no new plumbing; the scale header
  shows for a single question because it is derived from `questions[0]`.
  `all-inputs` has a new optional group `likert-single` (question `remote`,
  five agreement options) on the `choice` step; the summary lists it.
- **Likert accessibility (R-7)**, `LikertGroup.svelte`:
  - the option label span is `sm:sr-only` instead of `sm:hidden`, so on
    desktop the text is visually hidden but stays in the accessibility tree
    and remains each radio's accessible name; the `&bull;` span is
    `aria-hidden="true"`;
  - each statement row is `role="radiogroup"` with `aria-labelledby` →
    the statement cell, whose id is `formcomp-likert-<question.id>-statement`
    (PHASE-6 will prefix it per instance like the other ids). The radios of a
    row keep sharing `name={question.id}` so arrow keys stay within the row;
  - the desktop header row (`hidden sm:grid`) is `aria-hidden="true"`;
  - the `warning` ring, `class` and `optionClass` merging are unchanged. The
    radio input itself is still `sr-only` inside its label, like the scale and
    card options.
- **`validateConfig` (R-13)**, `src/lib/validation/config-check.ts`. The
  per-step index is now `Map<stepId, Map<questionId, Question>>` so
  comparison checks can see the target's type and options. New warnings:
  - (a) `checkStepSelfReference`: every simple condition nested in a step
    `condition` with no `stepId` or `stepId === step.id`;
  - (b) `equals` / `not-equals`: non-number value on `scale` / `number-input`;
    any value on `range`; non-boolean value on `consent`; otherwise, when the
    target has options, a value outside them;
  - (c) `includes` / `not-includes`: target not `multi-select`; value outside
    its options;
  - (d) `greater-than` / `less-than`: target not `scale` / `number-input`; in
    addition a non-number value on a numeric target (the evaluator compares
    numbers only — this is the "comparison value of the wrong type" case from
    the phase's problem statement, and is tested on its own);
  - (e) `Config has no steps`, `Step "s" has no groups`, `Step "s": group "g"
    has no questions`;
  - (f) `Step "s": likert-batch group "g" contains "q" of type t; every
    question in a likert batch must be likert`.
  (b)–(d) run only when the target question exists and the operator has a
  value; the existing "unknown step / question" and "without a value"
  warnings cover those cases, so one mistake yields one message.
- **Message prefixes**: group- and question-level conditions now read
  `Condition on group "g" in step "s" …` / `Condition on question "q" in step
  "s" …` (question ids are only unique per step). Step-level stays
  `Condition on step "s" …`. Existing tests match substrings and were not
  touched. The likert-batch option comparison now runs among the `likert`
  rows only, so a non-likert row produces (f) alone rather than (f) plus a
  "must share the same options" mismatch.
- **Docs**: README examples table (`likert`, `all-inputs`), `renderMode`
  table (`individual` renders a likert as a one-row scale), the `QuestionType`
  likert row (standalone + radiogroup semantics), a rewritten "Config sanity
  checks" section listing the warning families, and `likert.spec.ts` in the
  project map. CHANGELOG Unreleased: Fixed (standalone likert, accessible
  names), Added (warnings, example, tests), Changed (message prefixes,
  batch-membership reporting).

### Tests

- `tests/unit/config-check.test.ts`: 40 new cases. A `withCondition()`
  helper builds a two-step config (step `a` holds a target of every relevant
  type, step `b` holds the conditioned question or the step condition). Every
  family has a positive case asserting the exact message with `toEqual([...])`
  and a neighbouring negative case asserting `[]`; unknown-target, unknown-step
  and valueless cases assert that only the pre-existing warning is emitted.
  `it.each(examples)` asserts `validateConfig(example.config)` is `[]` for
  every entry of `src/examples/index.ts`.
- `tests/likert.spec.ts` (6 Playwright cases): four radiogroups named by their
  statements with five radios each; `getByRole('radio', { name: 'Strongly
  agree', exact: true })` resolves to 4 and no radio is named "•"; the header
  is inside an `aria-hidden` element; one option per row then Submit logs the
  expected `allResponses`; ArrowRight moves within the row (shared `name`);
  three answered rows + Submit → `role="alert"` with the required message;
  at a 400px viewport the names still hold and the header is hidden;
  `all-inputs` shows the standalone likert on its step and the summary lists
  the statement with the chosen option label.
- Test-first sequence in `git log`: `51b06ab` (25 failing unit cases) →
  `60a38c2` (config-check); `8b86133` (6 failing browser cases) → `20888a0`
  (R-1) → `8c64b98` (R-7) → `5f4b327` (label activation in the spec, below).

### Commits

- `51b06ab` test(config-check): self-referencing step conditions, typed
  comparisons, structure, likert-batch membership (failing, R-13)
- `60a38c2` feat(config-check): warn on self-referencing step conditions,
  mismatched comparisons, empty structures, non-likert batch rows (R-13)
- `8b86133` test(e2e): likert rows are named radiogroups with labelled radios;
  standalone likert in all-inputs (failing, R-1, R-7)
- `20888a0` fix(inputs): render a likert question outside a likert-batch group (R-1)
- `8c64b98` fix(inputs): likert radios are named by their option label; each
  row is a radiogroup (R-7)
- `5f4b327` test(e2e): activate likert radios through their wrapping label
- (this commit) docs: README sanity checks and likert rows, CHANGELOG
  Unreleased, STATE.md PHASE-2

### Verification run (2026-09-03, project root)

- `npx svelte-kit sync && npx svelte-check --tsconfig ./tsconfig.json
  --fail-on-warnings` → 260 files, **0 errors, 0 warnings**.
- `npm run test:unit` → 6 files, **101 passed** (61 existing + 40 new in
  `config-check.test.ts`).
- `npx playwright install chromium && CI=1 npm run test:e2e` → **28 passed**
  (22 existing + 6 in `likert.spec.ts`), fresh build on port 4322. The new
  spec was also run before the fixes: all 6 failed (no radiogroup resolved;
  the standalone likert did not render).
- `npm run package` → succeeds (the pre-existing `import.meta.env` advisory
  remains); `dist/components/inputs/LikertGroup.svelte` carries
  `role="radiogroup"`, `dist/components/core/QuestionRenderer.svelte` the
  `'likert'` branch, `dist/validation/config-check.js` the new messages; no
  `$lib` / `$app` / `$examples` import in `dist/`. `dist/` stays gitignored.

### Decisions and notes for later phases

- **Activating likert radios in tests.** The phase text locates a radio via
  `getByRole('radiogroup', { name }).getByRole('radio', { name })`. The
  locator resolves as specified, but Playwright's `check()` on it fails the
  hit-target check because the input is `sr-only` inside its label (the
  bullet span "intercepts pointer events") — the same reason the existing
  scale/card tests click the label. The spec keeps the role/name locator and
  clicks the wrapping label (`locator('xpath=..')`), then asserts the radio
  is checked. I did not switch the input to an invisible overlay (which would
  make `check()` work natively): it is a different hiding technique from the
  sibling inputs and outside R-7's scope. Worth a backlog note if consumer
  e2e ergonomics matter.
- `equals` / `not-equals` on a **`multi-select` target** is not flagged as
  never-matching (the answer is an array; `===` against a string is always
  false). The phase's (b) enumerates the option-membership check for targets
  with options, which is what runs; a stricter rule belongs with the
  discriminated-union backlog item.
- PHASE-3 adds `warningIds` to `LikertGroup` for per-row rings; the row
  element to ring is the `role="radiogroup"` div. PHASE-6 prefixes ids:
  `formcomp-likert-<id>-statement` and the radio `name` are the two places.
- Nothing from the phase was deferred; nothing disagreed with.

## PHASE-3 — Honest validation and ARIA state

**Closed by PHASE-3:** R-5 (no silent clamping), R-6 (url half; email arrived
with PHASE-0), R-8 (ARIA state, required marker, per-question warning — the
tooltip stays with PHASE-6), R-22 (progress label), R-24 (misnamed e2e test).

### What changed

- **No clamping (R-5)**: `NumberInput.handleInput` and `RangeInput.parseField`
  store `parseFloat(raw)` as typed, `undefined` for empty or NaN. `min` /
  `max` / `step` stay on the elements. `questionStatus` is unchanged for
  numbers and now actually rejects; the browser test types `999` into
  `trip_length` (max 365), sees the default `invalidMessage`, `999` still in
  the field, then corrects to `14` and advances.
- **URL validation (R-6)**: `isValidUrl(value)` in
  `src/lib/validation/validator.ts` — `new URL(value.trim())` must parse and
  `protocol` must be `http:` or `https:`. `questionStatus` returns `'invalid'`
  for a non-empty malformed `text-input` with `inputType: 'url'`; empty and not
  required stays `'ok'` (the `isAnswered` early return precedes it, like
  email). Exported from the barrel. Note `new URL('https:example.com')` parses
  as `https://example.com/` (special-scheme quirk); not asserted either way.
- **Per-question warning (R-8)**: `GroupRenderer` derives `failingIds` —
  while the group is the warning group, the visible questions whose
  `questionStatus` is not `'ok'` — and passes `warning` / `describedBy` only to
  those. `LikertGroup` gained `warningIds?: string[]` (ring + `aria-invalid`
  on those rows only) and `describedBy`; its `warning` prop still rings the
  whole component for standalone use, and `QuestionRenderer`'s standalone
  `likert` branch uses it. The `inline` branch of `GroupRenderer` passes the same `warning` /
  `describedBy` as `individual` (it never passed `warning` at all, so inline
  groups had no per-question state; fixed in review round 1, see below).
  PHASE-6 still collapses the two branches.
- **ARIA state (R-8)**: every input component accepts `required?: boolean`
  and `describedBy?: string`. `QuestionRenderer` passes `question.required`
  and forwards `describedBy` (which `GroupRenderer` sets to the alert id for
  failing questions only). `QuestionGroupWrapper`'s `<p role="alert">` has
  `id="formcomp-group-{id}-alert"`; `GroupRenderer` builds the same string.
  `aria-required="true"` when required, `aria-invalid="true"` in warning,
  `aria-describedby` → the alert, on: `input` / `select` / `textarea`
  (TextInput, TextArea, SelectInput, NumberInput, both RangeInput fields,
  TimeInput, DateInput); each checkbox of CheckboxGroup; the ConsentCheckbox
  box; and, for radio-based inputs, the **`radiogroup`**: the `<fieldset
  role="radiogroup">` of RadioListGroup (role moved there from the inner
  options div), RadioCardGroup and ScaleInput, and each `role="radiogroup"`
  row of LikertGroup (`aria-required` from `question.required`).
- **Required marker (R-8)**: `FieldLabel` gained `required`; the marker is
  `<span aria-hidden="true" class="ml-0.5 text-sm font-medium
  text-(--form-error)">*</span>` rendered via a snippet. For `tag="legend"` it
  is inside the legend; for `tag="label"` it is a **following sibling** of the
  `<label>` (see Decisions). ConsentCheckbox wraps its FieldLabel in a `<div>`
  so label + marker stay one flex item next to the box.
- **Progress label (R-22)**: `FormSettings.progressLabel?: string` (default
  `'Progress'`); `ProgressBar` gained `label?: string = 'Progress'` and renders
  `aria-label={translate(label)}`; `MultiStepForm` passes
  `label={settings.progressLabel}` (Svelte applies the default for
  `undefined`).
- **Docs**: README Validation (items 4/5, new "Required and invalid state"
  subsection), "Email and URL validation" (renamed from "Email validation";
  no in-README anchors pointed at it), `FormSettings` block, `Question.required`
  comment, `QuestionType` rows for `number-input` / `range` / `text-input`,
  i18n defaults list, Development test summary, project map (new test files,
  `isValidUrl`, FieldLabel line), Exports. CHANGELOG Unreleased: Fixed (ARIA
  state + marker, per-question ring, url, progress label, the misnamed test),
  Changed (clamping — the entry the phase asked for; radiogroup role moves;
  new optional props), Added (`progressLabel`, `isValidUrl`, tests).

### Decisions (and where they deviate from the phase text)

- **Marker placement.** The phase puts the asterisk inside the label and
  names `getByLabel('Name', { exact: true })` as the canary. Playwright
  1.61's `getByLabel` matches the `<label>`'s *full text content*
  (`elementText`, which does not skip `aria-hidden`) and `exact` compares the
  normalized full text, so an asterisk inside the label turns "Name" into
  "Name *" and the canary fails — the phase's own test would have broken. The
  marker is therefore a following sibling of `<label>` elements (still
  "after the label text", still `aria-hidden`, and the accessible name is
  unchanged in every implementation, not only spec-following ones). For
  `<legend>` a sibling would render below the legend, so the marker is inside
  it; Playwright's role-name computation does honour `aria-hidden`
  descendants, and no test uses `getByLabel` on a fieldset (it never matches
  fieldsets). Visual order with a tooltip is "Label ⓘ *" — the tooltip stays
  inside the label until PHASE-6 reworks it (the round-0 review flagged the
  order as cosmetic; PHASE-6 renders the tooltip button after the marker).
- **Radio-based inputs carry the state on the radiogroup, not on each
  radio.** The phase says "each radio / checkbox of a group". ARIA 1.2 lists
  `aria-required` and `aria-invalid` for `radiogroup`, not `radio`, and
  svelte-check (`--fail-on-warnings`, part of the gate) rejects both on
  `<input type="radio">` (`a11y_role_supports_aria_props_implicit`) — and
  `aria-required` on a plain `<fieldset>` (role `group`). Suppressing the
  warning would have knowingly shipped invalid ARIA, so the fieldsets of
  RadioListGroup / RadioCardGroup / ScaleInput became `role="radiogroup"`
  (named by their legend, as before) and LikertGroup rows already were
  radiogroups. Checkboxes (CheckboxGroup, ConsentCheckbox) support both
  attributes and carry them individually, as specified. Asserted in
  `validation-aria.spec.ts` for a `single-select` and a likert batch.
- **`failingIds` is live**, derived from the answers, not a snapshot taken
  at Next: a corrected field drops its ring and `aria-invalid` at once, and a
  question that becomes visible-and-required inside the warning group is
  ringed at once; the group ring and message stay until the next attempt.
  Documented in the README; the radiogroup test asserts the immediate clear.
- **Likert statements show the marker too** (review round 1). LikertGroup
  does not use `FieldLabel`, so its statement cell renders the same
  `aria-hidden` asterisk when `question.required`. The row is named by that
  cell through `aria-labelledby`, and the accessible-name algorithm skips
  hidden descendants of a referenced element, so the row's name stays the
  statement (the likert browser test's exact-name lookup is the canary).
- `RangeInput`'s inner "From" / "To" `<label>`s are unchanged; the legend
  carries the marker and both fields carry the ARIA attributes.
- The `isAnswered`-based early return means a whitespace-only url/email is
  "missing" when required and "ok" when optional — same as email in PHASE-0.
- The old email unit case "does not apply to plain text or url inputs"
  asserted `url` + `'not-an-email'` → `'ok'`, i.e. it encoded the absence of a
  url rule. It now uses a well-formed url (the intent: the email pattern must
  not reject a url input). Stated in the test commit message.

### Review round 1 (2026-09-03)

The round-0 review failed the ARIA DoD item on one HIGH finding and added two
LOW notes:

- **HIGH — inline groups had no per-question state** (`GroupRenderer.svelte`,
  inline branch). Confirmed: `<QuestionRenderer {question} />` without
  `warning` / `describedBy`, so the home page's inline "Sleep Schedule" group
  showed the alert but no `aria-invalid`, no `aria-describedby`, no ring.
  Fixed by passing the same two props as the individual branch (`d3ed12e`);
  the collapse of the two branches stays with PHASE-6 as planned. Browser
  test on `/` (`2ea3e1d`, failing first): Next with nothing filled → both
  time inputs `aria-invalid` + `aria-describedby` → the alert id; filling
  bedtime clears its own state while wake time stays marked.
- **LOW — likert rows had no visible marker.** Fixed (`056e8de`): the
  statement cell renders the `aria-hidden` asterisk when required; asserted
  in the likert browser test (marker visible in each row, exact-name lookup
  intact).
- **LOW — marker order with a tooltip ("Name ⓘ *").** Deferred to PHASE-6
  by the reviewer's own first option: the tooltip becomes a button there and
  is rendered after the marker. Moving the `role="img"` span out of the label
  now would drop the tooltip text from the control's accessible name, which
  PHASE-6 replaces with a proper description; not worth an interim change.

### Tests

- Unit: `tests/unit/validator.test.ts` — `isValidUrl` table (7 accepted
  incl. uppercase scheme, port, query/fragment, surrounding whitespace; 12
  rejected incl. `ftp:`, `javascript:`, `mailto:`, `data:`, scheme-less,
  spaces, `https://`, empty/whitespace) and `questionStatus` url cases
  (required/optional × valid/invalid/empty, plain text untouched,
  `validateStep` reason `'invalid'`). `tests/unit/progress-label.test.ts` —
  `svelte/server` `render()` of `MultiStepForm` (default `'Progress'`,
  `settings.progressLabel` through translate, default through translate) and
  standalone `ProgressBar` (`label` prop, identity fallback). SSR render works
  in the node environment because vite-plugin-svelte compiles for the server
  there.
- Browser: `tests/multi-step-form.spec.ts` — the misnamed test is now
  "out-of-range number is kept as typed, rejected with the invalid message and
  exposed via ARIA" (spinbutton named exactly by its label, `aria-required`,
  `999` kept, alert text, `aria-invalid`, `aria-describedby` → the alert's id,
  correct to `14`, optional Follow-up email has no `aria-required`).
  `tests/validation-aria.spec.ts` (6 cases): Follow-up `not-an-email` →
  alert + `aria-invalid` + `aria-describedby`, fixed → submitted payload;
  all-inputs Name marker + canary, Email none, `getByRole('textbox', { name:
  'Email', exact: true })`; customized Team size `600` with a valid range →
  custom `invalidMessage`, only Team size `aria-invalid` / `aria-describedby`,
  `50` → summary; conditional `traveling` radiogroup `aria-required` →
  `aria-invalid` after Next → cleared on answer; likert batch every row
  `aria-required` with a visible marker, only the unanswered row
  `aria-invalid`; home page (sleep-assessment, inline "Sleep Schedule") →
  both required time inputs `aria-invalid` / `aria-describedby` after Next,
  answering one clears only that one.
- Test-first in `git log`: `67d6729` (url, failing) → `13ad41b`; `2a34dc1`
  (progress label, failing) → `0aa57b8`; `9eae781` (6 browser cases, run
  against the unfixed build: all 6 failed — no aria attributes, clamping) →
  `f1d9ec9` (R-5) → `dec7568` (R-8).

### Commits

- `67d6729` test(validator): isValidUrl table and url questionStatus cases (failing, R-6)
- `2a34dc1` test(settings): progressLabel is translated into the progress nav label (failing, R-22)
- `13ad41b` feat(validator): validate inputType url with isValidUrl (R-6)
- `0aa57b8` feat(settings): progressLabel names the progress landmark through translate (R-22)
- `9eae781` test(e2e): out-of-range numbers are kept and rejected with ARIA state; email fix-up, required marker, per-question ring (failing, R-5, R-8, R-24)
- `f1d9ec9` fix(inputs): keep the typed number instead of clamping it to min/max (R-5)
- `dec7568` feat(a11y): expose required/invalid state, add a required marker, ring only the failing questions (R-8)
- `0d1c3ea` docs: README validation/ARIA/progressLabel/isValidUrl, CHANGELOG Unreleased, STATE.md PHASE-3
- `2ea3e1d` test(e2e): inline groups expose per-question invalid state; likert rows show the required marker (failing, R-8) — round 1
- `d3ed12e` fix(a11y): inline groups pass warning and describedBy to their failing questions (R-8) — round 1
- `056e8de` feat(a11y): likert rows show the visible required marker in their statement cell (R-8) — round 1
- (this commit) docs: CHANGELOG/README/STATE for review round 1

### Verification run (2026-09-03, project root)

- `npx svelte-kit sync && npx svelte-check --tsconfig ./tsconfig.json
  --fail-on-warnings` → 262 files, **0 errors, 0 warnings**.
- `npm run test:unit` → 7 files, **129 passed** (101 existing + 24 url + 4
  progress label).
- `npx playwright install chromium && CI=1 npm run test:e2e` → **33 passed**
  (28 existing incl. the rewritten one + 5 in `validation-aria.spec.ts`),
  fresh build on port 4322.
- `npm run package` → succeeds (the pre-existing `import.meta.env` advisory
  remains); `dist/index.d.ts` exports `isValidUrl`, `dist/types.d.ts` has
  `progressLabel`, `dist/components/inputs/LikertGroup.svelte.d.ts` has
  `warningIds` / `describedBy`, every input in `dist/components/inputs/`
  renders `aria-required`; no `$lib` / `$app` / `$examples` import in `dist/`.

### For the next phases

- **PHASE-6 ids**: the alert id is built in two places — `QuestionGroupWrapper`
  (`formcomp-group-{id}-alert`) and `GroupRenderer` (`alertId`) — and the group
  id in a third (`MultiStepForm.handleNext` scroll). Prefix all three together
  with `formId`.
- **PHASE-6 tooltip**: the info icon stays inside the label; the required
  marker is a sibling *after* the label, so the order is "Label ⓘ *". If the
  tooltip button moves out of the label, put it after the marker.
- **PHASE-6 inline merge**: `inline` and `individual` now render identical
  markup including the per-question ring / `aria-invalid`; the merge is a pure
  de-duplication.
- `LikertGroup`'s `warning` (whole-component ring) and `warningIds`
  (per-row ring) are independent; `rowWarning = warning || in warningIds`
  drives the ARIA attributes.
- Deferred: only the marker/tooltip visual order (cosmetic, see Review
  round 1), which PHASE-6 resolves with the tooltip button. Deviations from
  the phase text (marker as a label sibling; radiogroup instead of per-radio
  attributes) are recorded above with their reasons; the tooltip half of R-8
  is PHASE-6's by plan.
