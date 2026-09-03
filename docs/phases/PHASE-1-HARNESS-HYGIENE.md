# PHASE-1 — Test harness for rune modules, repo hygiene

Review refs: R-20, R-15 (version default only), R-17, R-18, R-19, R-21; R-16 stays at
zero warnings. See `docs/REVIEW-2026-09-03.md`.

## Problem

`src/lib/state/form-state.svelte.ts` cannot be unit-tested: `vitest.config.ts` has no
Svelte plugin (so `$state` does not compile) and no DOM environment (no `sessionStorage`).
Persistence, version invalidation and index clamping — the parts that lose a user's
answers when wrong — have no tests, and PHASE-4 and PHASE-5 change exactly that module.
Around it: the package ships the demo favicon, lacks basic metadata, the home page
duplicates an example config, and the README's project map is stale.

## Deliverables

1. **Vitest can run `.svelte.ts` modules.** Add the Svelte Vite plugin to the Vitest
   configuration (either move the `test` block into `vite.config.ts` next to the existing
   `sveltekit()` plugin, or add `svelte()` from `@sveltejs/vite-plugin-svelte` to
   `vitest.config.ts`) and add `jsdom` (or `happy-dom`) as a devDependency. Pure tests
   stay in the node environment; a DOM test opts in per file with
   `// @vitest-environment jsdom`. Keep `include: ['tests/unit/**/*.test.ts']` so the
   Playwright specs never run under Vitest.
2. **`tests/unit/form-state.test.ts`**, using fake timers wherever saves are debounced:
   - fresh state: one empty bucket per step, index 0, `currentStepId`, `stepCount`;
   - `setResponse` / `getResponse` / `getStepResponses`, including a step id absent from
     the config (bucket created on write, `{}` on read);
   - `nextStep` / `prevStep` / `goToStep` respect the bounds;
   - persistence: after `debounceMs` the storage entry is
     `{ responses, currentStepIndex, version }`; two rapid writes produce one save;
   - hydration from `sessionStorage` and from `localStorage`; `persist: false` never reads
     or writes storage;
   - version: an entry stored under a different `version` is ignored, an equal one is
     applied, and with no version anywhere any stored entry is accepted;
   - a persisted index beyond the current step count is clamped to the last step;
   - corrupt JSON in storage is ignored.
3. **`version` defaults to `config.version`** (R-15): `createFormState(config, options)`
   uses `options.version ?? config.version`. Test: a config with `version: 2` discards an
   entry stored under version 1 when the option is omitted. `MultiStepForm` may keep
   passing it explicitly; both paths must work.
4. **Package metadata** (R-19): `license: "BSD-3-Clause"`, `description`,
   `repository: { type: "git", url: "git+https://github.com/alexpetroni/general-form-comp.git" }`,
   `homepage`, `bugs`, `keywords` (svelte, svelte5, form, multi-step, wizard, survey,
   tailwind, config-driven), `engines: { node: ">=20" }`, `sideEffects: ["**/*.css"]`,
   `exports["./package.json"]: "./package.json"`, and `CHANGELOG.md` added to `files`.
   The version stays `0.3.0`.
5. **Favicon out of the package** (R-18): move `src/lib/assets/favicon.svg` to
   `static/favicon.svg` (or under `src/routes/`) and update `src/routes/+layout.svelte`;
   the directory `src/lib/assets/` disappears.
6. **Home page imports the example** (R-17): `src/routes/+page.svelte` renders
   `sleepAssessmentConfig` from `$examples`; the inline config is deleted. `/` and
   `/examples/sleep-assessment` both keep working.
7. **README "Project structure"** (R-21) lists every file under `src/lib/` (including the
   0.3.0 additions), `src/examples/`, `src/routes/examples/`, and both test directories.
8. `CHANGELOG.md`: start `## Unreleased` with the version-default change (Changed) and the
   package/favicon items. `docs/STATE.md`: PHASE-1 section.

## Definition of Done

- [ ] `npm run test:unit` runs `tests/unit/form-state.test.ts` alongside the existing
      files: at least 12 cases, every bullet of item 2 covered, none skipped; the
      version-default case is committed before the one-line fix that makes it pass.
- [ ] `package.json` carries every field of item 4; `npm pack --dry-run` (after
      `npm run package`) lists `dist/**`, `README.md`, `LICENSE`, `CHANGELOG.md`,
      `package.json` and nothing under `assets/`.
- [ ] `src/lib/assets/` does not exist; after `npm run package`, `dist/assets/` does not
      exist; the demo still serves the favicon.
- [ ] `src/routes/+page.svelte` contains no inline `steps:` and is under 60 lines.
- [ ] The README project map matches `find src/lib src/examples src/routes tests -type f`.
- [ ] Gate green: svelte-check 0 errors 0 warnings, unit, full Playwright suite.
