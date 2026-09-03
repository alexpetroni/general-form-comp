# Backlog — deferred from the 2026-09-03 review

Not in `.phase-runner/phases`. Each item is sized to become one phase file when wanted.
Review ids refer to `docs/REVIEW-2026-09-03.md`.

1. **Discriminated `Question` union** (R-13). One interface per `QuestionType` so
   `options` is required for select types, `min`/`max` exist only on numeric types,
   `rows` only on `textarea`, etc. Breaking for consumers who build configs
   programmatically with the wide type; ship in a minor with a migration note.
2. **Submission transport override** (R-12). `SubmitConfig` gains `credentials?:
   RequestCredentials`, `timeoutMs?: number` (AbortController) and `send?: (payload,
   config) => Promise<Response | unknown>` replacing the built-in `fetch`; makes
   submission testable without route mocking.
3. **Cross-step hidden-answer clearing** (R-14). On leaving a step, run the
   `collectResponses` fixpoint and clear every stored answer it dropped, so persisted
   state and `allResponses` never disagree with what the user saw. Behaviour change:
   answers on a skipped step no longer resurrect when the step reappears.
4. **Storage key default** (R-15). Derive the default key from a new optional
   `FormConfig.id` (`formcomp-<id>`), and warn in dev when two forms on one origin share
   the fallback key.
5. **Localised display values**. `formatAnswer` renders dates and times through `Intl`
   given a `locale` (from a new `settings.locale` or the translate layer).
6. **Text constraints and operators**. `minLength` / `maxLength` / `pattern` on text
   inputs; `greater-or-equal`, `less-or-equal`, `in`, `not-in` condition operators.
7. **Automated accessibility sweep**. `@axe-core/playwright` run on the first step of
   every example, failing on serious/critical violations.
8. **Lint**. Prettier + `eslint-plugin-svelte` configuration and a `lint` script added to
   the gate (the `sv create` defaults this repo dropped).
9. **Distribution**. Publish to npm or GitHub Packages instead of a git dependency that
   runs `svelte-package` in every consumer's `npm install`.
10. **Minor** (review section F): `TimeInput` `placeholder` no-op and sub-minute `step`;
    empty `SummaryStep` sections; `allResponses` returning a snapshot rather than the
    live proxy; README note about persisting sensitive answers.
