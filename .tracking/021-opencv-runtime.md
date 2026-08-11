# Task #021: OpenCV Runtime Integration

- ID: #021-opencv-runtime
- Created: 2026-08-11 UTC
- Status: done
- Type: bugfix
- Stability: experimental
- Owner: agent
- Related: #001-implement-overlay-app

## Summary

Make automatic OpenCV detection and tracking initialize reliably in browsers, especially when OpenCV.js is loaded asynchronously, and expose actionable diagnostics when the runtime or worker fails.

## Acceptance Criteria

- [x] OpenCV.js initialization resolves its actual runtime object in both the main thread and detection worker.
- [x] Automatic detection reports bounded, actionable failures instead of hanging indefinitely.
- [x] Existing tests pass and focused runtime behavior is covered where practical.
- [x] README/runtime notes match the implementation.

## Plan

- [x] Normalize OpenCV.js runtime initialization and worker error handling in `src/cv.js` and `src/cv-worker.js`.
- [x] Add focused tests for loader/runtime edge cases that do not require a browser.
- [x] Verify with tests and a bounded browser smoke check.

## Execution Log

- 2026-08-11 UTC Start-of-turn Context Recap: Goal: get OpenCV detection and tracking working. Current State: detection uses a disposable worker and both loaders assume `cv` is either immediately usable or a Promise, while the browser runtime may expose an asynchronous Module object. Blocking Issues: none. Next Subtask: confirm the runtime contract and patch the smallest shared loader path. Known Risks: cross-origin worker loading, OpenCV.js version behavior, and browser automation hangs.
- 2026-08-11 UTC: Existing Node suite passes 23/23; pinned OpenCV asset responds with HTTP 200.
- 2026-08-11 UTC: Reproduced the worker hang with a 64x64 synthetic frame. OpenCV 4.13 exposed a thenable Emscripten module; `Promise.resolve(self.cv)` and resolving a Promise with `self.cv` both assimilated indefinitely.
- 2026-08-11 UTC: Kept detection in the disposable worker, normalized the runtime by removing its startup-only `then` method after `Mat` becomes available, and versioned the worker URL to avoid stale cached worker code.
- 2026-08-11 UTC: Verification: exported `detectCanvasQuad()` returned the synthetic rectangle in 2.975s; feature-rich `CanvasTracker` initialized 80 features and tracked with confidence 0.99999998; Node suite passes 23/23; diagnostics are clean.
- 2026-08-11 UTC Follow-up: UI probe showed the app still created an unversioned `/src/cv-worker.js`, so the browser was running cached pre-fix `cv.js`. Add versioned entry/module URLs and re-verify the actual Redetect workflow.
- 2026-08-11 UTC: Added `runtime=2` cache-busting to the app entry and `cv.js` import. Browser verification: the UI created `/src/cv-worker.js?runtime=2`, returned a quad, and changed the status to `Canvas detected`; current tracker initialized 80 features and tracked with confidence 0.999999985.

## Artifacts Changed

* `src/cv.js`, `src/cv-worker.js`, `src/app.js`, `index.html`, `tests/cv.test.mjs`, `README.md`, `.tracking/meta.md`
