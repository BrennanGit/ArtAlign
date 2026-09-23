# Task #031: Straight Line Tool

- Created: 2026-09-23 UTC
- Status: done
- Type: feature
- Owner: agent

## Acceptance Criteria
- [x] Drawing mode includes a line tool; drag from first point to second to preview and commit a straight segment.
- [x] Line persists in the drawing layer, works with undo, export and projection, and pinch cancellation does not commit it.

## Plan
- [x] Update `src/app.js` drawing tool input and inspector controls; update `src/canonical.js` line rendering; verify in `tests/canvas-resize.test.mjs` and browser.
- [x] Document tool in `README.md` and run tests.

## Execution Log
- 2026-09-23 UTC Start-of-turn Context Recap: Goal: draggable straight line in drawing layers. Current State: pointer drag appends sampled points and compositor smooths them. Blocking Issues: none. Next Subtask: create two-point line and render straight segment. Known Risks: pinch cancellation and pointer-up endpoint.
- 2026-09-23 UTC: Added line mode, two-point drag preview and direct segment rendering. Full 29-test suite passes; browser drag produced opaque red pixels on path and transparent pixels off path. Pinch rollback uses existing provisional-stroke cancellation.
- 2026-09-23 UTC: Added direct segment and captured-layer compositor tests. Tap without moving and pointercancel now discard the provisional line.
- 2026-09-23 UTC: Browser storage check confirmed a tap leaves the saved drawing's stroke count unchanged (7 before and after).