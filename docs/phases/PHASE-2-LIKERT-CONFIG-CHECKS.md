# PHASE-2 — Likert: standalone rendering and accessible names; config sanity checks

Review refs: R-1, R-7, R-13 (the checks only — the discriminated union stays in
`docs/phases/BACKLOG.md`). See `docs/REVIEW-2026-09-03.md`.

## Problem

`QuestionRenderer.svelte` has a branch for every `QuestionType` except `'likert'`: a
likert question in a default (`individual`) group renders nothing, and if it is
`required` the step can never be completed — with the error pointing at an empty group.
`LikertGroup.svelte` hides the option label with `sm:hidden` (display:none on desktop) and
shows `&bull;`, so on desktop every radio's accessible name is "•", and rows are not
grouped, so the statement is never announced. `validateConfig` misses a family of config
mistakes the runtime cannot recover from (self-referencing step conditions, comparison
values of the wrong type or outside the option set, empty structures, non-likert
questions in a likert batch).

## Deliverables

1. **Standalone likert renders** (R-1). `QuestionRenderer` gets a `'likert'` branch that
   renders `LikertGroup` with `questions={[question]}`, `warning` and
   `class={question.class}`. `LikertGroup` reads state from context, so no new plumbing;
   it must show the scale header for a single question and keep honouring
   `question.optionClass`.
2. **Likert accessibility** (R-7), in `LikertGroup.svelte`:
   - every radio's accessible name is its option label at every viewport: the label text
     stays in the DOM on desktop as `sr-only` (never `hidden`/`display:none`); the
     `&bull;` stays `aria-hidden`;
   - each question row is a group named by the statement: `role="radiogroup"` with
     `aria-labelledby` pointing at the statement element (or a `fieldset` + `legend`),
     radios in a row share one `name` so arrow keys move within the row;
   - the desktop header row is `aria-hidden` (its text is redundant with the radio names);
   - the `warning` ring keeps working.
3. **New `validateConfig` warnings** (R-13), one precise message each, naming the step /
   group / question ids involved. Existing warnings and the `string[]` return stay:
   a. a step `condition` (any simple condition nested in it) that resolves to the step
      itself — no `stepId`, or `stepId === step.id`;
   b. `equals` / `not-equals`: the target is `scale` or `number-input` and
      `typeof value !== 'number'`; the target has `options` and `value` is not one of the
      option values; the target is `range` (object identity never matches); the target is
      `consent` and `typeof value !== 'boolean'`;
   c. `includes` / `not-includes`: the target is not `multi-select`, or `value` is not one
      of its option values;
   d. `greater-than` / `less-than`: the target is not `scale` or `number-input`;
   e. structural: `steps` is empty; a step has no groups; a group has no questions;
   f. a `likert-batch` group containing a question whose `type` is not `likert`.
   Skip (b)–(d) when the target question does not exist — the existing "unknown
   question" warning already covers that.
4. **Examples**: `all-inputs` gains one standalone likert question in its own group (not
   `required`, so existing browser flows keep passing). Add a unit test asserting
   `validateConfig(example.config)` is `[]` for every entry of `examples` in
   `src/examples/index.ts`.
5. Docs: README "Config sanity checks" lists the new warning families; the
   `QuestionType` table's likert row says it also renders standalone; CHANGELOG
   (Fixed: standalone likert; Added: warnings; Fixed: likert accessible names);
   `docs/STATE.md` PHASE-2 section.

## Tests

- Unit, `tests/unit/config-check.test.ts`: for each warning family in item 3 a config
  that triggers it and a neighbouring config that must not; the examples-produce-no-
  warnings test from item 4.
- Browser, `all-inputs` flow: the standalone likert is visible on its step; selecting
  works through `getByRole('radiogroup', { name: <statement> }).getByRole('radio', { name: <option label> })`
  at the default desktop viewport; the summary lists the statement with the chosen
  option label.
- Browser, new `likert` example spec: four radiogroups named by their statements; pick one
  option per row (by option label, desktop viewport); Next (Submit) succeeds; then the
  required path: with one row unanswered, Submit shows the `role="alert"` message.

## Definition of Done

- [ ] A `likert` question in a default group renders and can be answered; browser test green.
- [ ] At the desktop viewport, `getByRole('radio', { name: 'Strongly agree' })` resolves in
      the likert example (no "•" names); each row is a named radiogroup.
- [ ] Every warning family of item 3 has a positive and a negative unit case; the
      examples-no-warnings test passes.
- [ ] README, CHANGELOG, STATE updated.
- [ ] Gate green.
