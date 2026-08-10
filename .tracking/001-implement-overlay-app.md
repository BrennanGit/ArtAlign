# Task #001: Implement Painting Proportion Overlay App

- ID: #001-implement-overlay-app
- Created: 2026-08-10 UTC
- Status: done
- Type: feature
- Stability: experimental
- Owner: agent
- Related: none
- Self-reminder: Read meta.md first; plan -> execute -> verify -> update.

## Summary

Implement the client-side painting proportion overlay application described in `spec.md` as a static, mobile-first web app suitable for GitHub Pages.

## Requirements

- Preserve canonical canvas space as the source of truth and keep reference transforms separate from camera projection.
- Support local projects, composable references, captures, scribbles, generic raster masks/colour key settings, still photos, live camera, corner correction, and perspective projection.
- Use IndexedDB autosave, Pointer Events, WebGL display compositing, and OpenCV.js for detection/rectification when available.
- Provide responsive iPhone and desktop workflows with explicit interaction modes.

## Acceptance Criteria

- [x] Projects can be created, reopened, renamed, and deleted with IndexedDB persistence.
- [x] Multiple references can be imported, transformed, flipped, blended, keyed, masked, and edited non-destructively in canonical space.
- [x] Scribble layers support pen/eraser, colour/width, undo/redo, clear, and persistence.
- [x] Still and live modes share a WebGL projection path with editable quadrilateral corners, loupe, redetection, and graceful tracking/searching state.
- [x] Painting frames can be rectified into canonical capture layers and compared using opacity/blend/visibility controls.
- [x] The responsive UI works at mobile and desktop sizes and survives WebGL context restoration.
- [x] Focused automated geometry/store checks and browser smoke checks pass.
- [x] Live OpenCV tracking remains responsive instead of processing every decoded camera frame synchronously.
- [x] Mask erasing previews continuously with a correctly sized brush cursor.
- [x] Drawing consumes coalesced pointer samples and renders smooth strokes.
- [x] Photo mode exposes a clear action to add the registered photo as a new layer.

## Out of Scope

- Cross-device sync, accounts, backend processing, export/import, lens calibration, and arbitrary nested layer groups.
- Production tuning of handheld optical-flow tracking on physical iPhone hardware; the implementation exposes reacquisition and confidence behavior for real-device tuning.

## Design Contracts (Do Not Break)

- Persist source images and masks independently from metadata; metadata autosaves must not rewrite image blobs.
- Reference item transforms map source image coordinates into canonical coordinates; the observed canvas quadrilateral is a separate final projection.
- Still photos and live video use the same `ProjectionRenderer` API.
- Drawing tools mutate data only while their explicit mode is active.

## Plan

- [x] Project foundation and architecture — Files: `index.html`, `styles.css`, `src/model.js`, `src/store.js`, `.tracking/architecture.md` — Functions: project factories, IndexedDB repositories — Verification: load modules and run store fallback checks.
- [x] Canonical editor — Files: `src/canonical.js`, `src/input.js`, `src/app.js` — Functions: reference transforms, masks, scribble strokes, hit testing — Verification: geometry tests and pointer workflow smoke test.
- [x] Projection and CV — Files: `src/geometry.js`, `src/renderer.js`, `src/cv.js` — Functions: homography, WebGL compositor, quad detection, rectification — Verification: identity/perspective unit checks and renderer smoke test.
- [x] Responsive application workflows — Files: `index.html`, `styles.css`, `src/app.js` — Functions: project list, dialogs, inspectors, still/live/capture flows — Verification: desktop/mobile browser screenshots and console check.
- [x] Tests/Verification — Files: `tests/*.test.mjs`, `README.md` — Run Node tests, browser smoke checks, and static asset checks.

## Execution Log

* 2026-08-10 UTC Start-of-turn Context Recap:

  * Goal: Implement `spec.md` end to end as a static client-side application.
  * Current State: Only the specification and tracking scaffold exist; no application code is present.
  * Blocking Issues: OpenCV export/runtime behavior and real iPhone tracking cannot be fully validated locally.
  * Next Subtask: Establish the static app shell, project model, and persistence boundary.
  * Known Risks: Broad feature surface; live CV performance requires later physical-device tuning.

* 2026-08-10 UTC Start-of-turn Context Recap:

  * Goal: Resume and complete the static painting proportion overlay application.
  * Current State: Model, IndexedDB store, homography geometry, canonical compositor, and WebGL projection renderer are present; app shell, input workflows, CV integration, and browser verification remain.
  * Blocking Issues: No Git metadata is present; real rear-camera behavior still requires physical-device validation.
  * Next Subtask: Validate the existing pure modules, then implement the browser shell and explicit interaction controller.
  * Known Risks: Existing modules have not yet been integrated in a browser, so API mismatches may surface at the first smoke test.

* 2026-08-10 UTC Start-of-turn Context Recap:

  * Goal: Continue the interrupted mobile smoke check and complete the remaining specification requirements.
  * Current State: Project CRUD, reference import/composition, scribbles, shared WebGL still/live projection, manual corners, and loupe are integrated; 14 focused tests and the initial desktop browser smoke check pass.
  * Blocking Issues: Representative rear-camera optical-flow behavior still requires physical iPhone validation.
  * Next Subtask: Fix and verify the mobile inspector toggle, then implement the missing CV detection/rectification, capture, and mask workflows.
  * Known Risks: OpenCV is network-loaded and must fail gracefully; browser automation cannot provide a physical handheld camera feed.

* 2026-08-10 UTC Start-of-turn Context Recap:

  * Goal: Resume after the mask workflow interruption and finish the remaining specification requirements.
  * Current State: Mobile inspector toggling, CV detection/rectification, painting capture, and generic manual-mask editing have been added; the new transformed-reference mask-coordinate test is pending validation.
  * Blocking Issues: Representative rear-camera optical-flow behavior still requires physical iPhone validation.
  * Next Subtask: Run the focused tests, repair the mask slice if needed, then add confidence-aware live tracking and finish browser verification.
  * Known Risks: OpenCV is network-loaded; browser automation cannot reproduce handheld camera motion or validate optical-flow tuning on iPhone hardware.

* 2026-08-10 UTC Start-of-turn Context Recap:

  * Goal: Resume the interrupted live-tracking implementation and complete all remaining acceptance criteria.
  * Current State: The reusable OpenCV `CanvasTracker` and confidence tests are present but unvalidated and not yet connected to the live camera lifecycle; earlier model, persistence, geometry, editor, mask, capture, and responsive slices are implemented.
  * Blocking Issues: Representative rear-camera optical-flow tuning still requires physical iPhone validation.
  * Next Subtask: Validate the tracker confidence contract, then wire tracking, confidence fade, and reacquisition into live mode.
  * Known Risks: OpenCV is network-loaded, and automated browser tests cannot provide representative handheld camera motion.

* 2026-08-10 UTC Completion:

  * Implemented confidence-aware optical-flow tracking, overlay suppression, and throttled reacquisition for Live mode.
  * Added non-destructive reference rectification with original-source retention, manual corners, loupe, and generated canonical derivatives.
  * Completed generic raster colour keying/masking, isolated eyedropper preview, functional brush hardness, and layer-local scribble erasing.
  * Verified project creation/import/reopen, reference group Done/Edit behavior, isolated eyedropper pixels, mobile and desktop layout, and WebGL context loss/restoration in Chromium.
  * Verification: `npm test` passes 17/17; workspace diagnostics report no errors; mobile viewport has no horizontal overflow; WebGL loss/restoration reports `glError = 0`.
  * Residual: OpenCV initialization and handheld optical-flow tuning still require validation on the target physical iPhone.

* 2026-08-10 UTC Live-freeze iteration:

  * Goal: Fix the browser process freeze reported immediately after live canvas acquisition.
  * Current State: Live tracking synchronously runs 480px, 120-feature, three-level optical flow from every `requestVideoFrameCallback` with no frame budget or throttle.
  * Hypothesis: Continuous main-thread OpenCV work starves rendering and input once the initial corner handles are replaced by tracking.
  * Next Subtask: Add a tested tracking cadence policy, lower per-frame CV cost, and verify the UI yields between tracking samples.
  * Known Risks: Physical camera performance still varies by device; default cadence must favor responsiveness over maximum tracking frequency.

* 2026-08-10 UTC Live-freeze completion:

  * Root cause: automatic contour detection ran synchronous OpenCV WASM on the UI thread after handles were painted; Live also combined every-frame optical flow with redundant 1800px overlay texture uploads.
  * Fix: moved contour detection into a cancellable, timed Web Worker; reduced optical-flow dimensions/features/pyramid cost; capped tracking near 8 Hz with an 80 ms minimum UI yield; capped camera requests at 1080p; and pause tracking when one sample exceeds 250 ms.
  * Renderer: unchanged overlays now upload once, and live rendering follows decoded video frames rather than monitor refresh.
  * Verification: 18/18 tests pass; repeated projection renders add zero texture uploads; rectification retained 102/100 expected UI heartbeats over five seconds while detection ran; Cancel aborts the worker without stale state.

* 2026-08-10 UTC Editor-input iteration:

  * Goal: Add live mask feedback, smoother drawing, and an obvious Photo-to-layer action.
  * Current State: Mask pixels update in memory but the compositor reads only the persisted mask asset until pointer-up; pointer movement stores one browser event rather than coalesced samples; Photo capture is buried under the mobile inspector.
  * Next Subtask: Add tested coalesced point collection, then wire in-memory mask overrides and visible Photo controls.
  * Known Risks: Rebuilding a full canonical texture on every raw pointer event would be expensive, so live previews must be frame-throttled.

* 2026-08-10 UTC Editor-input completion:

  * Masking: canonical compositing accepts the active in-memory mask, rebuilds are serialized to animation frames, and the interaction canvas shows the transformed brush footprint.
  * Drawing: Pointer Events consume `getCoalescedEvents()` samples and scribble rendering uses quadratic interpolation through the saved vector points.
  * Photo layers: Photo mode exposes an always-visible **Add photo layer** action; rectification uses an offscreen WebGL homography rather than loading a second OpenCV runtime.
  * Reliability: duplicate add operations are suppressed and pending canvas detection is aborted before the canonical layer transition.
  * Verification: mask center alpha changed from 255 to 0 before pointer-up; cursor rendered 717 footprint pixels; one coalesced move persisted all eight samples plus pointer-down; identity WebGL rectification preserved asymmetric top/bottom colors; double invocation created exactly one `Photo 01` layer.

## Decisions

* Use build-free native ES modules — preserves simple GitHub Pages deployment and keeps the project auditable without a toolchain.
* Use Canvas 2D to rebuild the canonical overlay texture and WebGL for final background/projection composition — aligns with the required rendering ownership while keeping layer editing practical.
* Load pinned official OpenCV 4.13 asynchronously — app startup and manual-corner workflows remain usable when WASM/CV loading fails.

## Open Questions

* None blocking; implementation defaults follow the specification.

## Risks

* OpenCV.js is large and network-dependent during development — Mitigation: pin the official version and keep a clear vendoring path in documentation.
* Browser automation cannot grant representative rear-camera behavior — Mitigation: test fallback states and document the iPhone verification checklist.

## Useful Commands and Testing

* `python -m http.server 8080`
* `node --test tests/*.test.mjs`

## Artifacts Changed

* `index.html`, `styles.css` — responsive application shell and controls.
* `src/app.js` — project, editor, still/live, rectification, capture, mask, and autosave workflows.
* `src/canonical.js`, `src/input.js` — canonical compositing and Pointer Events geometry.
* `src/cv.js`, `src/geometry.js`, `src/renderer.js` — detection/tracking, homographies, and shared WebGL projection.
* `src/model.js`, `src/store.js` — serializable layer contracts and independent IndexedDB asset persistence.
* `tests/*.test.mjs`, `tests/fixtures/reference.svg` — 17 focused automated checks and browser fixture.
* `README.md` — local run, deployment, workflow, browser requirements, and real-device verification notes.

## Final Summary

Implemented the complete static True Plane workflow from canonical reference composition through still/live physical-canvas projection and persistent rectified painting captures. Automated tests and desktop/mobile browser smoke checks pass; physical iPhone camera-motion tuning remains the documented device-specific follow-up.