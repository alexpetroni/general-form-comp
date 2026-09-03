# PHASE-0 — Upstream the vendored 0.3.0 (email validation, consent type, honeypot)

Review refs: R-25 (divergence), R-6 (email half), R-16 (warnings). See
`docs/REVIEW-2026-09-03.md`.

## Problem

A consumer project vendored this library at 0.2.1 and shipped three additive features
plus the svelte-check warning fixes as 0.3.0 without upstreaming them. This repository is
still 0.2.1. Every later phase in this batch builds on the 0.3.0 code, and the strict gate
(`svelte-check --fail-on-warnings`) is only green with its warning fixes, so this port
comes first and verbatim.

`docs/phases/reference/vendored-0.3.0.patch` is the exact unified diff of `src/`,
`tests/`, `README.md` and `CHANGELOG.md` between the two trees (`a/` = this repository at
`e9f059b`, `b/` = the vendored copy). Verified on 2026-09-03: it applies cleanly on
`e9f059b` with `git apply`; afterwards `svelte-check --fail-on-warnings` reports 0
errors and 0 warnings, and the unit suite has 41 passing tests.

## Deliverables

1. **Apply the patch** from the project root: `git apply docs/phases/reference/vendored-0.3.0.patch`.
   If HEAD has moved and a hunk fails, apply with `--reject`, port the rejected hunks by
   hand, and keep the vendored semantics exactly. Do not refactor or "improve" the ported
   code in this phase; later phases build on it as-is.
2. **Reconcile what the patch does not cover**: `package.json` `version` → `0.3.0`.
   Nothing else in `package.json` changes here.
3. **Confirm the contract** by reading the ported code end to end (other projects already
   rely on these semantics):
   - `isValidEmail` exported from `src/lib/index.ts`; pattern
     `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` on the trimmed value; `questionStatus` returns
     `'invalid'` for a non-empty malformed `text-input` with `inputType: 'email'`; empty
     and not required stays `'ok'`.
   - `'consent'` question type: `ConsentCheckbox` exported; answer value `boolean`;
     `required` ⇒ only `true` is `'ok'`; `formatAnswer` renders `'Yes'` (a translate key)
     or `'—'`; `validateConfig` warns when a consent question carries `options`.
   - `settings.honeypot: true`: an off-screen input (not `display:none`), `aria-hidden`,
     `tabindex="-1"`, `autocomplete="off"`, named `HONEYPOT_FIELD` (`'website'`,
     exported); a filled honeypot shows the success flow without POSTing and without
     firing the submit callbacks; `buildSubmitPayload` output carries
     `honeypot: { field, value }`.
   - `lead-capture` example registered in `src/examples/index.ts` and listed in the
     README examples table.
4. **CHANGELOG**: the patch brings `## 0.3.0 — 2026-08-20`; keep it, and add one line
   under it: "Upstreamed from the consumer project's vendored copy on <today>."
5. **`docs/STATE.md`**: create it with a PHASE-0 section (what was ported, the commit
   ids, the verification you ran).

## Tests

No new tests beyond the ported ones: `tests/unit/email-consent-honeypot.test.ts` and
`tests/lead-capture.spec.ts` arrive with the patch and must run green.

## Definition of Done

- [ ] The phase's commits touch only the files listed in the patch plus `package.json`,
      `CHANGELOG.md` and `docs/STATE.md`.
- [ ] `src/lib/components/inputs/ConsentCheckbox.svelte`, `src/examples/lead-capture.ts`,
      `tests/unit/email-consent-honeypot.test.ts`, `tests/lead-capture.spec.ts` exist;
      `src/lib/index.ts` exports `ConsentCheckbox`, `isValidEmail` and `HONEYPOT_FIELD`.
- [ ] `package.json` version is `0.3.0`; CHANGELOG has the 0.3.0 entry with the
      upstream note.
- [ ] Gate green: svelte-check 0 errors 0 warnings, at least 41 unit tests, the full
      Playwright suite including `lead-capture.spec.ts`.
- [ ] `npm run package` succeeds and `dist/components/inputs/ConsentCheckbox.svelte`
      exists (dist is not committed).
