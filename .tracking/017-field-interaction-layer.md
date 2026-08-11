# Task #017: Field Interaction Layer

- ID: #017-field-interaction-layer
- Created: 2026-08-11 UTC
- Status: done
- Type: feature
- Stability: experimental
- Owner: agent
- Related: #003-zoom-canvas-navigation, #014-photo-swipe-panning, #016-reference-transform-controls

## Summary

Extend editing overlays and gesture navigation across the full surrounding field while retaining stage-relative editing coordinates.

## Acceptance Criteria

- [x] Reference outlines and transform controls remain visible and interactive beyond the canvas edge.
- [x] Pinch navigation can begin anywhere in the viewport field.
- [x] Photo swipe navigation can begin anywhere in the viewport field.
- [x] Reference body dragging translates with one pointer; resize and rotation remain handle-only.
- [x] Canvas content remains clipped to the stage and field interaction does not block UI controls.
- [x] Automated tests, diagnostics, and desktop/mobile browser interaction checks pass.

## Plan

- [x] Add stage-relative unclamped pointer conversion and explicit reference translation — Files: `src/input.js`, `tests/input.test.mjs`; Verification: focused input tests.
- [x] Move the interaction layer to the viewport and map overlay drawing through transformed stage bounds — Files: `index.html`, `styles.css`, `src/app.js`; Verification: full tests and diagnostics.
- [x] Browser-test off-canvas controls and field-origin navigation at desktop/mobile sizes — Verification: Playwright interactions and screenshots.
- [x] Complete tracking record — Files: `.tracking/017-field-interaction-layer.md`, `.tracking/meta.md`; Verification: status and active stack are consistent.

## Execution Log

- 2026-08-11 UTC: Start-of-turn Context Recap: Goal: let overlays and navigation extend across the surrounding field. Current State: the interaction canvas is clipped inside the stage and receives all pointer starts, while editing coordinates assume that same element. Blocking Issues: none. Next Subtask: separate field event coverage from stage-relative coordinates. Known Risks: transformed stage bounds, off-canvas handle hit testing, empty-state button access, and mobile pointer capture.
- 2026-08-11 UTC: Moved the interaction canvas beside the stage so it covers the viewport, and translated its drawing context through the rendered stage bounds. Added unclamped stage-relative coordinates for off-canvas handles and restored explicit one-pointer reference translation.
- 2026-08-11 UTC: Routed pointer capture through the viewport and set `touch-action: none` there. Wheel and pinch gestures outside the stage retain centred zoom behavior; Photo mode panning accepts field-origin drags.
- 2026-08-11 UTC: Browser verification passed at desktop and mobile sizes. The off-canvas outline produced opaque pixels beyond the stage, its resize handle was draggable there, native field-origin pinch changed app zoom without changing browser scale, and field-origin Photo panning changed the stage transform.
- 2026-08-11 UTC: Verification complete: focused input tests and full suite passed with 23/23 tests, and diagnostics found no errors in touched files.
