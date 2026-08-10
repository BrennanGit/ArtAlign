# Task #011: Compact Project Modal

- ID: #011-compact-project-modal
- Created: 2026-08-11 UTC
- Status: done
- Type: refactor
- Stability: experimental
- Owner: agent
- Related: #006-compact-layer-panel

## Summary

Make the new-project modal compact and usable on narrow phone screens by stacking the ratio fields and constraining modal controls.

## Acceptance Criteria

- [x] Width and Height ratio inputs appear on separate lines.
- [x] Modal controls use compact panel-like sizing.
- [x] Modal action buttons remain inside the dialog on narrow screens.
- [x] Existing tests and diagnostics pass.

## Plan

- [x] Update project modal layout — Files: `styles.css`; Verification: browser geometry check and diagnostics.
- [x] Complete tracking record — Files: `.tracking/011-compact-project-modal.md`, `.tracking/meta.md`; Verification: task status is consistent.

## Completion

* 2026-08-11 UTC: Stacked Width and Height, removed the standalone colon, compacted modal controls to 34px, and made action buttons shrink within the dialog.
* Verification: 22/22 tests pass, CSS diagnostics are clean, and browser geometry at 390px width confirmed separate ratio rows and action bounds inside the dialog.