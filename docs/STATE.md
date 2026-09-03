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
