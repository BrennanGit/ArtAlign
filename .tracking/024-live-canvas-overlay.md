# Task #024: Live Canvas Overlay

- ID: #024-live-canvas-overlay
- Created: 2026-08-11 UTC
- Status: done
- Type: feature
- Stability: experimental
- Owner: agent
- Related: #023-fixture-canvas-detection

## Summary

Show a non-interactive visual overlay for the quad OpenCV believes is the physical canvas during live tracking.

## Acceptance Criteria

- [x] Confirmed live tracking shows a translucent, dashed quad over the camera view.
- [x] The guide follows successful optical-flow quad updates.
- [x] Corner handles remain limited to explicit edit-corners mode.
- [x] The guide disappears or returns to edit/search state when tracking is lost.
- [x] Existing tests, diagnostics, and a bounded browser smoke check pass.

## Plan

- [x] Add a live-only detected-quad drawing path in `src/app.js`.
- [x] Redraw the guide after tracking updates and state changes.
- [x] Verify live visual state and regression behavior.

## Execution Log

- 2026-08-11 UTC Start-of-turn Context Recap: Goal: make the live view visibly show where OpenCV believes the canvas is. Current State: live detection updates `project.projection.quad`, but successful tracking switches to `MODES.VIEW` and `drawInteraction()` only draws quads in edit mode. Blocking Issues: none. Next Subtask: add a non-interactive live quad guide and refresh it with tracking. Known Risks: implying a stale quad after tracking loss or making the guide interfere with live gestures.
- 2026-08-11 UTC: Added a translucent cyan fill and dashed border for confirmed live tracking, redrawing after optical-flow updates and clearing it when tracking is lost or errors. Bounded browser smoke using a real `canvas.captureStream()` fixture reached `Tracking canvas` in 1005ms and rendered 3,877 cyan interaction pixels; app returned to canonical view afterward. Node suite passes 24/24.

## Artifacts Changed

* `src/app.js`, `.tracking/meta.md`
