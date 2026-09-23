# Task #037: Linked Layer Transform

- ID: #037-linked-layer-transform
- Created: 2026-09-23 UTC
- Status: done
- Type: feature
- Owner: agent
- Related: #036-drawing-transform

## Summary

Allow checked layers to follow the active layer during transform gestures.

## Acceptance Criteria

- [x] While transforming a reference or drawing, each layer row offers a multi-select checkbox; the reference group selects its children.
- [x] Checked layers follow the same translation, scale ratio and rotation, with positions adjusted around the active layer's pivot; unchecked layers remain unchanged.
- [x] Captures and guides can participate; grouped gestures remain one undoable edit and cancel cleanly on pinch.
- [x] Tests cover linked transform math and full suite passes.

## Plan

- [x] Add generic transform rendering to capture and guide layers. Files: `src/canonical.js`, `src/model.js`, `tests/canvas-resize.test.mjs`; Functions: `CanonicalCompositor.rebuild()`, `createCaptureLayer()`, `createGuideLayer()`; Verify: focused rendering tests.
- [x] Add linked transform delta calculation. Files: `src/input.js`, `tests/input.test.mjs`; Functions: `applyLinkedTransform()`; Verify: focused input tests including non-square canvas.
- [x] Add checkbox state, reference-group selection and multi-layer gesture rollback. Files: `src/app.js`, `styles.css`; Functions: `layerRow()`, `handleInspectorChange()`, `pointerDown()`, `pointerMove()`, `cancelProvisionalInteraction()`; Verify: browser workflow and suite.
- [x] Update usage and coordinate documentation. Files: `README.md`, `.tracking/architecture.md`; Verify: UI matches documented behavior.

## Execution Log

- 2026-09-23 UTC: Intake: second independently deliverable feature. Transform selection is transient; use checkboxes (multiple layers can be selected) and preserve the active layer as the gesture driver.
- 2026-09-23 UTC: Start-of-turn Context Recap: Goal: linked layer transforms across checked rows. Current State: drawing and reference handles work separately; captures and guides have no generic transform. Blocking Issues: none. Next Subtask: add transform rendering for captures/guides and linked delta math. Known Risks: grouped pivot, aspect ratio, reference-group check state and pinch cancellation.
- 2026-09-23 UTC: Added capture/guide transforms, pixel-space linked delta, temporary layer checkboxes and grouped rollback. Browser verified checked drawing/guide move together, unchecked guide stays put, undo restores both in one step, and pinch cancellation restores both. Desktop/mobile screenshots checked handle visibility and row layout. Full suite: 36/36 passing; editor diagnostics clear.