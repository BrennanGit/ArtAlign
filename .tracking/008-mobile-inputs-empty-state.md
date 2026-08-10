# Task #008: Mobile Input and Empty State Fixes

- ID: #008-mobile-inputs-empty-state
- Created: 2026-08-11 UTC
- Status: done
- Type: bugfix
- Stability: experimental
- Owner: agent
- Related: #003-zoom-canvas-navigation, #002-layer-first-ui
- Self-reminder: Read meta.md first; plan -> execute -> verify -> update.

## Summary

Prevent browser page zoom when form controls receive focus, accept decimal canvas ratios including A-series presets, and simplify the empty project state.

## Acceptance Criteria

- [x] Mobile browser zoom remains locked for the page while internal canvas navigation remains available.
- [x] Decimal ratio values, including A-series values, pass new-project form validation and persist accurately.
- [x] An empty canvas shows one `Add a reference` button that opens reference import.
- [x] New projects do not contain a default `Notes` layer.
- [x] Existing tests and diagnostics pass.

## Plan

- [x] Update mobile viewport/input behavior — Files: `index.html`, `styles.css`; Verification: focused browser check and diagnostics.
- [x] Fix decimal ratio validation — Files: `index.html`, `tests/model.test.mjs`; Verification: `npm test` and form validity check.
- [x] Simplify empty project state — Files: `index.html`, `src/app.js`, `src/model.js`, `tests/model.test.mjs`; Verification: focused model tests and browser interaction check.
- [x] Complete tracking record — Files: `.tracking/008-mobile-inputs-empty-state.md`, `.tracking/meta.md`; Verification: task status and stack are consistent.

## Execution Log

* 2026-08-11 UTC Start-of-turn Context Recap:

  * Goal: Fix phone page zoom, decimal ratio submission, and the empty project presentation.
  * Current State: The viewport meta tag permits browser scaling; A-series sets `1.4142` into a `0.01` step input; `createProject()` creates a `Notes` scribble layer; emptyHint is passive text.
  * Blocking Issues: None.
  * Next Subtask: Apply the viewport/input and model/UI changes, then run focused validation.
  * Known Risks: Page zoom must be disabled without interfering with the stage's pointer-based internal zoom and existing form usability.

## Decisions

* Use `user-scalable=no` in the viewport contract and a `touch-action` rule for form controls; keep `.stage`'s existing `touch-action: none` so canvas pinch/zoom remains internal.
* Use `step="any"` for ratio inputs because preset values are decimal irrational approximations rather than fixed two-decimal quantities.

## Completion

* 2026-08-11 UTC: Locked page scaling with `maximum-scale=1` and `user-scalable=no`; set mobile form controls to 16px to prevent focus zoom; changed ratio inputs to `step="any"`; replaced the empty hint with an `Add a reference` button; removed the default `Notes` layer.
* Verification: 22/22 tests pass, changed-file diagnostics are clean, and browser smoke testing confirmed a valid A-series ratio, one empty-state button, and no default Notes layer.