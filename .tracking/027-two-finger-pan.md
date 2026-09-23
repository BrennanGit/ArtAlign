# Task #027: Two-Finger Pan

- ID: #027-two-finger-pan
- Created: 2026-09-23 UTC
- Status: done
- Type: feature
- Stability: experimental
- Owner: agent
- Related: #026-view-menu-history-export

## Acceptance Criteria

- [x] Parallel two-finger motion pans the stage in canonical, photo, and live views without changing content.
- [x] Pinch still zooms around the gesture midpoint; combined pan and pinch work together.
- [x] One-finger pan stays exclusive to the photo view and cancels cleanly when the second finger lands.

## Plan

- [x] Combine midpoint translation with pinch scaling — Files: `src/input.js`, `src/app.js`; functions: `panAndZoomView()`, `pointerMove()`, `beginPinchNavigation()`; verify focused input tests.
- [x] Verify touch interactions and document navigation — Files: `tests/input.test.mjs`, `spec.md`, `README.md`; verify `npm test` and browser touch simulation.

## Execution Log

- 2026-09-23 UTC Start-of-turn Context Recap: Goal: two-finger canvas pan everywhere. Current State: pinch tracks midpoint only as initial zoom focus; one-finger photo pan exists. Blocking Issues: waiting for #026. Next Subtask: add midpoint delta during pinch. Known Risks: accidental edits on second touch and pan drift during zoom.
- 2026-09-23 UTC Start-of-turn Context Recap: Goal: combine touch translation and scale. Current State: history/menu are implemented and tests pass; finish browser checks alongside task #028. Blocking Issues: none. Next Subtask: update pinch translation and test it. Known Risks: zoom focus anchored to initial midpoint must be adjusted by current midpoint displacement.
- 2026-09-23 UTC: Combined centre displacement and pinch scale from the gesture starting state; targeted input tests pass 9/9. Documentation and browser touch check remain in final verification.
- 2026-09-23 UTC: Synthesized two-pointer browser gesture moved pan from 0% to 4.42478% / 2.21239% at scale 1. Gesture and navigation rules added to spec and README. Physical device multitouch remains untested.
- 2026-09-23 UTC: Follow-up: cancelled provisional drawing/reference edits need a preview refresh when a second finger takes over navigation. Verifying that the visual state rolls back with project data.
- 2026-09-23 UTC: Preview refresh now runs on cancelled drawing/reference gestures. Browser pixel changed from painted red to transparent after the second pointer; all 28 Node tests pass. No physical-device touch test was available.