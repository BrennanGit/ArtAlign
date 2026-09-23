# Task #032: View Names

- Created: 2026-09-23 UTC
- Status: done
- Type: feature
- Owner: agent

## Acceptance Criteria
- [x] View menu options read Project onto photo, Project onto video, and Download, with existing behavior unchanged.

## Plan
- [x] Update `index.html` and dynamic labels in `src/app.js`; verify menu labels in browser.

## Execution Log
- 2026-09-23 UTC Start-of-turn Context Recap: Goal: requested view-menu names. Current State: menu labels are static initially and photo/live labels toggle in `setView()`. Blocking Issues: none. Next Subtask: rename initial and dynamic labels, verify menu in browser. Known Risks: selected-view return affordances.
- 2026-09-23 UTC: Updated initial and dynamic labels. Browser confirmed exact menu names; active view remains highlighted, clicking again retains canonical-return behavior.