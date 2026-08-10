# Task #009: Reduce Loupe Magnification

- ID: #009-loupe-magnification
- Created: 2026-08-11 UTC
- Status: done
- Type: bugfix
- Stability: experimental
- Owner: agent
- Related: #004-reference-rectification-orientation

## Summary

Reduce the loupe's magnification so pointer movement feels less jumpy during corner editing.

## Completion

* 2026-08-11 UTC: Increased the source crop from 48px to 64px while retaining the 160px display size, reducing magnification without changing loupe placement or crosshair behavior.
* Verification: full test suite and changed-file diagnostics pass.