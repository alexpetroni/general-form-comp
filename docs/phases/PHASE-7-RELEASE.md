# PHASE-7 — Release 0.4.0

Review refs: R-21 (final consistency), closes the batch. See `docs/REVIEW-2026-09-03.md`.

## Problem

Six phases changed behaviour, types and exports under a `## Unreleased` heading. The
README is the API reference for consumers installing from git; it must match the code
exactly before the version is cut.

## Deliverables

1. **CHANGELOG**: turn `## Unreleased` into `## 0.4.0 — <today's date>` with
   Added / Changed / Deprecated / Fixed sections, consolidated and deduplicated. Verify
   against `git log v0.3.0..HEAD` (or the PHASE-0 commit onward) that every user-visible
   change is present. Add a short **Upgrading from 0.3.x** paragraph: numbers are no
   longer clamped (out-of-range now fails validation), `onFormComplete` may be async and
   is awaited, persisted state is applied after mount (SSR renders step 1), storage is
   cleared after a successful submission, `renderMode: 'inline'` is deprecated,
   `TranslateFn` no longer takes `params`.
2. **`package.json`** version `0.4.0`.
3. **README full pass** — every section must agree with the code:
   - Props table; `FormSettings` block (`progressLabel`, `honeypot`); `FormCallbacks`
     block (`onFormComplete` return type; `onSubmitError` receives `SubmitError`);
     `FormStateAdapter` / `FormStateController` blocks (`reset`, `hydrate`);
   - Validation section (url, no clamping, ARIA, required marker, per-question ring);
     Config sanity checks (every warning family in `config-check.ts`);
   - State management (SSR note, `reset`, version default); Submitting results (callback
     transport, storage cleanup, `SubmitError`);
   - Examples table (`lead-capture`, the two-forms dev route mentioned under Development);
   - Exports list: every symbol exported from `src/lib/index.ts` appears, and nothing
     that is not exported is listed; Context keys include `FORM_ID_KEY`;
   - Project structure matches the tree.
4. **Package check**: `npm run package`; `dist/index.d.ts` exports the same names as
   `src/lib/index.ts`; no `dist/assets/`; `npm pack --dry-run` lists `dist/**`,
   `README.md`, `LICENSE`, `CHANGELOG.md`, `package.json`.
5. `docs/STATE.md`: "Release 0.4.0" section listing which review ids were closed by which
   phase and pointing at `docs/phases/BACKLOG.md` for the rest.

## Definition of Done

- [ ] `package.json` is `0.4.0`; CHANGELOG has a dated `0.4.0` entry with the Upgrading
      paragraph and no `Unreleased` heading.
- [ ] Every export of `src/lib/index.ts` appears in the README Exports list (the reviewer
      diffs the two); every `FormSettings` key and every `validateConfig` warning family
      is documented.
- [ ] `npm run package` succeeds; `npm pack --dry-run` file list as specified.
- [ ] Gate green. No functional code changes in this phase beyond what the README
      reconciliation reveals as a documentation bug (fix the docs, not the code, unless a
      test proves the code wrong — then say so in STATE.md).
