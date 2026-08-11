# Task #016: Reference Transform Controls

- ID: #016-reference-transform-controls
- Created: 2026-08-11 UTC
- Status: done
- Type: feature
- Stability: experimental
- Owner: agent
- Related: #002-layer-first-ui, #014-photo-swipe-panning

## Summary

Add visible canvas controls to proportionally resize and rotate a selected reference while composing on the canonical canvas.

## Acceptance Criteria

- [x] A selected reference displays a resize handle and a rotation handle in canonical composition mode.
- [x] Dragging the resize handle proportionally changes the reference scale without moving its centre.
- [x] Dragging the rotation handle changes the reference rotation without changing its scale or centre.
- [x] Reference transforms use only the visible resize and rotation handles; global pinch zoom remains available.
- [x] Focused input tests and the full test suite pass.

## Plan

- [x] Add and test pure single-handle transform calculations — Files: `src/input.js`, `tests/input.test.mjs`; Functions: `applyReferenceHandle()`; Verification: focused input test.
- [x] Render selection handles and route their pointer drags — File: `src/app.js`; Functions: `pointerDown()`, `pointerMove()`, `pointerUp()`, `drawReferenceSelection()`; Verification: `npm test`.
- [x] Complete tracking record — Files: `.tracking/016-reference-transform-controls.md`, `.tracking/meta.md`; Verification: task status and active stack are consistent.
- [x] Remove the obsolete two-pointer reference transform state and test — Files: `src/input.js`, `src/app.js`, `tests/input.test.mjs`; Verification: `npm test`.

## Execution Log

- 2026-08-11 UTC: Start-of-turn Context Recap: Goal: provide practical resize and rotation controls for reference placement. Current State: two-pointer reference gestures already translate, scale, and rotate, while the single-pointer overlay only draws an outline. Blocking Issues: none. Next Subtask: add a pure handle-transform calculation and focused test. Known Risks: controls must preserve body translation, pinch navigation precedence, and the existing rectification workflow.
- 2026-08-11 UTC: Added and tested `applyReferenceHandle()`, which applies proportional scaling or angular rotation around the existing reference centre.
- 2026-08-11 UTC: Added rotated canvas handles for resizing and rotation, and routed their pointer drags while leaving body translation and pinch gestures unchanged.
- 2026-08-11 UTC: Verification complete: focused handle test passed, full suite passed with 24/24 tests, and diagnostics found no errors in touched source or test files.
- 2026-08-11 UTC: Follow-up: user requested that reference transforms use the visible controls exclusively. The reference gesture is already preempted by global pinch navigation, so remove the unused route rather than alter pinch behavior.
- 2026-08-11 UTC: Removed `applyReferenceGesture()`, the reference gesture state, and its test. Global two-finger pinch remains solely a canvas navigation gesture; reference body dragging translates and selection handles resize or rotate.
- 2026-08-11 UTC: Verification complete: full suite passed with 23/23 tests and diagnostics found no errors in touched files.
