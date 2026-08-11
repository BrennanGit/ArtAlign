# Tracking Meta Index

- Index created: {YYYY-MM-DD}
- Last updated: 2026-08-11 UTC

---

## Active Task Stack
- Top (current):
  - (empty)
- Stack:
  - (empty)

> Rules:
> - First entry is current active task.
> - Most recent tasks at top.
> - Only top task may be edited.
> - PUSH for prerequisite tasks.
> - POP when completed or blocked.
> - Do not pause at push/pop boundaries.

---
## Tasks

<!--
Format:

- [status] NNN-short-slug — Title (YYYY-MM-DD) — Owner
  Type: feature | refactor | bugfix | research | docs | infra
  Stability: experimental | beta | stable
  Files: path1, path2
  Functions: f1(), f2()
  Related: #MMM
-->

- [done] 000-demo — Demo task (2026-02-12) — Owner: agent
  Type: docs
  Stability: stable
  Files: .tracking/000-demo.md
  Functions: n/a
  Related: none

- [done] 001-implement-overlay-app — Implement Painting Proportion Overlay App (2026-08-10) — Owner: agent
  Type: feature
  Stability: experimental
  Files: index.html, styles.css, README.md, src/*.js, src/cv-worker.js, tests/*.test.mjs, tests/fixtures/reference.svg
  Functions: createProject(), CanonicalCompositor.rebuild(), ProjectionRenderer.render(), detectCanvasQuad(), CanvasTracker.track(), rectifySource()
  Related: none

- [done] 002-layer-first-ui — Layer-First Workspace UI (2026-08-10) — Owner: agent
  Type: feature
  Stability: experimental
  Files: .tracking/002-layer-first-ui.md, .tracking/meta.md, index.html, styles.css, README.md, src/model.js, src/app.js, tests/model.test.mjs
  Functions: layerCollection(), moveLayer(), removeLayer(), renderInspector(), layerRows(), editLayer(), beginLayerDrag(), updateLayerDrag(), updateModeChip(), finishCurrentMode(), redetectCanvas()
  Related: #001

- [done] 003-zoom-canvas-navigation — Zoom-Only Canvas Navigation (2026-08-10) — Owner: agent
  Type: feature
  Stability: experimental
  Files: .tracking/003-zoom-canvas-navigation.md, .tracking/meta.md, README.md, src/input.js, src/app.js, styles.css, tests/input.test.mjs
  Functions: zoomFocusFromPointer(), zoomViewAt(), wheelZoom(), beginPinchNavigation(), cancelProvisionalInteraction(), applyCanvasView()
  Related: #001, #002

- [done] 004-reference-rectification-orientation — Reference Rectification Orientation (2026-08-10) — Owner: agent
  Type: bugfix
  Stability: experimental
  Files: .tracking/004-reference-rectification-orientation.md, .tracking/meta.md, src/cv.js
  Functions: rectifySource(), createRectificationProgram()
  Related: #001

- [done] 005-projection-corner-mapping — Projection Corner Mapping (2026-08-10) — Owner: agent
  Type: bugfix
  Stability: experimental
  Files: .tracking/005-projection-corner-mapping.md, .tracking/meta.md, src/renderer.js
  Functions: ProjectionRenderer.render(), projection fragment shader
  Related: #001, #004

  Type: refactor
  Stability: experimental
  Files: .tracking/006-compact-layer-panel.md, .tracking/meta.md, src/app.js, styles.css
  Functions: renderInspector()
  Related: #002

- [done] 007-rename-artalign — Rename App to ArtAlign (2026-08-11) — Owner: agent
  Type: docs
  Stability: experimental
  Files: .tracking/007-rename-artalign.md, index.html, README.md, package.json, src/store.js
  Functions: openDatabase()
  Related: none

- [done] 008-mobile-inputs-empty-state — Mobile Input and Empty State Fixes (2026-08-11) — Owner: agent
  Type: bugfix
  Stability: experimental
  Files: index.html, styles.css, src/app.js, src/model.js, tests/model.test.mjs
  Functions: createProject(), refresh(), handleLayerTypeClick()
  Related: #003, #002

- [done] 009-loupe-magnification — Reduce Loupe Magnification (2026-08-11) — Owner: agent
  Type: bugfix
  Stability: experimental
  Files: src/app.js
  Functions: drawLoupe()
  Related: #004

- [done] 010-empty-canvas-surface — White Empty Canvas Surface (2026-08-11) — Owner: agent
  Type: bugfix
  Stability: experimental
  Files: styles.css
  Functions: n/a
  Related: #008

- [done] 011-compact-project-modal — Compact Project Modal (2026-08-11) — Owner: agent
  Type: refactor
  Stability: experimental
  Files: styles.css
  Functions: n/a
  Related: #006

- [done] 012-empty-reference-button — Empty Reference Button Hit Target (2026-08-11) — Owner: agent
  Type: bugfix
  Stability: experimental
  Files: styles.css
  Functions: n/a
  Related: #008

- [done] 013-panel-scrollbar — Panel Scrollbar Gesture Target (2026-08-11) — Owner: agent
  Type: bugfix
  Stability: experimental
  Files: styles.css
  Functions: n/a
  Related: #006

- [done] 014-photo-swipe-panning — Photo Swipe Panning (2026-08-11) — Owner: agent
  Type: feature
  Stability: experimental
  Files: .tracking/014-photo-swipe-panning.md, src/input.js, src/app.js, tests/input.test.mjs
  Functions: panViewByPointer(), pointerDown(), pointerMove(), pointerUp()
  Related: #003

- [done] 015-cancel-create-project — Cancel Create Project Form (2026-08-11) — Owner: agent
  Type: bugfix
  Stability: experimental
  Files: .tracking/015-cancel-create-project.md, index.html, src/app.js
  Functions: bindEvents(), createProjectFromForm()
  Related: #011

- [done] 016-reference-transform-controls — Reference Transform Controls (2026-08-11) — Owner: agent
  Type: feature
  Stability: experimental
  Files: .tracking/016-reference-transform-controls.md, .tracking/meta.md, src/input.js, src/app.js, tests/input.test.mjs
  Functions: applyReferenceHandle(), pointerDown(), pointerMove(), pointerUp(), drawReferenceSelection()
  Related: #002, #014

- [done] 017-field-interaction-layer — Field Interaction Layer (2026-08-11) — Owner: agent
  Type: feature
  Stability: experimental
  Files: .tracking/017-field-interaction-layer.md, .tracking/meta.md, README.md, index.html, styles.css, src/input.js, src/app.js, tests/input.test.mjs
  Functions: relativePointer(), applyReferenceHandle(), pointerDown(), pointerMove(), drawInteraction()
  Related: #003, #014, #016

- [done] 018-loupe-viewport-position — Viewport-Anchored Loupe (2026-08-11) — Owner: agent
  Type: bugfix
  Stability: experimental
  Files: .tracking/018-loupe-viewport-position.md, .tracking/meta.md, index.html, styles.css
  Functions: drawLoupe()
  Related: #003, #017

- [done] 019-mode-chip-left — Move Mode Chip Left (2026-08-11) — Owner: agent
  Type: bugfix
  Stability: experimental
  Files: .tracking/019-mode-chip-left.md, .tracking/meta.md, styles.css
  Functions: n/a
  Related: #008

- [done] 020-off-canvas-pinch-handles — Off-Canvas Pinch Focus and Local Corner Handles (2026-08-11) — Owner: agent
  Type: bugfix
  Stability: experimental
  Files: .tracking/020-off-canvas-pinch-handles.md, src/input.js, src/app.js, tests/input.test.mjs
  Functions: zoomFocusFromPointer(), nearestCorner(), beginPinchNavigation(), pointerDown()
  Related: #003, #017

---

## Status Legend

- planned — task defined but not started
- in-progress — currently executing (may be on stack)
- blocked — awaiting clarification/input
- done — fully implemented and verified

---

## Maintenance Checklist (Agent Reminder)

Before working:
- Read this file.
- Identify top of stack.
- Confirm status matches reality.

After working:
- Update Last updated timestamp.
- Update Files/Functions map.
- POP if complete.
- Ensure stack reflects reality.
