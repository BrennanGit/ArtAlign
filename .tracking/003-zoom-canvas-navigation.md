# Task #003: Zoom-Only Canvas Navigation

- ID: #003-zoom-canvas-navigation
- Created: 2026-08-10 UTC
- Status: done
- Type: feature
- Stability: experimental
- Owner: agent
- Related: #001-implement-overlay-app, #002-layer-first-ui
- Self-reminder: Read meta.md first; plan -> execute -> verify -> update.

## Summary

Restore persistent canvas navigation in every canvas-bearing view using zoom only: wheel zoom centered under the mouse cursor and pinch zoom centered at the pinch point, with no one-pointer canvas translation competing with editing tools.

## Acceptance Criteria

- [x] Mouse wheel zoom works in canonical, photo, and live views and preserves the canvas point under the cursor.
- [x] Two-pointer pinch zoom works in every interaction mode and preserves its initial midpoint.
- [x] Single-pointer drawing, masking, reference manipulation, and corner editing remain unchanged.
- [x] Beginning a pinch cancels any provisional edit made by the first touch and does not resume that edit until all pinch pointers lift.
- [x] Zoom supports useful in/out limits, persists in `project.view`, and causes no document overflow.
- [x] Focused tests and desktop/mobile browser checks pass.
- [x] Wheel events over the viewport but outside the transformed canvas zoom around the canvas center instead of being ignored.

## Design Contracts

- Keep navigation zoom-only; focal compensation may update persisted `panX`/`panY`, but direct one-pointer panning is not allowed.
- Apply navigation to the whole stage so canonical, photo, live, overlays, handles, and notices stay registered.
- Existing normalized input coordinates must continue to address source canvas space after zoom.

## Plan

- [x] Focal zoom geometry — Files: `src/input.js`, `tests/input.test.mjs` — Functions: `zoomViewAt()` — Verification: focused screen-position invariant and clamp tests.
- [x] Navigation controller — Files: `src/app.js`, `styles.css` — Functions: `wheelZoom()`, pinch lifecycle, `applyCanvasView()` — Verification: full tests and diagnostics.
- [x] Browser verification — Files: no production edits expected — Verification: canonical/photo wheel focus, drawing isolation, mobile pinch simulation, persistence, and overflow.
- [x] Outside-canvas wheel fallback — Files: `index.html`, `src/input.js`, `src/app.js`, `tests/input.test.mjs` — Functions: `zoomFocusFromPointer()`, `wheelZoom()` — Verification: inside focus remains exact and outside hover uses center.

## Execution Log

* 2026-08-10 UTC Start-of-turn Context Recap:

  * Goal: Enable zoom-only canvas navigation in every view without conflicting with one-pointer editing.
  * Current State: `project.view` persists pan/zoom values but no renderer or input path consumes them; two pointers currently manipulate reference items.
  * Blocking Issues: Browser automation cannot synthesize native touchscreen pinch, so Pointer Events will be dispatched through the real interaction handler.
  * Next Subtask: Add and validate focal zoom geometry.
  * Known Risks: A pinch begins as one pointer, so provisional drawing/mask/corner/reference edits must be rolled back when the second pointer arrives.

* 2026-08-10 UTC Completion:

  * Added immutable focal zoom geometry with 25%-800% limits and persisted pan compensation that keeps the selected content point stationary.
  * Applied `project.view` to the complete stage so canonical, photo, live video, projected overlays, handles, and notices navigate together.
  * Added non-passive wheel zoom at cursor position and client-space two-pointer pinch zoom at the initial midpoint.
  * Pinch ownership rolls back provisional strokes, masks, corners, and reference transforms from the first touch, then suppresses editing until all pinch pointers lift.
  * Browser verification: wheel focal drift was 0.00040 in Photo, 0.00045 in canonical, and 0.00016 in Live; no document overflow occurred.
  * A 2.5x pinch in Draw mode preserved the existing one-stroke count, while the next one-pointer pen gesture increased it to two; Live retained its active track during zoom and stopped it on exit.
  * The exact CSS navigation matrix survived save/reload. Verification: 21/21 tests pass and changed-file diagnostics are clean.

* 2026-08-10 UTC Outside-focus iteration:

  * Goal: Accept wheel zoom anywhere in the painting viewport and center zoom when the hover point is outside the transformed canvas.
  * Current State: Wheel events are owned by `interactionCanvas`, so dark viewport space never reaches `wheelZoom()`.
  * Next Subtask: Move wheel ownership to the viewport and distinguish inside focal points from the centered fallback.
  * Known Risks: Wheel events originating over the canvas will bubble to the viewport, so only one listener must remain.

* 2026-08-10 UTC Outside-focus completion:

  * Wheel ownership moved from the interaction canvas to the painting viewport, so dark space around a zoomed-out canvas receives navigation input.
  * Added `zoomFocusFromPointer()`: inside points retain their normalized focus while outside points use canvas center `{ x: 0.5, y: 0.5 }`.
  * Browser verification: an outside wheel gesture zoomed 1.51x while canvas-center drift was 0.000007px; inside focal drift remained 0.0002 and no overflow occurred.
  * Verification: 22/22 tests pass and changed-file diagnostics are clean.

## Artifacts Changed

* `src/input.js`, `tests/input.test.mjs` — focal zoom geometry and invariants.
* `src/app.js` — wheel/pinch navigation, stage transforms, persistence, and provisional-edit rollback.
* `styles.css` — transformed stage origin and viewport clipping.
* `README.md` — zoom-only navigation workflow.

## Final Summary

Implemented persistent zoom-only canvas navigation across canonical, photo, and live views, centered on the wheel cursor or pinch point without consuming one-pointer editing gestures.

## Useful Commands and Testing

* `node --test tests/input.test.mjs`
* `npm test`
* Browser smoke checks at `http://localhost:8080/`
