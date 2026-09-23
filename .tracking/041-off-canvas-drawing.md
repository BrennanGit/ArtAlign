# Task #041: Off-Canvas Drawing

- ID: #041-off-canvas-drawing
- Created: 2026-09-23 UTC
- Status: done
- Type: bugfix
- Owner: agent
- Related: #036-drawing-transform

## Summary

Allow drawing input outside the canvas and preserve source marks when a layer transform brings them onto it.

## Acceptance Criteria

- [x] Pen, eraser, and straight-line drawing accept unclamped input anywhere in the viewport, including coalesced samples and line release; masks and corners retain their existing bounds.
- [x] Off-canvas drawing points remain available to the compositor when transformed onto the canvas; export and undo keep the same canonical content.
- [x] Off-canvas drawing marks are visible in the surrounding field while editing, without extending the exported/projection texture.
- [x] Focused input and compositor tests and full suite pass; usage and coordinate documentation reflect the behavior.

## Plan

- [x] Route raw stage-relative samples to drawing only. Files: `src/app.js`, `src/input.js`, `tests/input.test.mjs`; Functions: `pointerDown()`, `pointerMove()`, `pointerUp()`, `relativePointerSamples()`; Verify: `node --test tests/input.test.mjs`.
- [x] Preserve source strokes outside unit bounds and preview them in the surrounding field. Files: `src/canonical.js`, `src/app.js`, `tests/canvas-resize.test.mjs`; Functions: `CanonicalCompositor.#drawScribble()`, `CanonicalCompositor.drawSurroundings()`, `drawTransformedCanvas()`, `drawInteraction()`; Verify: `node --test tests/canvas-resize.test.mjs` and live browser pixels.
- [x] Update usage and coordinate documentation. Files: `README.md`, `.tracking/architecture.md`, `index.html`; Verify: `npm test` and inspect diff.

## Execution Log

- 2026-09-23 23:03 UTC: Start-of-turn Context Recap: Goal: draw in viewport space outside the canvas and transform those strokes back into view. Current State: viewport captures off-canvas events, but drawing uses clamped points and its intermediate raster clips source strokes. Blocking Issues: none. Next Subtask: use raw points for drawing while leaving mask/corner bounds unchanged. Known Risks: transformed source clipping, eraser isolation, and off-canvas marks not being visible until they are moved into the canonical canvas.
- 2026-09-23 23:03 UTC: Drawing starts, coalesced samples, and line releases now use raw coordinates. `node --test tests/input.test.mjs` passed (13/13); mask and corner samples still clamp.
- 2026-09-23 23:06 UTC: Expanded drawing source rasters for out-of-bounds marks and rendered their preview outside the stage with an even-odd clip. Compositor tests pass (6/6). Browser pixels show an outside mark in the field but not the interior preview, then on the canvas after a layer translation.
- 2026-09-23 23:07 UTC: Updated the layer picker and coordinate documentation; mobile viewport pixel check showed an off-canvas stroke above the stage. Skipped blank preview layers. Full suite passed (39/39), focused compositor rerun passed (6/6), editor diagnostics clear, diff whitespace check clear.