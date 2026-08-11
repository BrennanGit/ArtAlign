# Task #025: Reliable Slider Dragging

- ID: #025-slider-drag
- Created: 2026-08-11 UTC
- Status: done
- Type: bugfix
- Stability: experimental
- Owner: agent
- Related: #024-live-canvas-overlay

## Summary

Keep inspector range controls stable while their values are edited so pointer drags remain continuous instead of replacing the active input after each movement.

## Acceptance Criteria

- [x] Inspector sliders continue moving through a pointer drag without jumping or stopping.
- [x] Slider changes still update the project value, preview, and autosave behavior.
- [x] Existing tests and a browser drag smoke check pass.

## Plan

- [x] Route inspector field previews through the existing non-rebuilding preview scheduler — Files: `src/app.js`; Verification: browser drag smoke check and `npm test`.
- [x] Complete tracking record — Files: `.tracking/025-slider-drag.md`, `.tracking/meta.md`; Verification: task status and stack are consistent.

## Execution Log

- 2026-08-11 UTC Start-of-turn Context Recap: Goal: make all inspector sliders reliable to drag. Current State: `handleInspectorInput()` awaits `refresh()` with control updates enabled, so each range input event re-renders and replaces the active range element. Blocking Issues: none. Next Subtask: route field updates through `requestEditorPreview()`, then verify with tests and browser drag. Known Risks: avoiding inspector re-render means dynamic control structure must remain unchanged during field edits.

- 2026-08-11 UTC: Changed `handleInspectorInput()` to schedule the existing coalesced `requestEditorPreview()` path instead of awaiting a control-rebuilding refresh. Node tests pass 24/24; browser drag moved the Width slider through `0.016`, `0.026`, `0.036`, and `0.046` in one held pointer gesture; diagnostics and `git diff --check` are clean.

## Decisions

- Reuse `requestEditorPreview()`, which already batches `refresh(true, false)` for continuous layer interactions and preserves inspector controls.
