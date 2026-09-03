# PHASE-3 — Honest validation and ARIA state

Review refs: R-5, R-6 (url half; email arrived with PHASE-0), R-8 (ARIA state, required
marker, per-question warning — the tooltip is PHASE-6), R-22, R-24. See
`docs/REVIEW-2026-09-03.md`.

## Problem

`NumberInput.svelte` and `RangeInput.svelte` rewrite an out-of-range value to the bound
on `change`, so `questionStatus` never sees an invalid number; typing 999 for "age"
silently becomes 120, and the `invalidMessage` path is reachable only through an
inverted range (the e2e test named "out-of-range number blocks progression" admits it
tests something else). `inputType: 'url'` is never validated. Required and invalid
state is not exposed to assistive technology: no `aria-required`, no `aria-invalid`, no
`aria-describedby` to the alert, no visible required marker, and the red ring is applied
to every question in the failing group rather than the failing ones. The progress
landmark's label bypasses `translate`.

## Deliverables

1. **No silent clamping** (R-5). `NumberInput` and `RangeInput` store the parsed number as
   typed (`undefined` for empty or NaN). `min` / `max` / `step` remain on the elements as
   hints for the native spinner. `questionStatus` is unchanged for numbers and now
   actually rejects; `MultiStepForm` shows `settings.invalidMessage` and the field ring.
2. **URL validation** (R-6). Export `isValidUrl(value: string): boolean` from the
   validator (and the barrel): `new URL(value.trim())` parses and the protocol is `http:`
   or `https:`. `questionStatus` returns `'invalid'` for a non-empty malformed
   `text-input` with `inputType: 'url'`, mirroring the email rule; empty and not required
   stays `'ok'`.
3. **Per-question warning** (R-8). When a group is the warning group, `GroupRenderer`
   computes `questionStatus(question, value)` for each visible question and passes
   `warning` only to those whose status is not `'ok'` (today every question in the group
   gets it). The group ring and message are unchanged. For `likert-batch`, `LikertGroup`
   accepts the ids of failing questions (e.g. `warningIds?: string[]`) so only failing
   rows get the ring; the existing `warning` prop keeps working for standalone use.
4. **ARIA state** (R-8). Every input component accepts `required?: boolean` and
   `describedBy?: string`; `QuestionRenderer` passes `question.required` and, when the
   question is in warning, the id of the group's alert element:
   - `aria-required="true"` on the control elements of a required question (input,
     select, textarea; each radio / checkbox of a group);
   - `aria-invalid="true"` on the control elements of a question in warning;
   - `aria-describedby` on those controls → the `<p role="alert">` in
     `QuestionGroupWrapper`, which gets a stable id (`formcomp-group-<id>-alert`);
   - **required marker**: `FieldLabel` gets `required?: boolean` and renders an asterisk
     `<span aria-hidden="true">*</span>` after the label text (styled with
     `text-(--form-error)`). It is aria-hidden so accessible names do not change:
     the existing `getByLabel('Name', { exact: true })` assertion is the canary.
5. **Progress label** (R-22). New `settings.progressLabel?: string` (default
   `'Progress'`), passed through `translate` into the `<nav aria-label>`.
6. **Browser test rewrite** (R-24): the misnamed test becomes a real out-of-range test
   (see Tests).
7. Docs: README Validation section (numbers are no longer clamped; url rule; required
   marker; ARIA attributes), `FormSettings` block (`progressLabel`), Exports
   (`isValidUrl`); CHANGELOG under Unreleased — **Changed**: "number and range inputs no
   longer clamp to min/max; out-of-range values fail validation with `invalidMessage`";
   `docs/STATE.md` PHASE-3 section.

## Tests

- Unit: `isValidUrl` table (http/https accepted, `ftp:`/`javascript:`, bare words,
  whitespace rejected); `questionStatus` url cases (required/optional × empty/valid/
  invalid); the number cases already exist.
- Browser, conditional example, Trip Details (`trip_length`, max 365): type `999`, Next
  → the alert contains the default invalid message ("Please correct the highlighted
  answers in this section."), the input still shows `999`, has `aria-invalid="true"`,
  `aria-required="true"`, and its `aria-describedby` resolves to the alert element; the
  sibling optional email on Follow-up has no `aria-required`; correct to `14` → advances.
  Rename the test accordingly.
- Browser, conditional example, Follow-up: `not-an-email` in the email field → Next →
  alert; fix it → advances (exercises the PHASE-0 rule through the UI).
- Browser, all-inputs step 1: the `Name` label shows the marker and `getByLabel('Name',
  { exact: true })` still resolves; `Email` (optional) shows no marker.
- Browser, `customized` example: `Team size` `600` (max 500) → the custom
  `invalidMessage` appears; only that field carries `aria-invalid` (the range next to it
  does not).

## Definition of Done

- [ ] No `Math.min` / `Math.max` / clamping in `NumberInput.svelte` and `RangeInput.svelte`;
      an out-of-range number reaches `questionStatus` and is reported as invalid (browser test).
- [ ] `isValidUrl` exported and unit-tested; url questions validated.
- [ ] `aria-required`, `aria-invalid`, `aria-describedby` present as specified and asserted
      in the browser tests; the marker does not change accessible names.
- [ ] Only failing questions in the warning group carry the field ring / `aria-invalid`.
- [ ] `settings.progressLabel` exists, documented, translated.
- [ ] README, CHANGELOG (Changed entry for clamping), STATE updated.
- [ ] Gate green.
