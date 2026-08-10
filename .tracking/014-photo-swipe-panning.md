# Task #014: Photo Swipe Panning

- ID: #014-photo-swipe-panning
- Created: 2026-08-11 UTC
- Status: done
- Type: feature
- Stability: experimental
- Owner: agent
- Related: #003-zoom-canvas-navigation

## Summary

Restore single-pointer swipe panning for the photo view while preserving editing gestures in other views and modes.

## Acceptance Criteria

- [x] A single-pointer drag updates the persisted canvas pan only in photo view.
- [x] The pan delta is normalized to the interaction canvas dimensions and remains compatible with CSS stage transforms.
- [x] Pinch zoom continues to take precedence over one-pointer panning.
- [x] Canonical editing and non-photo camera interactions are unchanged.
- [x] Existing tests and the focused input test pass.

## Plan

- [x] Add and test a pure photo-pan calculation — Files: `src/input.js`, `tests/input.test.mjs`; Verification: focused input test.
- [x] Gate one-pointer navigation in the pointer lifecycle — File: `src/app.js`; Verification: `npm test`.
- [x] Complete tracking record — Files: `.tracking/014-photo-swipe-panning.md`, `.tracking/meta.md`; Verification: task status and stack are consistent.

## Execution Log

- 2026-08-11 UTC: Start-of-turn Context Recap: Goal: restore single swipe panning in photo mode. Current State: navigation tracks client pointers for pinch but has no one-pointer pan path. Blocking Issues: none. Next Subtask: add the pure pan calculation and its test. Known Risks: pan must be normalized by canvas dimensions and must not intercept editing gestures outside photo view.
- 2026-08-11 UTC: Added zoom-aware `panViewByPointer()` and routed ordinary one-pointer gestures in photo view through it. Corner editing remains available in photo corner mode, and pinch promotion clears the provisional swipe.
- 2026-08-11 UTC: Verification complete: focused pan test passed, full suite passed with 23/23 tests, and diagnostics found no errors in touched source or test files.
