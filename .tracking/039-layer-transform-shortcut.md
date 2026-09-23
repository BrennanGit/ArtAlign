# Task #039: Layer Transform Shortcut

- ID: #039-layer-transform-shortcut
- Created: 2026-09-23 UTC
- Status: done
- Type: feature
- Owner: agent
- Related: #038-panel-finish

## Summary

Clicking a layer name edits it; the row's old pencil button enters the applicable transform mode directly.

## Acceptance Criteria

- [x] Clicking a layer name enters the same editor the pencil button used to open.
- [x] Row shortcut enters reference composition for a reference item, transform mode for a drawing, capture, or guide, and moves all reference-group items together when invoked on the group.
- [x] Existing visibility, rename, deletion, linking, and row drag actions remain unchanged; browser workflow and automated tests pass.
- [x] The orange finish tick lives beside the layer name/type in the editor below the layer list, not in the Layers panel header; it still calls `finishCurrentMode()`.
- [x] No drawing/capture/guide editor shows a transform or done-transforming toggle. Row transform enters the mode and the tick finishes it.

## Plan

- [x] Route layer name and shortcut to editing and transform handlers. File: `src/app.js`; Functions: `handleInspectorClick()`, `editLayer()`, `transformLayer()`, `layerRow()`, `finishLayerDrag()`; Verify: browser interactions across drawing, references, guide, and group; full test suite.
- [x] Update layer-action usage instructions. File: `README.md`; Function: workflow text; Verify: compare with UI.
- [x] Move finish markup to the layer editor heading and remove transform toggle templates/handlers. Files: `src/app.js`, `styles.css`; Functions: `renderInspector()`, `editorHeading()`, `panelHeader()`, `handleInspectorClick()`; Verify: browser snapshots and mode transition for drawing, reference and guide; full test suite.
- [x] Align workflow instructions with the revised editor header. File: `README.md`; Function: workflow text; Verify: compare with UI.

## Execution Log

- 2026-09-23 UTC: Intake: reference group has no own transform; shortcut will transform its children together using existing linked transforms, with the last child as the gesture driver. Empty group has no applicable transform.
- 2026-09-23 UTC: Start-of-turn Context Recap: Goal: name edits, row button transforms. Current State: name selects; pencil enters editLayer(); reference composition and linked transforms already exist. Blocking Issues: none. Next Subtask: redirect name and row actions. Known Risks: group selection, stale links, drag vs click and keeping editor controls visible.
- 2026-09-23 UTC: Redirected layer-name taps to editLayer(), including pointer-captured short taps, and row icon to direct transform; group links all children. Added header finish visibility for guide/capture editors, placed the tick at the rightmost edge, and updated README. Browser verified drawing/reference/guide shortcuts, group selection, empty group disabled state, guide completion, and desktop/mobile layout; temporary browser projects removed. Node syntax, full suite 36/36, diagnostics and diff check pass.
- 2026-09-23 UTC: Start-of-turn Context Recap: Goal: remove redundant transform toggles and put finish tick in selected editor heading below the layer list. Current State: panelHeader() renders the tick; drawing/guide/capture templates still render toggle buttons. Blocking Issues: none. Next Subtask: move finish markup and remove toggles. Known Risks: rectification editor and compact mobile heading layout. Local check: DOM ordering and button absence after name and transform-row clicks.
- 2026-09-23 UTC: Moved finish control to editorHeading() for selected layers and rectification, removed drawing/layer transform menu toggles and handlers, adjusted compact heading layout and README. Browser verified drawing/guide/reference editor location, transform shortcuts, tick completion, and 320px layout; disposable project removed. Node syntax and 36/36 tests pass, no diagnostics, no leftover toggle actions, diff check clean. This supersedes the panel-header location recorded in #038.