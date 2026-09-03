# PHASE-5 — SSR-safe hydration of persisted state

Review refs: R-2. See `docs/REVIEW-2026-09-03.md`.

## Problem (verified 2026-09-03)

`createFormState` reads storage in its constructor, i.e. during component init. The
server has no storage and renders step 1; the client constructs the state with the
persisted index and hydrates a different step. Probe
(`docs/phases/reference/hydration-probe.mjs` against `vite dev`, conditional example,
after completing step 1): server `<h2>` "Travel Preferences", hydrated `<h2>` "Trip
Details", no warning logged. Users see step 1 paint and then jump; clicks before
hydration land on the wrong step. The snap-back block in `MultiStepForm.svelte`
(persisted index pointing at a now-hidden step) runs at init on the same wrong premise.

## Deliverables

1. **Construction is pure.** `createFormState` no longer touches storage in the
   constructor: initial state is always the empty buckets and index 0, on server and
   client alike. It gains `hydrate(): void` — idempotent; on the first call in a browser
   it reads the storage entry with the existing rules (version match, index clamp,
   corrupt JSON ignored), applies responses and index, and schedules no save. Later calls
   are no-ops. `FormStateController` declares `hydrate?(): void`; an external controller
   without it simply is not hydrated by the form.
2. **Hydrate after mount.** `MultiStepForm` calls `formState.hydrate?.()` from an
   `$effect` that runs once after mount — **not** `$effect.pre`, which runs before the
   first client render and would reproduce the mismatch. The snap-back logic (currently a
   top-level block) becomes a function invoked right after hydration; it must not fire
   `onStepChange`. Because the first client render now equals the server render,
   hydration is clean and the swap to the persisted step happens in the effect.
3. **Document the behaviour.** README, State management: "SSR: the server always renders
   the first step; persisted answers are restored right after hydration. To avoid the
   visible swap, render the form client-only (`{#if browser}` or `export const ssr =
   false` on the page)." Mention `hydrate()` for custom controllers.
4. CHANGELOG under Unreleased (Changed: persisted state is applied after mount; Added:
   `hydrate()`); `docs/STATE.md` PHASE-5 section including the probe output.

## Tests

- Unit (`tests/unit/form-state.test.ts`, jsdom): with an entry in storage, construction
  yields index 0 and empty responses; `hydrate()` applies them; a second `hydrate()` after
  a `setResponse` does not overwrite; version mismatch ignored on hydrate; `persist:
  false` makes `hydrate()` a no-op; corrupt JSON ignored; the index clamp still applies.
- Browser (production preview, conditional example): complete step 1 → on step 2 →
  reload; assert (a) the raw response body of the reload (or
  `page.request.get('/examples/conditional')`) contains "Travel Preferences" and not
  "Trip Details"; (b) the hydrated DOM shows "Trip Details"; (c) Back → step 1 still has
  "Yes" and "Mountains" checked; (d) no `pageerror` and no `console.error`.
- Dev-server probe, run by the builder and recorded in STATE.md (the reviewer may
  re-run it): `npx vite dev --port 5199 --strictPort` in the background, then
  `node docs/phases/reference/hydration-probe.mjs http://localhost:5199`; the output shows
  no `hydration_mismatch` and hydrated heading "Trip Details". Stop the dev server before
  ending the turn.

## Definition of Done

- [ ] `getItem` appears in `form-state.svelte.ts` only inside `hydrate()`; construction
      performs no storage read (unit test).
- [ ] Unit cases above; the reload browser test; probe output recorded in STATE.md.
- [ ] Every existing browser test still passes (in-session persistence unchanged).
- [ ] README, CHANGELOG, STATE updated. Gate green.
