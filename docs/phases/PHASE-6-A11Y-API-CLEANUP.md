# PHASE-6 — Tooltip, per-instance ids, API cleanup

Review refs: R-8 (tooltip only), R-9, R-10, R-11, R-23. See `docs/REVIEW-2026-09-03.md`.

## Problem

The field tooltip is a non-focusable `title` span: keyboard and touch users never see it.
DOM ids are raw question ids (`id={name}`, `formcomp-group-<id>`), so two forms on one
page, or a host element with the same id, break label→input association. `renderMode:
'inline'` and `'individual'` render identical markup while the README describes two
layouts. `TranslateFn` advertises a `params` argument nothing ever passes. `onStepChange`
fires even when navigation was a no-op and `handleNext` duplicates the `onStepComplete`
call.

## Deliverables

1. **Keyboard-reachable tooltip** (R-8). In `FieldLabel.svelte` the info icon becomes a
   `<button type="button">` with `aria-label` = the translated tooltip text (keep `title`
   for hover) and `aria-expanded`; activating it toggles a visible description element
   rendered as a sibling after the label/legend (`text-sm text-(--form-muted)`) whose id
   the button references with `aria-controls`. Clicking the button must not toggle the
   associated input (buttons are interactive content; verify in the browser test).
2. **Per-instance ids** (R-9). `MultiStepForm` creates `const formId = $props.id()` and
   provides it through a new exported context key `FORM_ID_KEY`. `QuestionRenderer` and
   `LikertGroup` derive the `name` / id base as `${formId}-${question.id}`; the group
   wrapper id becomes `formcomp-group-${formId}-${group.id}` and its alert id follows;
   `handleNext` scrolls to it via `rootEl.querySelector` with `CSS.escape`, not a global
   `getElementById`. Standalone components (no context) fall back to the raw `name`. The
   radio `name` attribute is prefixed too (grouping stays per form).
3. **`renderMode: 'inline'` deprecated** (R-10). `GroupRenderer` renders one branch for
   `individual` and `inline`; `types.ts` marks `'inline'` `@deprecated` ("alias of
   `individual`; use `layout.columns` for side-by-side fields"); the README table says
   the same; examples drop `renderMode: 'inline'` (their `layout.columns` keeps working).
4. **`TranslateFn` is `(key: string) => string`** (R-11); README i18n section and the
   props table updated. `useTranslate` unchanged.
5. **Callback edges** (R-23). `goTo` fires `onStepChange` only when the index actually
   changed; `handleNext` calls `onStepComplete` once, outside the branch.
6. **Two-forms demo route** for the id test: `src/routes/dev/two-forms/+page.svelte`
   renders two `MultiStepForm` instances of `minimalConfig` with `persist: false`
   controllers (no cross-talk). Not linked from the gallery.
7. Docs: README (tooltip behaviour, `FORM_ID_KEY` in Context keys, deprecation,
   `TranslateFn`), CHANGELOG under Unreleased (Deprecated: `inline`; Changed:
   `TranslateFn`, ids; Fixed: tooltip, callbacks); `docs/STATE.md` PHASE-6.

## Tests

- Browser, all-inputs step 1: `getByRole('button', { name: /official documents/ })` is
  focusable; pressing Enter shows the description text and sets `aria-expanded="true"`;
  focus does not move into the `Name` input; Escape or a second activation hides it.
- Browser, `/dev/two-forms`: `getByLabel('Full name')` resolves to two elements; typing
  in the second leaves the first empty; clicking the second form's `Full name` label
  focuses the second input; every `[id]` in the document is unique (evaluate and assert
  no duplicates); each form validates independently (Submit on the first shows one
  alert, inside the first form's root).
- Browser, conditional example: with the console captured, an invalid Next (empty
  required) logs no `Step changed`; a valid Next logs exactly one `Step completed` and one
  `Step changed`.
- Unit/type: a `TranslateFn` typed `(key: string) => string` is assignable to the prop
  (svelte-check covers it); `tests/unit/config-check.test.ts` unaffected.
- Every existing browser test still passes (they select by role and label, not by id).

## Definition of Done

- [ ] Tooltip reachable and operable by keyboard; browser test green.
- [ ] Ids prefixed per instance; two-forms test green; no global `getElementById` in
      `MultiStepForm.svelte`.
- [ ] `inline` deprecated in types and README; examples updated; a single render branch.
- [ ] `TranslateFn` narrowed; callbacks fixed and asserted.
- [ ] README, CHANGELOG, STATE updated. Gate green.
