# Task #020: Off-Canvas Pinch Focus and Local Corner Handles

- ID: #020-off-canvas-pinch-handles
- Created: 2026-08-11 UTC
- Status: done
- Type: bugfix
- Stability: experimental
- Owner: agent
- Related: #003-zoom-canvas-navigation, #017-field-interaction-layer

## Summary

Keep pinch zoom focused on the actual midpoint anywhere in the painting field, and prevent far-off field touches from selecting canvas corners.

## Acceptance Criteria

- [x] Pinch zoom preserves its initial midpoint even when that midpoint is outside the transformed canvas.
- [x] Wheel zoom retains raw off-canvas focus behavior without changing inside-canvas focus.
- [x] Corner handles retain a generous local circular hit area, but distant off-canvas points never select an edge corner through clamping.
- [x] Focused input tests and the full test suite pass.

## Plan

- [x] Return raw stage-relative zoom focus and validate inside/outside behavior in `src/input.js`, `tests/input.test.mjs`.
- [x] Use unclamped points only for corner hit testing in `src/app.js`; preserve clamped corner updates and validate with focused tests.
- [x] Complete tracking record and verify diagnostics.

## Execution Log

- 2026-08-11 UTC Start-of-turn Context Recap: Goal: make field-origin pinch zoom focus intuitive and localize corner handle hit testing. Current State: `zoomFocusFromPointer()` falls back to center outside the stage, and corner hit tests use a clamped pointer. Blocking Issues: none. Next Subtask: patch input focus and corner hit-test coordinate usage. Known Risks: preserve existing inside zoom invariants and keep corner movement constrained to the canvas.
- 2026-08-11 UTC: Changed `zoomFocusFromPointer()` to return raw stage-relative coordinates, so wheel and pinch zoom preserve off-canvas focal points. Corner selection now tests the raw pointer while corner updates continue using the clamped point.
- 2026-08-11 UTC: Verification complete: focused input tests pass 8/8, full suite passes 23/23, and diagnostics are clean for all touched files.

## Artifacts Changed

* `src/input.js`, `src/app.js`, `tests/input.test.mjs`
