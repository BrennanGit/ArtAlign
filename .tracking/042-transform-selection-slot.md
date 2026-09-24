# Task #042: Transform Selection Slot

- ID: #042-transform-selection-slot
- Created: 2026-09-24 UTC
- Status: done
- Type: feature
- Owner: agent
- Related: #037-linked-layer-transform, #039-layer-transform-shortcut

## Summary

Replace each layer's transform shortcut with its link checkbox in transform mode without changing the row layout. Unticking the last selected layer finishes transform mode.

## Acceptance Criteria

- [x] Transform mode shows checkboxes in the existing transform button positions, with no row reflow.
- [x] The active layer can be unticked; remaining selected layers stay transformable, and unticking the last one exits transform mode.
- [x] Reference-group selection still operates on its children, and the mobile layer list remains usable.
- [x] Browser workflow, tests, and documentation agree with the behavior; changes are committed and pushed.

## Plan

- [x] Replace the row control and adjust its dimensions. Files: `src/app.js`, `styles.css`; Functions: `layerRow()`; Verify: browser row layout at mobile width and `node --check src/app.js`.
- [x] Reconcile active and linked selection when a checkbox changes. File: `src/app.js`; Functions: `handleInspectorChange()`, `finishCurrentMode()`; Verify: browser selection, driver promotion, last untick, and reference group flow.
- [x] Update workflow text and run full suite. File: `README.md`; Function: workflow text; Verify: `npm test`, browser, and diff check.
- [x] Record results and commit/push. Files: `.tracking/042-transform-selection-slot.md`, `.tracking/meta.md`; Verify: clean branch and remote update.

## Execution Log

- 2026-09-24 UTC: Start-of-turn Context Recap: Goal: replace transform icons with checkboxes in the same slot while transforming, and exit when none remain. Current State: checkbox adds a 28px grid column before the name; active checkbox is disabled; transform button stays visible. Blocking Issues: none. Next Subtask: swap row markup and reconcile selections. Known Risks: driver promotion across reference and non-reference layers, group selection, and mobile row width. Hypothesis: using the existing action cell and promoting a remaining checked layer preserves the transform interaction. Cheap check: JavaScript syntax followed by browser row and selection assertions.
- 2026-09-24 UTC: Replaced the transform icon in place; selecting and deselecting layers now promotes a remaining driver or finishes when none remain, including Reference group changes. Updated workflow guidance. JavaScript syntax, 39/39 automated tests, editor diagnostics, and diff whitespace checks pass. Browser at 375px confirmed unchanged row columns, selection handoff across layer kinds, group children selection, last-untick exit, and icons restored afterward; disposable project deleted. Commit and push follow immediately.