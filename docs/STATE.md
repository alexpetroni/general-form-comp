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

## PHASE-4 — Submission lifecycle: reset, storage cleanup, callback transport, error detail

**Closed by PHASE-4:** R-3 (`reset()`, persisted state cleared after
success), R-4 (callback transport without `config.submit`), R-26
(`SubmitError`).

### What changed

- **`reset()` (R-3)**, `src/lib/state/form-state.svelte.ts`: responses back
  to one empty bucket per step (`emptyBuckets()`, shared with the initial
  state), index 0, the pending debounced save cancelled (`clearTimeout`), and
  the storage entry removed **synchronously** with `removeItem` — no save is
  scheduled by the reset itself, so nothing re-persists the entry.
  `persist: false` resets in memory and never touches storage.
  `FormStateController` declares `reset?(): void` (optional, so external
  controllers keep compiling); `createFormState`'s return type carries a
  non-optional `reset(): void`.
- **Reset after success (R-3)**, `MultiStepForm.svelte`: `succeed(payload,
  response, text?)` captures `successPayload` / `successResponse` /
  `successText`, sets `submitState = 'succeeded'`, then calls
  `formState.reset?.()`; `redirectTo(url)` resets **before**
  `window.location.assign`. Used by all three success exits: POST 2xx (with
  or without redirect), the honeypot drop (with or without `successUrl`) and
  the callback transport. The success screen and the `success` snippet render
  from the captured values. A failed POST or a rejected callback resets
  nothing. The hidden-answer clearing effect in `GroupRenderer` only writes
  when a value is defined, so it cannot re-persist after a reset.
- **Callback transport (R-4)**: `submitForm` sets `submitState =
  'submitting'` first (Submit disabled + `aria-busy` via
  `NavigationButtons`), builds the payload, then awaits
  `onFormComplete(collectResponses(...))` when `completed` is not yet set.
  `completed = true` only after the callback settles successfully.
  - resolved + `config.submit` → honeypot check → POST, as before;
  - resolved + no `config.submit` → `succeed(payload, resolvedValue ?? null)`
    with the `settings.successTitle` / `successMessage` text (a resolved
    object does *not* override the text the way a server body does);
    `onSubmitSuccess` is not fired (documented);
  - rejected (either case) → `submitState = 'idle'`, `submitError =
    settings.submitErrorMessage ?? default`, `onSubmitError(reason)`,
    `completed` stays `false` so the next Submit calls the callback again;
    nothing is reset.
  `FormCallbacks.onFormComplete` is `(allResponses) => void |
  Promise<unknown>` (a widening; existing `void` callbacks are unchanged).
- **`SubmitError` (R-26)**, `src/lib/submission.ts`, exported from the
  barrel: `class SubmitError extends Error { status: number; data: unknown }`,
  `name = 'SubmitError'`, message `Request failed (<status>)` (unchanged
  text). Non-2xx responses reach `onSubmitError` as
  `new SubmitError(res.status, data)` where `data` is the parsed JSON body or
  `null`; network failures and callback rejections pass through as received.
- **Demo** (`src/routes/examples/[slug]/+page.svelte`): `onFormComplete`
  keeps its `console.log('Form completed!', …)` and `alert`, then returns a
  promise that settles after 300 ms; with `?fail=once` the first call rejects
  with `new Error('demo failure')` and later calls resolve (module-level
  `failedOnce`). `onSubmitError` logs `Submit failed <status> <data>` for a
  `SubmitError`, `Submit failed <error>` otherwise. The home page callbacks
  are unchanged (the sleep-assessment config has no `submit`, so Submit there
  now shows the built-in success screen right away).
- **Docs**: README Props (`success`), Callbacks (return type + paragraph),
  State management (`reset()`, `FormStateController` block mirroring
  `types.ts`), Anti-spam honeypot (state cleared), "After success" and
  "Without a submit endpoint" subsections, Errors (`SubmitError` example),
  `FormSettings.submitErrorMessage` comment (both README and `types.ts`),
  project map, Exports (`SubmitError`). CHANGELOG Unreleased: Fixed (persisted
  answers after success, dead Submit without an endpoint), Changed
  (`onFormComplete` awaited / may return a promise, `SubmitError` instead of a
  bare `Error`, optional `reset?()` on the controller, the demo callbacks),
  Added (`reset()`, `SubmitError`, callback transport, tests).

### Tests

- Unit, `tests/unit/form-state.test.ts` (`describe('reset')`, 5 cases):
  seeded entry + index 2 → `reset()` gives `FRESH` buckets, index 0,
  `currentStepId 'one'`, an unknown bucket reads `{}`, and
  `sessionStorage.getItem` is `null` immediately (no timer advance); a
  `setResponse` + `nextStep` scheduled before `reset()` never fires
  (`Storage.prototype.setItem` not called after 1000 ms, entry still null);
  `persist: 'localStorage'` removes only that entry; `persist: false` calls
  neither `removeItem` nor `setItem`; the controller keeps persisting after a
  reset (`{ responses: { one: {}, two: { q2: 5 }, three: {} },
  currentStepIndex: 0 }`).
- Unit, `tests/unit/submission.test.ts` (`describe('SubmitError')`, 3 cases):
  `instanceof Error` / `SubmitError`, `name`, `status`, `data`, message;
  `null` data; the barrel export is a function identical to the class (the
  first version compared two `undefined`s and passed vacuously — tightened
  before committing).
- Browser, `tests/submission-lifecycle.spec.ts` (6 cases). Every case first
  waits until the example's entry actually contains the typed answer
  (`expect.poll`), so the "entry is null" assertions prove a removal, not a
  never-persisted state:
  1. minimal, POST 2xx → "Message sent!" → entry null, still null after a
     500 ms wait (longer than the 300 ms debounce) → reload → "Contact"
     heading, both fields empty, Submit enabled, entry null;
  2. minimal, `{ redirectUrl: '/examples' }` → after `waitForURL` the entry is
     null; going back to `/examples/minimal` finds empty fields;
  3. conditional (no `submit`), "No" path + email → Submit → button
     `disabled` + `aria-busy="true"` → "Thank you!" / "Your answers have been
     submitted." → Submit hidden → one `Form completed!` → entry null →
     reload → "Travel Preferences", no radio checked, textarea hidden, entry
     null;
  4. `/examples/conditional?fail=once` → Submit → `role="alert"` with the
     default message, Submit enabled without `aria-busy`, still on Follow-up
     with the email intact, one `Form completed!`, entry still holds the
     answers → Submit → "Thank you!", two `Form completed!`, entry null;
  5. minimal, POST 500 `{ message: 'Server exploded' }` → alert text, the
     console line `Submit failed 500 {message}` decoded through
     `msg.args()[i].jsonValue()` equals `{ status: 500, data: { message:
     'Server exploded' } }`, Full name intact, Submit enabled, entry intact.
     The pre-existing "failed POST shows an error and allows retry" test is
     untouched;
  6. lead-capture, filled honeypot → "You are on the list!", zero requests,
     entry null (also after 500 ms).
- Run against the unfixed component first (commit `443a5d7` on top of
  `cad3731`): all 6 failed as the review describes — the entry survived the
  POST, the redirect and the honeypot drop; Submit was never disabled without
  an endpoint; no alert after the rejection; `onSubmitError` received
  `[Error: Request failed (500)]` with no `data`.
- Test-first sequence in `git log`: `2863567` (reset, failing) → `4c0541c`;
  `2af276c` (SubmitError, failing) → `cad3731`; `443a5d7` (6 browser cases +
  demo support, failing) → `a28f33d`.

### Decisions (and where they deviate from the phase text)

- **`onFormComplete` still fires for a filled honeypot.** That was the 0.3.0
  order (callback first, then the honeypot check guards the POST only) and
  the phase says "continue with the POST as today"; unchanged. Without
  `config.submit` there is no honeypot branch — the callback transport runs
  and the success screen shows, which is what the bot would see anyway.
- **A synchronous throw from `onFormComplete`** is handled like a rejection
  (the `await` is inside the `try`). Before, it propagated out of the submit
  handler as an uncaught error.
- **`completed` after a failed POST** stays `true`, so a retry does not
  re-fire `onFormComplete` (unchanged behaviour); only a rejected callback
  leaves it `false`, as the phase requires.
- **Redirect**: the form stays mounted in the `submitting` state after the
  reset, so the fields render empty for the instant before the navigation.
  Not hidden — showing the success screen first would flash it — and the
  clearing effect writes nothing (all values are already `undefined`), so the
  entry stays gone; case 2 asserts it after the navigation.
- **The `success` snippet path** has no browser test (no demo passes a
  snippet). It renders from the same captured `successPayload` /
  `successResponse` as the built-in screen, whose post-reset rendering case 1
  asserts.
- **`waitForTimeout(500)`** appears three times in the new spec, always as a
  negative wait: the assertion after it is that the entry is *still* absent
  once the debounce window has passed.
- The 500-case callback assertion is a new test rather than an extension of
  the existing retry test, so that test stays byte-for-byte as it was.

### Commits

- `2863567` test(state): reset() empties responses and index, removes the
  entry synchronously, cancels a pending save (failing, R-3)
- `2af276c` test(submission): SubmitError carries status and data and is
  exported from the barrel (failing, R-26)
- `4c0541c` feat(state): reset() on createFormState and FormStateController
  (R-3)
- `cad3731` feat(submission): export SubmitError carrying the HTTP status and
  the parsed body (R-26)
- `443a5d7` test(e2e): persisted entry cleared after
  POST/redirect/callback/honeypot success; callback transport busy, success,
  error and retry; SubmitError reaches onSubmitError (failing, R-3, R-4,
  R-26) — includes the demo page support
- `a28f33d` fix(form): await onFormComplete as the transport, reset persisted
  state after every success, pass SubmitError to onSubmitError (R-3, R-4,
  R-26)
- (this commit) docs: README submission lifecycle / reset / SubmitError,
  CHANGELOG Unreleased, STATE.md PHASE-4, `submitErrorMessage` comment

### Verification run (2026-09-03, project root)

- `npx svelte-kit sync && npx svelte-check --tsconfig ./tsconfig.json
  --fail-on-warnings` → 263 files, **0 errors, 0 warnings**.
- `npm run test:unit` → 7 files, **137 passed** (129 existing + 5 `reset` +
  3 `SubmitError`).
- `npx playwright install chromium && CI=1 npm run test:e2e` → **40 passed**
  (34 existing, untouched, + 6 in `submission-lifecycle.spec.ts`), fresh
  build on port 4322. The new spec was run against the unfixed component
  first: all 6 failed (see Tests).
- `npm run package` → succeeds (the pre-existing `import.meta.env` advisory
  remains); `dist/index.d.ts` exports `SubmitError`, `dist/submission.js`
  defines the class, `dist/types.d.ts` has `reset?(): void` and the
  `void | Promise<unknown>` return type, `dist/state/form-state.svelte.d.ts`
  has `reset(): void`; no `$lib` / `$app` / `$examples` import in `dist/`.
  `dist/` stays gitignored.
- The whole gate was re-run once more on the final tree (after the
  `submitErrorMessage` comment edit) with the same results.

### For the next phases

- **PHASE-5 (`hydrate()`)**: `emptyBuckets()` is the pure initial state;
  `reset()` must keep removing the entry synchronously and must not schedule
  a save. `hydrate()` after a `reset()` finds no entry and is a no-op; the
  unit cases in `describe('reset')` construct with a seeded entry and will
  need a `hydrate()` call before the first assertions once construction stops
  reading storage.
- **PHASE-6 (R-23)**: `goTo` is unchanged; the two success exits are
  `succeed()` and `redirectTo()`, and `defaultSubmitError()` is the single
  fallback message.
- **PHASE-7**: the CHANGELOG Changed entries to carry into the release notes
  are the awaited `onFormComplete` (may return a promise; a rejection aborts)
  and `onSubmitError` receiving a `SubmitError`.
- Nothing deferred; nothing disagreed with.

## PHASE-5 — SSR-safe hydration of persisted state

**Closed by PHASE-5:** R-2 (reload mid-form hydrates the wrong step under
SSR).

### What changed

- **Construction is pure (R-2)**, `src/lib/state/form-state.svelte.ts`:
  `createFormState` no longer touches storage. The initial state is always
  `emptyBuckets()` and index 0, on the server and in the browser alike; the
  storage read moved into the new `hydrate()` — the only place `getItem`
  appears in the module. `hydrate()` keeps the existing rules (version
  match, index clamp against `config.steps.length`, corrupt JSON / storage
  errors ignored), assigns `responses` (persisted buckets spread over fresh
  empty ones) and `currentStepIndex` directly — no `scheduleSave` — and is
  idempotent through a `hydrated` flag: the first call in a browser does the
  work; later calls, and every call on the server (`typeof window ===
  'undefined'`) or with `persist: false`, return before reading anything, so
  answers given in the meantime are never overwritten. The return type of
  `createFormState` carries a non-optional `hydrate(): void`;
  `FormStateController` declares `hydrate?(): void` (optional, like
  `reset?()`, so external controllers keep compiling — a controller without
  it is simply not hydrated by the form).
- **Hydrate after mount (R-2)**, `MultiStepForm.svelte`: a `$effect` — not
  `$effect.pre` — calls `formState.hydrate?.()` and then
  `snapBackToVisibleStep()` inside `untrack()`, so nothing read in there
  becomes a dependency and the effect runs exactly once, after the DOM
  exists. Effects do not run on the server. The former top-level snap-back
  block became that function; it still moves the controller with
  `goToStep()` directly (not `goTo()`), so `onStepChange` is not fired and
  no focus moves on load. The three `svelte-ignore state_referenced_locally`
  suppressions of the old block are gone with it (function bodies are not
  init-time reads).
- **Ordering with the hidden-answer clearing effect** (`GroupRenderer`):
  whichever runs first, nothing is lost. Before hydration every answer is
  `undefined`, so the clearing effect has nothing to write; after hydration
  the restored state is self-consistent (it was persisted from a live state
  whose clearing effects had already run), so hidden questions carry no
  value either. `reset()` is unchanged: it still removes the entry
  synchronously and schedules no save; a `hydrate()` after it finds no
  entry.
- **Docs**: README State management (`hydrate()` in the snippet, the pure
  construction / idempotence paragraph, the **SSR** paragraph with the
  `{#if browser}` / `export const ssr = false` advice, `hydrate?()` in the
  `FormStateController` block plus the custom-controller note), project map
  (`form-state.svelte.ts`, the two new test files). CHANGELOG Unreleased:
  Fixed (R-2), Changed (state applied after mount; SSR behaviour; optional
  `hydrate?()` on the controller), Added (`hydrate()`, tests).

### Tests

- Unit, `tests/unit/form-state.test.ts`, `describe('hydrate')` (9 cases):
  construction with a seeded entry calls `Storage.prototype.getItem` zero
  times and yields `FRESH` / index 0, `hydrate()` calls it once with the key
  and restores responses + index; `hydrate()` schedules no save (`setItem`
  never called after 1000 ms, the entry is byte-for-byte what was seeded);
  idempotence — a second call after `setResponse` + `nextStep` reads nothing
  and overwrites nothing, even after the entry itself changed; `localStorage`
  variant; `persist: false` never reads (`getItem` not called); corrupt JSON
  does not throw and leaves the empty state; index 7 clamps to 2, index -3
  to 0; after `reset()` a fresh controller hydrates to the empty state. The
  existing restoration cases (`version` ×5, `reset` ×2, `persist: false`
  never reads or writes) now call `hydrate()` right after construction;
  their assertions are unchanged (the commit message says so).
- Unit, `tests/unit/form-state-server.test.ts` (node environment, no
  jsdom): `typeof window === 'undefined'`; construction gives the empty
  state; `hydrate()` does not throw and changes nothing; answers,
  navigation and `reset()` work in memory.
- Browser, `tests/ssr-hydration.spec.ts` (production preview, conditional
  example): "Yes" + "Mountains" → Next → Trip Details → wait until the entry
  holds `"currentStepIndex":1` → `page.reload({ waitUntil: 'commit' })`.
  (a) the reload's raw response body contains "Travel Preferences" and not
  "Trip Details"; (b) the hydrated DOM shows the "Trip Details" heading and
  the days field, "Travel Preferences" hidden; (c) Back → "Yes" and
  "Mountains" still checked; (d) no `pageerror`, no `console.error`. Plus
  the discriminating assertion: an `addInitScript` MutationObserver keeps a
  reference to the first `<h2>` the parser produces (the server-rendered
  heading); after the swap that node must be **disconnected with its text
  still "Travel Preferences"** — hydration kept it as-is and the effect
  replaced the step. Against the unfixed component the same node stayed
  connected with its text patched to "Trip Details" (Svelte resumes
  hydration after an `{#each}` / `{#if}` mismatch, so the step heading is
  hydrated over the server node and patched in place). Result on the
  unfixed tree: 1 failed, on that assertion only — received `{ connected: true, text: 'Travel Preferences', textNow: 'Trip Details' }`; (a) and (b) passed on the unfixed tree too, which is why they alone would not have reproduced the finding.
- Test-first sequence in `git log`: `aca79db` (unit, failing: 18 cases —
  `hydrate` missing, `getItem` called once during construction) →
  `eddde6a` (browser, failing on the unfixed component) →
  `1f438e0` (`hydrate()`) → `a517dde` (effect after mount).

### Dev-server probe (`docs/phases/reference/hydration-probe.mjs`)

`npx vite dev --port 5199 --strictPort` in the background, then
`node docs/phases/reference/hydration-probe.mjs http://localhost:5199`
(2026-09-04, fixed tree):

```
SSR heading      : Travel Preferences
Hydrated heading : Trip Details
Console after reload:
(nothing)
```

Note for the reviewer: the probe's three lines are the same before and
after the fix — the review already recorded "no console warning" on the
unfixed tree, because Svelte repairs `{#if}` / `{#each}` mismatches and
patches text silently (only a missing hydration marker logs
`hydration_mismatch`). The probe therefore proves "no warning + persisted
step shown" as the phase asks, while the browser test's heading-identity
assertion is what actually distinguishes a clean hydration from the old
in-place patch.

### Decisions

- **The visible swap stays.** The server cannot know the persisted step, so
  step 1 paints and the persisted step swaps in after mount; that is the
  documented behaviour, with the client-only rendering advice for consumers
  who want no swap. No focus is moved by the swap (only user navigation
  calls `focusStepStart`).
- **`hydrate()` on the server does not consume the first call** — it
  returns before setting the flag, so a controller constructed and
  "hydrated" in a server-only code path is not marked hydrated. Irrelevant
  in practice (a controller instance never crosses from server to client)
  but the cheaper invariant to document.
- **Snap-back persists the corrected index** (via `goToStep`), as before.
- **Not touched**: `$effect.pre` was not used (it runs before the first
  client render and would reproduce the mismatch); `onMount` would work as
  well but the phase names `$effect`.

### Commits

- `aca79db` test(state): hydrate() applies the persisted entry after a pure
  construction — no storage read in the constructor, idempotent, no save
  scheduled, version/clamp/corrupt-JSON rules, persist:false and server
  no-ops (failing, R-2) — 18 cases failed on the unfixed module
- `eddde6a` test(e2e): reload mid-form under SSR — server body renders step
  1, hydrated DOM shows the persisted step, server heading replaced not
  patched, answers intact, no errors (failing, R-2)
- `1f438e0` feat(state): hydrate() on createFormState and
  FormStateController — construction is pure, the persisted entry is
  applied on the first call in a browser, no save scheduled (R-2)
- `a517dde` fix(form): apply persisted state from an $effect after mount so
  the first client render matches the server render; snap-back runs after
  hydration without firing onStepChange (R-2)
- (this commit) docs: README State management (hydrate(), SSR), project
  map, CHANGELOG Unreleased, STATE.md PHASE-5 with the probe output

### Verification run (2026-09-04, project root)

- `npx svelte-kit sync && npx svelte-check --tsconfig ./tsconfig.json
  --fail-on-warnings` → 265 files, **0 errors, 0 warnings**.
- `npm run test:unit` → 8 files, **143 passed** (137 before: the five
  `hydration` cases became nine `hydrate` cases, +2 in
  `form-state-server.test.ts`).
- `npx playwright install chromium` (the 177 MiB download hit one
  `ECONNRESET` and was retried; the headless shell landed in
  `~/.cache/ms-playwright/chromium_headless_shell-1228`) `&& CI=1 npm run
  test:e2e` → **41 passed** (40 existing, untouched, + 1 in
  `ssr-hydration.spec.ts`), fresh build on port 4322. The new spec was run
  against the unfixed component first: 1 failed on the heading-identity
  assertion (see Tests).
- `npm run package` → succeeds (the pre-existing `import.meta.env` advisory
  remains); `dist/types.d.ts` has `hydrate?(): void`,
  `dist/state/form-state.svelte.d.ts` has `hydrate(): void`, `getItem`
  occurs once in `dist/state/form-state.svelte.js` (inside `hydrate()`); no
  `$lib` / `$app` / `$examples` import in `dist/`; `dist/` stays gitignored.
- DoD grep: `grep -n getItem src/lib/state/form-state.svelte.ts` → one hit,
  line 141, inside `hydrate()` (which starts at line 136).
- Probe: see above; the dev server (bound to IPv6 `localhost` only, which
  the probe's `http://localhost:5199` resolves fine) was stopped afterwards.

### For the next phases

- **PHASE-6 (R-23 and the API clean-up)**: the mount effect is the single
  place hydration and snap-back happen; `goTo()` remains the only path that
  fires `onStepChange`. `createFormState`'s public surface is now
  `hydrate()` + `reset()` on top of the controller interface; both are
  documented in the README `FormStateController` block.
- **PHASE-7**: CHANGELOG Changed entries to carry into the release notes —
  persisted state applied after mount (a consumer reading the controller
  synchronously after construction sees the empty state until `hydrate()`),
  and the optional `hydrate?()` on `FormStateController`.
- Nothing deferred; nothing disagreed with.
