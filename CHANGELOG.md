# Changelog

## Unreleased

### Fixed

- Required and invalid state is exposed to assistive technology. The controls of a required question carry `aria-required="true"`; while a question is in warning its controls carry `aria-invalid="true"` and `aria-describedby` pointing at the group's `role="alert"` message, which now has the stable id `formcomp-group-<group id>-alert`. Radio-based inputs (`single-select`, `scale`, `likert`) carry the state on their `radiogroup` — the fieldset, or the likert row — because ARIA 1.2 has neither attribute on the `radio` role; checkboxes carry it individually. Required questions show a red asterisk after the label; it is `aria-hidden` and, next to a `<label>`, a following sibling rather than a child, so accessible names are unchanged. Likert rows show the marker in their statement cell.
- Only the questions that actually fail get the red field ring (and `aria-invalid`) in the warning group; before, every question in the group was ringed. `GroupRenderer` evaluates `questionStatus` per visible question and `LikertGroup` takes `warningIds` so a batch marks failing rows only. This holds for every render mode: `inline` groups, whose questions never received the warning at all, now get the same per-question state as `individual` ones. The ring follows the live answer; the group ring and message stay until the next attempt.
- `inputType: 'url'` is validated: a non-empty value must be an absolute `http:`/`https:` URL, otherwise the question is *invalid* like a malformed email. `isValidUrl` is exported.
- The progress header's `<nav aria-label>` goes through `translate` (new `settings.progressLabel`, default `'Progress'`) instead of a hardcoded English string.
- The browser test "out-of-range number blocks progression" tested the empty-required path (the input clamped, so an out-of-range value could not be typed); it is now a real out-of-range test that also asserts the ARIA state.
- A `likert` question outside a `likert-batch` group now renders (a one-row scale with its own header) and can be answered. `QuestionRenderer` had no `'likert'` branch, so such a question rendered nothing and, when `required`, blocked the step forever with the error pointing at an empty group.
- Likert accessibility: every radio's accessible name is its option label at every viewport (on desktop the label text is visually hidden with `sr-only` instead of `display:none`; the bullet is `aria-hidden`), each statement row is a `radiogroup` named by its statement (`aria-labelledby`), and the desktop scale header is `aria-hidden`. Before, desktop radios were all named "•" and the statement was never announced.

### Changed

- Number and range inputs no longer clamp to `min`/`max`; out-of-range values fail validation with `invalidMessage`. `NumberInput` and `RangeInput` store the parsed number as typed (`undefined` for empty or not a number); `min`, `max` and `step` remain on the elements as hints for the native spinner. Before, typing 999 for a 1–365 field silently became 365 and the invalid path was reachable from the UI only through an inverted range.
- `RadioListGroup`'s `role="radiogroup"` moved from the inner options container to its `<fieldset>`; the fieldsets of `RadioCardGroup` and `ScaleInput` are `role="radiogroup"` too (named by their legend), so required/invalid state has a valid home.
- Input component props: every input accepts `required?: boolean` and `describedBy?: string`; `LikertGroup` adds `warningIds?: string[]`; `QuestionRenderer` accepts `describedBy`; `FieldLabel` accepts `required`; `ProgressBar` accepts `label`. All optional, defaults preserve the previous markup apart from the additions above.
- `validateConfig` message prefixes for group- and question-level conditions now name the step too (`Condition on question "q" in step "s" …`). A non-`likert` question inside a `likert-batch` group is reported by its own warning instead of as a "must share the same options" mismatch; option sets are compared among the likert rows only.
- `createFormState` defaults the persistence `version` to `config.version`; pass the option only to override it. A config that carries a `version` now invalidates in-progress answers persisted under another version even when the caller does not forward it (the examples route did not).
- `package.json` metadata: `description`, `license` (BSD-3-Clause), `repository`, `homepage`, `bugs`, `keywords`, `engines.node >= 20`, `sideEffects` limited to CSS, a `./package.json` export, and `CHANGELOG.md` is shipped with the package. The version is unchanged.
- The demo favicon moved from `src/lib/assets/` to `static/`; it no longer ships in the package (`dist/assets/` is gone).
- The demo home page renders the `sleep-assessment` example instead of an inline copy of its config.

### Added

- `settings.progressLabel` (accessible name of the progress `<nav>`, default `'Progress'`, translated) and `isValidUrl(value)`.
- Tests: `tests/validation-aria.spec.ts` (malformed email rejected and corrected through the UI; the required marker leaves `getByLabel('Name', { exact: true })` intact while the optional Email shows none; `customized` Team size 600 marks only that field invalid; required/invalid state on a radiogroup; per-row state in a likert batch), the rewritten out-of-range number test, `isValidUrl` and url `questionStatus` unit cases, and `tests/unit/progress-label.test.ts` (server-rendered `MultiStepForm` / `ProgressBar`).
- `validateConfig` warns about a whole family of config mistakes the runtime cannot recover from: a step `condition` that resolves to the step itself; `equals` / `not-equals` with a non-number value on a `scale` or `number-input`, a non-boolean value on a `consent`, any value on a `range`, or a value outside the target's option values; `includes` / `not-includes` on a non-`multi-select` target or with a value outside its options; `greater-than` / `less-than` on a non-numeric target or with a non-number value; empty `steps`, a step without groups, a group without questions; a non-`likert` question in a `likert-batch` group. Checks are skipped for unknown targets and valueless operators, which existing warnings already cover.
- The `all-inputs` example has a standalone `likert` question; a unit test asserts every shipped example validates without warnings; `tests/likert.spec.ts` covers likert radiogroups, names at desktop and mobile viewports, arrow keys, submission, the required-row alert and the standalone likert.
- Unit tests can import rune modules: the Vitest config compiles `*.svelte.ts` through the Svelte plugin, and a test opts into jsdom per file. `createFormState` (buckets, navigation bounds, debounced persistence, hydration, version invalidation, index clamping, corrupt storage) is covered by `tests/unit/form-state.test.ts`.
- Browser tests for the demo shell: favicon, home page and the `sleep-assessment` route.
- README "Project structure" lists every file under `src/lib/`, `src/examples/`, `src/routes/`, `static/` and `tests/`.

## 0.3.0 — 2026-08-20

Upstreamed from the consumer project's vendored copy on 2026-09-03.

### Added

- **Email-format validation**: a `text-input` question with `inputType: 'email'` now rejects non-empty values that don't match a conservative pattern (one `@`, non-empty local part, domain with a dot) with `reason: 'invalid'` — the same red-ring/scroll UX as out-of-range numbers. Empty + not required stays valid. `isValidEmail` is exported.
- **`consent` question type**: a single checkbox whose answer is a boolean; when `required`, only `true` validates (GDPR "this specific box must be ticked"). Rich consent text goes in the question's `label`, rendered next to the box by the new `ConsentCheckbox` component. `formatAnswer` renders `'Yes'` (a translate key) / `'—'`; `validateConfig` warns when a consent question carries `options`.
- **Opt-in honeypot** (`settings.honeypot: true`): renders a visually-hidden text input (off-screen, `aria-hidden`, `tabindex="-1"`, `autocomplete="off"` — not `display:none`). A filled honeypot at submit time shows the normal success state without POSTing and without firing the submit callbacks. The payload always carries `honeypot: { field, value }` (field name `HONEYPOT_FIELD` = `'website'`) so a server can reject independently — including when the key is absent entirely.
- `lead-capture` example combining all three features, with browser tests.

## 0.2.1 — 2026-07-02

### Added

- **`customized` example** (Settings & styling): every `FormSettings` label and message, summary customization (`summaryLabel` / `editLabel`), submit error handling, and `class` / `optionClass` styling hooks at all config levels.
- **`kiosk` example** (linear flow): `showProgress: false` + `allowBackNavigation: false`.
- `conditional` example now also demonstrates the `greater-than` and `answered` operators and `inputType: 'email'`.
- README: i18n section with `translate` wiring, `success` snippet documented in the props table, feature-indexed examples table.
- Browser tests for the two new examples, including the `invalidMessage` path via an inverted range.

### Fixed

- Props table typed the `state` prop as `FormStateAdapter`; it is `FormStateController`.

## 0.2.0 — 2026-07-02

### Added

- **Result submission**: `FormConfig.submit` POSTs the results as JSON on submit, with a loading state, in-place error message + retry, and callbacks (`onSubmitSuccess` / `onSubmitError`).
- **Stable answer identity**: `Question.uuid` — each payload answer carries `{ uuid, questionId, stepId, type, label, value, displayValue }`, so backends key on `uuid` and stay compatible across quiz revisions. `validateConfig` warns on duplicate uuids.
- **Post-submit flow**: server `redirectUrl` → config `submit.successUrl` → built-in in-place success screen (server `title`/`message` override `settings.successTitle`/`successMessage`); or a fully custom `success` snippet on `MultiStepForm`.
- `FormConfig.version`: stamped into the payload and used to invalidate persisted in-progress answers.
- Exported `buildSubmitPayload` and `formatAnswer`.

## 0.1.0 — 2026-07-02

First coherent release of the config-driven multi-step form library.

### Added

- **Step skipping**: `StepConfig.condition` hides whole steps from navigation, the progress header, validation, and the submitted payload.
- **`FormConfig.settings`**: `showProgress`, `allowBackNavigation`, `showSummary`, `summaryLabel`, `editLabel`, `nextLabel`, `backLabel`, `submitLabel`, `requiredMessage`, `invalidMessage`.
- **Summary screen** (`settings.showSummary`): read-only recap of all visible answers with per-step edit links before submitting.
- **New question types**: `select` (native dropdown), `date-input`, and `range` (from–to interval, stored as `{ from, to }`).
- **Question extras**: `tooltip` (info icon next to the label), `inputType` (`text` / `email` / `url` for text inputs), group-level `intro`.
- **Condition operators**: `greater-than`, `less-than`, `answered`, `not-answered`.
- **Styling system**: `--form-*` CSS variables (shipped as `formcomp/theme.css`, including a `.dark` block) plus `class` / `optionClass` hooks at every config level.
- **Config sanity checks**: `validateConfig` runs in dev and warns about duplicate ids, missing options, mismatched likert batches, and broken condition references.
- `createFormState` options: `version` (discards persisted state from older config versions).
- Accessibility: visible keyboard-focus rings on scale/likert/card options, focus moves to the step heading on navigation, validation errors announced via `role="alert"`, native `<form>` semantics with Enter-to-advance.
- Tests: Vitest unit suite for the condition/validation engine, Playwright browser suite for skip/clear/validation/summary/submission flows. CI workflow.

### Changed

- Removed shadcn-svelte/bits-ui/lucide; components are pure Tailwind v4 on native elements with zero runtime dependencies beyond `clsx` + `tailwind-merge`.
- `onFormComplete` receives only visible answers (`collectResponses`); answers to hidden questions are cleared reactively.
- `allowBackNavigation: false` now disables the Back button as well as progress-header clicks.
- `onStepComplete` also fires for the final step.
- Validation distinguishes missing answers from invalid (out-of-range) ones, with separate messages.

### Removed

- `LayoutHint.gridWith` (was never implemented).
