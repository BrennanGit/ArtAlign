# Task #018: Viewport-Anchored Loupe

- ID: #018-loupe-viewport-position
- Created: 2026-08-11 UTC
- Status: in-progress
- Type: bugfix
- Stability: experimental
- Owner: agent
- Related: #003-zoom-canvas-navigation, #017-field-interaction-layer

## Summary

Keep the editing loupe in a consistent viewport position when the canvas is zoomed or panned.

## Plan

- [x] Move the loupe outside the transformed stage while retaining viewport overlay behavior. Files: `index.html`, `styles.css`; Verification: focused diagnostics and full tests.
- [x] Complete tracking record. Files: `.tracking/018-loupe-viewport-position.md`, `.tracking/meta.md`; Verification: active stack and task status are consistent.

## Execution Log

- 2026-08-11 UTC: Start-of-turn Context Recap: Goal: anchor the loupe to the viewport instead of the transformed canvas. Current State: the loupe is a child of the zoomed stage and uses percentage placement. Blocking Issues: none. Next Subtask: move the loupe to the viewport overlay layer and verify its bounds while zoomed. Known Risks: the loupe must remain above the interaction layer and inside the viewport on narrow layouts.
- 2026-08-11 UTC: Moved `#loupe` beside the transformed stage and made its overlay positioning explicit so `drawLoupe()` percentages resolve against the viewport panel.
- 2026-08-11 UTC: Verification complete: all 23 automated tests passed and diagnostics found no errors in `index.html` or `styles.css`.
- 2026-08-11 UTC: Status: done.