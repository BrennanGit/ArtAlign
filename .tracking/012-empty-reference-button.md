# Task #012: Empty Reference Button Hit Target

- ID: #012-empty-reference-button
- Created: 2026-08-11 UTC
- Status: done
- Type: bugfix
- Stability: experimental
- Owner: agent
- Related: #008-mobile-inputs-empty-state

## Summary

Ensure the empty-state `Add a reference` button is above the interaction canvas and receives pointer events.

## Acceptance Criteria

- [x] The button is clickable on the empty canvas.
- [x] Clicking it opens the reference file chooser.
- [x] Canvas interaction remains unaffected outside the button.
- [x] Existing tests and diagnostics pass.

## Plan

- [x] Correct empty-state stacking order — File: `styles.css`; Verification: browser stacking check and diagnostics.
- [x] Complete tracking record — Files: `.tracking/012-empty-reference-button.md`, `.tracking/meta.md`; Verification: task status is consistent.

## Completion

* 2026-08-11 UTC: Raised `.empty-hint` from z-index 2 to 4, above the z-index 3 interaction canvas, while retaining pointer-events only on the button.
* Verification: 22/22 tests pass, diagnostics are clean, and the browser reports the empty hint above the interaction canvas with the button's pointer events enabled.