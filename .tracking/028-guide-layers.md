# Task #028: Guide Layers

- ID: #028-guide-layers
- Created: 2026-09-23 UTC
- Status: done
- Type: feature
- Stability: experimental
- Owner: agent
- Related: #026-view-menu-history-export

## Acceptance Criteria

- [x] Any number of guide layers can define independent horizontal and vertical equal divisions.
- [x] Each layer exposes its own colour and thickness; guides respect visibility, order, and opacity in canonical/projection/export rendering.
- [x] Guides persist, remain editable after reload, and participate in global history.

## Plan

- [x] Add guide model and compositing — Files: `src/model.js`, `src/canonical.js`, tests; functions: `createGuideLayer()`, `CanonicalCompositor.rebuild()`; verify guide positions and style.
- [x] Add guide creation and inspector controls — Files: `index.html`, `src/app.js`, `styles.css`; functions: `handleLayerTypeClick()`, `renderInspector()`, `handleInspectorInput()`; verify browser workflow.
- [x] Document and verify — Files: `spec.md`, `README.md`; verify `npm test` and browser image check.

## Execution Log

- 2026-09-23 UTC Start-of-turn Context Recap: Goal: independently styled equal-division guide layers. Current State: guide coordinate space is specified but no guide model or rendering exists. Blocking Issues: waiting for #026 and #027. Next Subtask: model plus compositor. Known Risks: fractional line positions and style scaling across aspect ratios.
- 2026-09-23 UTC Start-of-turn Context Recap: Goal: independently styled equal-division guide layers. Current State: menu/history and pan changes pass focused tests. Blocking Issues: none. Next Subtask: model and compositor followed by inspector creation/editing. Known Risks: export and projection must use the same guide pixels.
- 2026-09-23 UTC: Added model, compositor, and inspector for guide divisions and styles; browser checked both a saved guide after reload and a second independently styled guide (red third and green quarter pixels). PNG export reuses the guide compositor. Full Node suite 28/28 and mobile screenshot passed.