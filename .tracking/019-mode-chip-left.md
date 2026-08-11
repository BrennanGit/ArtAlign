# Task #019: Move Mode Chip Left

- ID: #019-mode-chip-left
- Created: 2026-08-11 UTC
- Status: in-progress
- Type: bugfix
- Stability: experimental
- Owner: agent
- Related: #008-mobile-inputs-empty-state

## Summary

Move the desktop status and confirmation chip to the top-left so it does not sit beneath the layer panel.

## Plan

- [x] Change the mode chip horizontal anchor in `styles.css`; verify tests and diagnostics.
- [x] Complete tracking record in this task file and `.tracking/meta.md`.

## Execution Log

- 2026-08-11 UTC: Start-of-turn Context Recap: Goal: keep the status/confirmation box visible on desktop when the panel is open. Current State: `.mode-chip` is anchored top-right and overlaps the right-side inspector. Blocking Issues: none. Next Subtask: move the anchor to the top-left. Known Risks: preserve mobile layout and chip width constraints.
- 2026-08-11 UTC: Changed the desktop and mobile `.mode-chip` anchors from `right` to `left`.
- 2026-08-11 UTC: Verification complete: all 23 automated tests passed and stylesheet diagnostics found no errors.
- 2026-08-11 UTC: Status: done.