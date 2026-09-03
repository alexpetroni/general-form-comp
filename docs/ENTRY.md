# formcomp — review remediation, September 2026 — mission & constitution

You are hardening the EXISTING, working `formcomp` library: a config-driven multi-step
form component library for Svelte 5 + Tailwind v4, consumed by other projects as a git
dependency (`npm install github:alexpetroni/general-form-comp`) and as a vendored
workspace package. Do not rebuild it. The critical review that drives this batch is
**`docs/REVIEW-2026-09-03.md`**: every finding has an id (`R-n`), a `file:line`, the
failure scenario and the intended fix. Each phase file names the findings it closes.

Read before your phase: the README (it is the API reference), `src/lib/types.ts`,
`CHANGELOG.md`, `docs/STATE.md` if it exists (per-phase notes from earlier phases), and
the review sections your phase cites.

## What "done" means for this batch

- Every finding assigned to the phase is fixed at the root cause and proven by a test
  that reproduces the finding's scenario: a Vitest case for logic, a Playwright case for
  anything a user sees. Commit test-first where the fix is a behaviour change: the commit
  adding the failing test precedes the commit that makes it pass, so the sequence is
  visible in `git log`.
- The library stays backwards compatible for existing configs. Every example under
  `src/examples/` (and the demo routes) must keep rendering, validating and submitting.
  Public types may be *narrowed* or *extended*; anything removed or renamed must be named
  by the phase plan and recorded in the CHANGELOG under "Changed"/"Removed".
- No behaviour change beyond the phase's deliverables. Keep diffs tight and reviewable.
  Do not take a backlog item (`docs/phases/BACKLOG.md`) unless the phase names it.

## Binding engineering rules

- **Svelte 5 runes only.** `svelte.config.js` forces `runes: true`; no `$:` labels, no
  `export let`, no `createEventDispatcher`. Rune-using `.ts` modules end in `.svelte.ts`.
- **Library code is self-contained.** Inside `src/lib/` use relative imports with the
  `.js` extension (`'../../types.js'`), never `$lib`, `$app` or `$examples` — the package
  is built with `svelte-package` and must work outside SvelteKit. `import.meta.env?.DEV`
  stays optional-chained. Demo code under `src/routes/` and `src/examples/` may use the
  aliases.
- **Styling is Tailwind v4 utilities + the `--form-*` tokens** (`src/lib/theme.css`,
  `src/lib/styles.ts`). No design-system dependency, no component library, no new runtime
  dependency beyond `clsx` and `tailwind-merge` unless the phase says so. Use the v4
  syntax already in the code base (`text-(--form-accent)`, `size-4`, `rounded-(--form-radius)`).
  Merge consumer classes with `cn()` so theirs win.
- **Every input component must work standalone** (outside `MultiStepForm`, no context):
  `useTranslate()` falls back to identity, ids fall back to the `name` prop.
- **Accessibility is part of correctness.** Native elements, real labels, `fieldset` +
  `legend` for groups, visible focus rings, `role="alert"` for errors; never a `div` with
  a click handler where a button or input belongs.
- **Do not weaken existing tests to pass.** If a change breaks a test, fix the code, or
  fix the test only when its old assertion was wrong and say so in the commit message.
  Browser tests select by role and accessible name, never by CSS class.
- **Docs move with the code.** Every phase adds its entries to `CHANGELOG.md` under a
  `## Unreleased` heading (create it if missing; the release phase turns it into a
  version) and updates the README sections it affects — the README type blocks mirror
  `src/lib/types.ts`. Keep the README's Exports list complete.
- **The review document, the entry file and the phase plans are read-only for you.**
  Record what you closed, deferred or disagreed with in `docs/STATE.md` (create it; one
  section per phase), not by editing them. Never commit `dist/` or `.svelte-kit/`.

## Verification commands (run them yourself to completion; the reviewer re-runs them)

The runner's gate, from the project root:

```
npx svelte-kit sync && npx svelte-check --tsconfig ./tsconfig.json --fail-on-warnings
npm run test:unit
npx playwright install chromium && CI=1 npm run test:e2e
```

- `svelte-check` must report **0 errors, 0 warnings** (accessibility warnings included).
- Unit tests live in `tests/unit/*.test.ts` (Vitest, node environment; DOM tests declare
  their environment per file). Browser tests live in `tests/*.spec.ts` (Playwright,
  chromium). `npm run test:e2e` builds the SvelteKit demo and serves it on port 4322;
  the `Could not detect a supported production environment` warning from adapter-auto
  is harmless. `CI=1` makes Playwright refuse a stale server on 4322 instead of reusing it.
- `npm run package` must succeed after any change to `src/lib/` and is part of the
  release phase's DoD; inspect `dist/` when the phase changes exports.
- Node 24 and npm (not pnpm). `node_modules` is mounted from the host; run `npm ci` only
  if it is missing. `npx playwright install chromium` is idempotent (the system libraries
  are baked into the image; do not use `--with-deps`, it needs sudo).
- If you start a dev or preview server by hand (e.g. for the hydration probe in
  `docs/phases/reference/hydration-probe.mjs`), stop it before you end your turn.

If a Definition of Done item is genuinely unreachable (a contradictory requirement, a
dependency that cannot be installed), deliver every other item, commit, and report status
`blocked` with what is missing — never fake green, never soften the DoD.

## Known gotchas (each has cost a session somewhere)

- `svelte-package` rewrites nothing: a `$lib` import inside `src/lib/` builds fine in the
  demo and breaks in every consumer.
- Svelte 5 hydration is silent about DOM mismatches in production builds; only a dev
  server logs `hydration_mismatch`. Test SSR behaviour on both (see PHASE-5).
- Playwright's `webServer` reuses an existing server on 4322 unless `CI` is set; a stray
  preview from an earlier command silently tests a stale build.
- Demo callbacks call `alert()`; browser tests accept dialogs (`page.on('dialog', …)`).
- The demo pages persist state under `formcomp-example-<slug>`; a test that reloads must
  account for it, and a test that wants a clean form must start from a fresh context.
- Do not run prettier over `docs/*.md`; there is no prettier config in this repo.
- Do not `git checkout .`, `reset --hard`, `clean -f`, rebase or push — the runner's hook
  refuses them; revert a single file by name if you must.

## Per-phase bookkeeping

At the end of each phase: `CHANGELOG.md` (Unreleased), the README sections touched,
`docs/STATE.md` (what changed, new exports/settings, anything the next phase must know,
"Closed by PHASE-n" list of review ids). Commit in small conventional-commit steps
(`test(validator): …`, `fix(inputs): …`, `feat(state): …`, `docs: …`). Do not push — the
runner pushes after the phase is independently verified.
