# Task #034: Exclude Navigation from History

- Created: 2026-09-23 UTC
- Status: done
- Type: bugfix
- Owner: agent

## Acceptance Criteria
- [x] Panning and zooming never add an undo step or clear redo.
- [x] Undo/redo of project edits preserve the currently visible pan and zoom; navigation remains saved normally.

## Plan
- [x] Update `snapshot()` in `src/history.js` and `restoreHistory()` in `src/app.js`; test pure history behavior in `tests/history.test.mjs` and run `npm test`.

## Execution Log
- 2026-09-23 UTC Start-of-turn Context Recap: Goal: project edits only in history. Current State: `scheduleSave()` records whole project including view and `restoreHistory()` replaces project with snapshot. Blocking Issues: none. Next Subtask: filter navigation from snapshots and retain live view on restore. Known Risks: restore must keep view defined for subsequent gestures.
- 2026-09-23 UTC: Removed view from history snapshots and preserved live view on restore. Corrected a test setup that had not applied the returned undo state. Browser cache held old history code, so bumped app/history module URLs. Browser wheel left Undo disabled; undoing a canvas-size edit preserved the transformed view. `npm test`: 31/31.