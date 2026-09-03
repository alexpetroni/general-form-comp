# PHASE-4 — Submission lifecycle: reset, storage cleanup, callback transport, error detail

Review refs: R-3, R-4, R-26. See `docs/REVIEW-2026-09-03.md`.

## Problem

After a successful submission the persisted answers survive: a reload lands on the last
step with every answer filled and Submit enabled, one click from a duplicate POST. There
is no `reset()` on the controller. Without `config.submit`, pressing Submit fires
`onFormComplete` once behind the `completed` flag and then nothing changes on screen —
the button is inert. `onSubmitError` receives `new Error('Request failed (500)')` with
the status and body discarded.

## Deliverables

1. **`reset()`** (R-3). `FormStateController` gains `reset?(): void` (optional, so
   external implementations keep compiling; `createFormState` always implements it):
   responses back to one empty bucket per step, index 0, any pending debounced save
   cancelled, and the storage entry removed **synchronously** (`removeItem`) so nothing
   re-persists it.
2. **Reset after success** (R-3). In `MultiStepForm`, after a successful submission of
   any kind — POST 2xx, the honeypot drop, or the callback transport below — capture the
   payload and response for the success screen first, then call `formState.reset?.()`.
   On a redirect (`redirectUrl` / `successUrl`) reset **before** `window.location.assign`
   so the persisted state is gone when the user navigates back. The built-in success
   screen and the `success` snippet keep rendering from the captured payload.
3. **Callback transport** (R-4). `FormCallbacks.onFormComplete` becomes
   `(allResponses) => void | Promise<unknown>`. `submitForm` awaits it inside the
   `submitting` state (Submit disabled, `aria-busy`). Then:
   - with `config.submit`: continue with the POST as today;
   - without `config.submit`: show the built-in success screen (or the `success`
     snippet) with `response` = the resolved value or `null`, text from
     `settings.successTitle` / `successMessage`, then reset. `onSubmitSuccess` is **not**
     fired (it is documented as "after the POST"); say so in the README;
   - a rejected promise (either case) aborts the submission: `submitError` =
     `settings.submitErrorMessage ?? default`, `onSubmitError(error)` fires, `completed`
     is cleared so the next Submit calls `onFormComplete` again, and nothing is reset.
4. **`SubmitError`** (R-26). Export `class SubmitError extends Error { status: number; data: unknown }`
   from the barrel; non-2xx responses reach `onSubmitError` as a `SubmitError` carrying
   the status and the parsed body (or `null`). Network failures are passed through as
   received. The `onSubmitError` parameter type stays `unknown`.
5. **Demo support for tests**: in `src/routes/examples/[slug]/+page.svelte`,
   `onFormComplete` keeps its `console.log('Form completed!', …)` and `alert`, and now
   returns a promise that resolves after ~300 ms; when the page URL has `?fail=once`
   the **first** call rejects with `new Error('demo failure')` and later calls resolve.
6. Docs: README "Submitting results" gets a "Without a submit endpoint" subsection and
   an "After success" note (storage is cleared; `reset()`), the Callbacks block shows the
   new return type, State management shows `reset()`, Exports lists `SubmitError`;
   CHANGELOG under Unreleased (Added: reset, SubmitError, callback transport; Changed:
   storage cleared after success, `onFormComplete` awaited); `docs/STATE.md` PHASE-4.

## Tests

- Unit (`tests/unit/form-state.test.ts`, jsdom): `reset()` empties responses, sets index
  0, removes the storage entry; a save scheduled before `reset()` does not resurrect the
  entry after the timers advance.
- Browser, minimal example with the POST mocked to 2xx: success screen → `page.reload()`
  → step 1 with `Full name` empty and Submit enabled; `sessionStorage` has no
  `formcomp-example-minimal` entry (evaluate in the page).
- Browser, minimal example with `{ redirectUrl: '/examples' }`: after the navigation,
  `sessionStorage.getItem('formcomp-example-minimal')` is `null`.
- Browser, conditional example (no `submit`): complete the "No" path, Submit → the button
  is disabled while pending, then the built-in "Thank you!" heading appears and the
  console shows `Form completed!`; reload → first step, empty.
- Browser, `/examples/conditional?fail=once`: Submit → alert with the default submit
  error message, the answers intact, the button enabled; Submit again → success screen.
- Browser, minimal example with the POST mocked to 500 `{ message: 'Server exploded' }`:
  the existing test stays; additionally assert through a `page.exposeFunction` or a
  console log in the demo callbacks that `onSubmitError` received `status === 500` and
  `data.message === 'Server exploded'` (wire the demo's `onSubmitError` to
  `console.log('Submit failed', status, data)` for this).

## Definition of Done

- [ ] `reset()` exists on `createFormState()` and in `FormStateController`; unit-tested
      including the pending-save case.
- [ ] After a successful submission of each kind (POST, redirect, callback transport) the
      persisted entry is gone; browser tests for the POST, redirect and no-submit cases.
- [ ] Without `config.submit`, Submit shows the busy state then the success screen; a
      rejected callback shows the error and allows a retry that re-invokes the callback.
- [ ] `SubmitError` exported with `status` and `data`; asserted in a browser test.
- [ ] Every pre-existing browser test still passes without weakened assertions.
- [ ] README, CHANGELOG, STATE updated. Gate green.
