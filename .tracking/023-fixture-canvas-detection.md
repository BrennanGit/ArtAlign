# Task #023: Fixture Canvas Detection

- ID: #023-fixture-canvas-detection
- Created: 2026-08-11 UTC
- Status: done
- Type: bugfix
- Stability: experimental
- Owner: agent
- Related: #021-opencv-runtime, #022-opencv-status-chip

## Summary

Make automatic contour detection find the postcard in `tests/fixtures/canvas.jpg` and preserve useful confidence for canvases that occupy a modest portion of the frame.

## Acceptance Criteria

- [x] The fixture returns the lower-centre postcard quad from the real worker.
- [x] The detector still rejects weak or implausible candidates and keeps worker isolation.
- [x] The UI reports successful fixture detection with useful confidence.
- [x] Existing tests, diagnostics, and a browser smoke check pass.

## Plan

- [x] Add a low-threshold, morphologically closed contour pass that can join the postcard edges.
- [x] Adjust confidence normalization and verify the fixture detection path.
- [x] Verify the fixture quad, existing detection behavior, and UI feedback.

## Execution Log

- 2026-08-11 UTC Start-of-turn Context Recap: Goal: find why `tests/fixtures/canvas.jpg` does not detect the lower-centre postcard. Current State: the worker returns `null`; the existing 55/165 Canny plus external-contour pipeline produces no usable quadrilateral. Blocking Issues: none. Next Subtask: test the same pipeline with lower thresholds and edge closing. Known Risks: relaxing edges could select the window or other room rectangles.
- 2026-08-11 UTC: Browser contour instrumentation found the postcard only with 25/75 Canny, a 5x5 close, and `RETR_LIST`; the candidate covers 4.1% of the frame and is the only viable quad under that configuration. Existing `score / 0.55` normalization rates it at 6.7% and the 20% UI gate rejects it.
- 2026-08-11 UTC: Updated the worker to use 25/75 Canny, a 5x5 morphological close, `RETR_LIST`, a 1% contour prefilter, and score normalization over 0.08. The real fixture worker returns the lower-centre postcard at 45.99% confidence; the Photo UI reports `Canvas detected · 46%` and persists the expected quad. Node suite passes 24/24 and diagnostics are clean.

## Artifacts Changed

* `src/cv-worker.js`, `src/cv.js`, `src/app.js`, `index.html`, `tests/cv.test.mjs`, `.tracking/meta.md`
