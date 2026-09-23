# Task #036: Drawing Transform

- ID: #036-drawing-transform
- Created: 2026-09-23 UTC
- Status: done
- Type: feature
- Owner: agent
- Related: #016-reference-transform-controls

## Summary

Add a drawing edit action for non-destructive translation, scaling and rotation with the existing canvas handles.

## Acceptance Criteria

- [x] A drawing edit menu enters transform mode with reference-style move, resize and rotate handles; returning to drawing preserves transformed placement.
- [x] Rendering, drawing input, export and undo/redo use the same persistent transform, including existing drawings without a transform.
- [x] Focused tests pass; full suite runs at final verification.

## Plan

- [x] Add default transform and inverse point mapping for drawings. Files: `src/model.js`, `src/canonical.js`, `tests/input.test.mjs`; Functions: `createScribbleLayer()`, `layerSourcePoint()`; Verify: focused model/input tests.
- [x] Render transformed strokes and route transform handles and drawing input. Files: `src/canonical.js`, `src/app.js`, `tests/canvas-resize.test.mjs`; Functions: `CanonicalCompositor.rebuild()`, `pointerDown()`, `pointerMove()`, `drawReferenceSelection()`; Verify: focused tests and browser mode/handles.
- [x] Document workflow. File: `README.md`; Verify: UI matches text.

## Execution Log

- 2026-09-23 UTC: Start-of-turn Context Recap: Goal: drawing transform alongside image transforms. Current State: reference items own transform and handle math; drawings store canonical strokes and render without a transform. Blocking Issues: none. Next Subtask: add reversible drawing transform data and point mapping. Known Risks: eraser compositing, canvas aspect ratio, undo and pointer navigation.
- 2026-09-23 UTC: Added persistent drawing transform, inverse input mapping, and layer-space compositing. Focused tests pass (19/19), and browser mode and handle canvas render verified. Existing stroke coordinates remain unchanged.