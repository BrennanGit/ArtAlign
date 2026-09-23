# Task #038: Panel Finish Control

- ID: #038-panel-finish
- Created: 2026-09-23 UTC
- Status: done
- Type: feature
- Owner: agent
- Related: #037-linked-layer-transform

## Summary

Show a square orange finish tick at the top right of the Layers panel in active modes, with the same action as the viewport tick. Remove the mid-panel reference Done button.

## Acceptance Criteria

- [x] Active editing and transform panels show the finish tick in the header; canonical view mode does not.
- [x] Header tick uses `finishCurrentMode()` including rectification behavior, and reference controls no longer show Done.
- [x] Browser workflow and automated tests pass.

## Plan

- [x] Wire the header finish action and remove the reference Done branch. Files: `src/app.js`, `styles.css`; Functions: `panelHeader()`, `handleInspectorClick()`, `renderInspector()`; Verify: browser click for reference and drawing modes; common handler covers transform and rectification.
- [x] Document the header finish control. File: `README.md`; Function: workflow text; Verify: compare with panel.

## Execution Log

- 2026-09-23 UTC: Start-of-turn Context Recap: Goal: one consistent finish action at the top of active panels. Current State: viewport has `finishCurrentMode()`; reference panel has a separate Done handler. Blocking Issues: none. Next Subtask: add header action and remove Done. Known Risks: rectification and canonical view visibility.
- 2026-09-23 UTC: Added header finish action, removed reference Done and documented location. Browser verified drawing and reference finish, no idle tick and no reference Done; full suite 36/36 passing.