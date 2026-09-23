# Task #030: Resize Canvas Plane

- Created: 2026-09-23 UTC
- Status: done
- Type: feature
- Owner: agent

## Acceptance Criteria
- [x] Existing project's width and height can be changed, updating canvas plane, export and projection aspect ratio.
- [x] Existing artwork stays undistorted and positioned/scaled relative to canvas center, with edits undoable and persistent.

## Plan
- [x] Implement center-preserving resize in `src/model.js`, `src/canonical.js` for reference, strokes and captures; guides subdivide the new plane. Verify geometry in `tests/model.test.mjs` and `tests/canvas-resize.test.mjs`.
- [x] Add existing-project size dialog in `index.html`, `src/app.js`; verify editor and history in browser.
- [x] Document behavior in `README.md` and verify tests.

## Execution Log
- 2026-09-23 UTC Start-of-turn Context Recap: Goal: resize plane without stretching artwork. Current State: raster captures fill canvas and reference transforms use fit-to-canvas; strokes use normalized points. Blocking Issues: none. Next Subtask: center-preserving model geometry and tests. Known Risks: capture mask coordinates and existing assets.
- 2026-09-23 UTC: Added model resize, capture placement rendering and mask coordinate remapping, and workspace size dialog. Model and 29-test suite pass; browser checked 2:1 rendered stage/1800x900 canvas and Undo restoring 1:1.