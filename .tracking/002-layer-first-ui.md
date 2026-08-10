# Task #002: Layer-First Workspace UI

- ID: #002-layer-first-ui
- Created: 2026-08-10 UTC
- Status: done
- Type: feature
- Stability: experimental
- Owner: agent
- Related: #001-implement-overlay-app
- Self-reminder: Read meta.md first; plan -> execute -> verify -> update.

## Summary

Make the layer stack the primary workspace navigation, replace persistent tool/status bars with compact icon controls, and keep manual corner adjustment visibly composited even while automatic OpenCV detection is pending.

## Acceptance Criteria

- [x] The bottom and viewport status bars are removed; a compact bottom-right Layers button opens and closes the layer panel.
- [x] Layers can be added, selected, renamed, deleted, reordered vertically, toggled, and adjusted horizontally for opacity.
- [x] Each layer has a compact edit action that selects its appropriate editing mode.
- [x] Adding a drawing layer creates it and enters Draw mode; adding a reference invokes image selection and enters Reference mode after import.
- [x] Compact Photo and Live icon buttons occupy the top-right header; the old Add reference header action is removed.
- [x] Drawing colour and eyedropper controls are compact and adjacent.
- [x] Manual corner dragging always displays the projected overlay, including while or after OpenCV detection fails.
- [x] Unit tests and desktop/mobile browser smoke checks pass with no overlap or horizontal overflow.
- [x] Photo and Live header buttons toggle their active view off to canonical View mode and expose pressed state.
- [x] On phone viewports, Layers rises from the bottom-right, stays at or below half the viewport height, spans the orientation's long horizontal extent, and scrolls internally.
- [x] A compact top-right viewport chip shows the current mode and provides a tick to exit every noncanonical mode without opening Layers.

## Design Contracts

- Keep the reference group as the canonical base; reorder reference children within the group and drawing/capture layers within the top-level stack.
- Preserve source assets when deleting metadata unless an asset is no longer referenced by any project layer.
- Use Pointer Events and directional intent: horizontal movement changes opacity; vertical movement reorders.
- Keep explicit project modes as the only authority for canvas interactions.

## Plan

- [x] Layer operations — Files: `src/model.js`, `tests/model.test.mjs` — Functions: `layerCollection()`, `moveLayer()`, `removeLayer()` — Verification: focused model tests.
- [x] Layer-first interactions — Files: `index.html`, `src/app.js` — Functions: panel rendering, add modal, edit dispatch, directional drag, rename/delete — Verification: full unit suite and browser interaction checks.
- [x] Responsive visual overhaul — Files: `styles.css` — Functions: compact header tools, floating layer trigger/panel, layer rows, opacity fill — Verification: desktop/mobile screenshots and overflow checks.
- [x] Manual corner preview and cleanup — Files: `src/app.js`, `README.md` if needed — Functions: `redetectCanvas()`, `pointerMove()` — Verification: browser preview during pending/fallback detection, diagnostics, full test suite.
- [x] Camera view toggles — Files: `index.html`, `src/app.js` — Functions: `togglePhotoView()`, `toggleLiveView()`, `setView()` — Verification: browser Photo/Live activation and deactivation checks.
- [x] Mobile bottom sheet — Files: `styles.css` — Functions: responsive `.inspector` geometry/transition — Verification: portrait and landscape browser dimensions, scrolling, screenshots, and overflow checks.
- [x] Viewport mode chip — Files: `index.html`, `src/app.js`, `styles.css` — Functions: `updateModeChip()`, `finishCurrentMode()` — Verification: Drawing/Reference/Photo labels, direct exits, mobile geometry, and accessibility state.

## Execution Log

* 2026-08-10 UTC Start-of-turn Context Recap:

  * Goal: Replace the persistent tool UI with a Photoshop-like layer-first workflow and reliable manual-corner preview.
  * Current State: Prior overhaul edits were reverted; the original bottom bar, status strip, monolithic inspector, and fixed model arrays are authoritative.
  * Blocking Issues: Browser automation cannot provide a representative physical rear-camera stream.
  * Next Subtask: Add tested pure layer collection, reorder, and removal operations.
  * Known Risks: Directional layer gestures must not conflict with row actions, range controls, or canvas Pointer Events.

* 2026-08-10 UTC Completion:

  * Replaced the bottom navigation and viewport status strip with compact Photo/Live header controls, a bottom-right Layers trigger, and a responsive floating panel.
  * Added type-based layer creation, inline rename, visibility, delete with unused-asset cleanup, edit-mode dispatch, horizontal opacity dragging, and vertical reordering within valid compositor collections.
  * Moved the colour-key eyedropper beside its colour swatch and made closed layer controls inert.
  * Manual corner grabs now cancel pending detection and explicitly hold the projected overlay at 0.72 opacity.
  * Verification: 20/20 tests pass; diagnostics are clean; desktop 1280x800 and mobile 390x844 have no overflow; opacity drag reached 69%, vertical reorder changed row order, reference import exposed the compact eyedropper, inline rename survived reload, and WebGL opacity remained 0.72 before/after a manual corner drag.

* 2026-08-10 UTC Camera-toggle iteration:

  * Goal: Make the Photo and Live header controls toggle back to the standard canonical View mode when selected a second time.
  * Current State: Both controls dispatch their activation path unconditionally; `setView("canonical")` already owns live-stream shutdown.
  * Next Subtask: Add view-aware handlers and pressed-state synchronization, then verify both cycles in-browser.
  * Known Risks: Live deactivation must stop media tracks and pending detection without changing the stored still-photo source.

* 2026-08-10 UTC Camera-toggle completion:

  * Photo and Live now return to canonical `VIEW` mode when their active header button is selected again.
  * Button active styling, `aria-pressed`, labels, and tooltips synchronize with the current view.
  * Browser verification: Photo toggled from pressed to canonical/unpressed; Live toggled from a live canvas-backed `MediaStream` to canonical/unpressed, stopped its track, and cleared `video.srcObject`.
  * Verification: 20/20 tests pass and changed-file diagnostics are clean.

* 2026-08-10 UTC Mobile-panel iteration:

  * Goal: Make the phone Layers panel rise from the bottom-right and occupy at most the bottom half in both orientations.
  * Current State: The mobile override retains desktop top/bottom constraints and the horizontal off-screen transform, producing a nearly full-height side drawer.
  * Next Subtask: Override mobile geometry and transform, then verify portrait/landscape bounds and internal scrolling.
  * Known Risks: Landscape phone widths exceed the existing 760px breakpoint, so orientation coverage must include short, moderately wide viewports.

* 2026-08-10 UTC Mobile-panel completion:

  * Phone Layers is now a bottom-right sheet with a vertical entrance/exit, near-full orientation width, internal scrolling, and a strict `50dvh` maximum height.
  * Added short-screen landscape coverage up to 960px wide so rotated phones retain the bottom-sheet behavior.
  * Browser verification: portrait measured 374x422 at 390x844; landscape measured 828x195 at 844x390; both were scrollable, half-height or less, and free of document overflow.
  * The closed landscape sheet moved fully below the viewport with its transform origin at the bottom-right.
  * Verification: 20/20 tests pass and stylesheet diagnostics are clean.

* 2026-08-10 UTC Mode-chip iteration:

  * Goal: Replace the oversized persistent canvas notice with a compact top-right mode label and direct Done action.
  * Current State: `trackingLabel` sits inside the zoomed stage and mixes persistent canvas labels with transient CV status messages.
  * Next Subtask: Split visible mode state from the live status announcer and add context-aware mode completion.
  * Known Risks: Reference rectification must apply rather than silently discard work; Photo/Live completion must retain existing camera teardown behavior.

* 2026-08-10 UTC Mode-chip completion:

  * Replaced the zoomed stage notice with a fixed viewport-level mode chip at the top-right; transient tracking text remains available through an invisible live-region announcer.
  * The chip labels Canonical canvas, Drawing, Reference, Mask, Eyedropper, Photo/Live corners, and reference rectification from actual interaction state.
  * A compact tick appears for every noncanonical state: Drawing and Reference return directly to canonical View, Photo/Live return and tear down camera state, and rectification applies its result.
  * Browser verification: Drawing and Reference exited with Layers closed; Live stopped its track and cleared `video.srcObject`; Photo corners returned to the visible canonical editor.
  * Desktop active size measured 87x34 at a 10px top/right inset; mobile Photo measured 115x34 at an 8px inset; the chip did not move during stage zoom and caused no overflow.
  * Verification: 22/22 tests pass, diagnostics are clean, and the mobile Drawing screenshot shows no overlap.

## Decisions

* Preserve the reference group boundary because it is a compositing and transform contract, while presenting it alongside ordinary layers in one visual panel.
* Use icon-only workspace commands with accessible labels/tooltips, and keep textual controls only for names and values.

## Useful Commands and Testing

* `npm test`
* Browser smoke checks at desktop and mobile viewport sizes against `http://localhost:8080/`

## Artifacts Changed

* `index.html`, `styles.css` — compact workspace shell, add-layer dialog, floating layer panel, row gestures, and responsive layouts.
* `src/app.js` — layer-first workflows, inline rename/delete, directional gestures, edit dispatch, and manual-corner preview behavior.
* `src/model.js`, `tests/model.test.mjs` — pure layer ownership, reorder, and removal contracts with focused tests.
* `README.md` — updated layer-first workflow.

## Final Summary

Implemented and browser-verified the layer-first workspace overhaul, including compact camera controls, full layer management, type-based creation, direction-aware row gestures, adjacent colour picking, and reliable projected preview during manual corner adjustment.
