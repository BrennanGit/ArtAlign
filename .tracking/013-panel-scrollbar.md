# Task #013: Panel Scrollbar Gesture Target

- ID: #013-panel-scrollbar
- Created: 2026-08-11 UTC
- Status: done
- Type: bugfix
- Stability: experimental
- Owner: agent
- Related: #006-compact-layer-panel

## Summary

Make the Layers panel's scroll affordance explicit and contain its vertical gestures on phone screens.

## Acceptance Criteria

- [x] The panel reserves a narrow scrollbar on its right edge.
- [x] Vertical scrolling is handled by the panel and contained at its boundaries.
- [x] The mobile panel stays clear of the iPhone bottom gesture area.
- [x] Existing tests and diagnostics pass.

## Plan

- [x] Update inspector scrolling styles — File: `styles.css`; Verification: browser computed-style check.
- [x] Complete tracking record — Files: `.tracking/013-panel-scrollbar.md`, `.tracking/meta.md`; Verification: task status is consistent.

## Completion

* 2026-08-11 UTC: Added a thin reserved scrollbar, `touch-action: pan-y`, and `overscroll-behavior-y: contain` to the Layers panel. Raised the mobile sheet's bottom offset to clear the iPhone gesture area.
* Verification: 22/22 tests pass, diagnostics are clean, and browser computed styles confirm `overflow-y: scroll`, `scrollbar-gutter: stable`, `scrollbar-width: thin`, `touch-action: pan-y`, and contained overscroll.