# Task #005: Projection Corner Mapping

- ID: #005-projection-corner-mapping
- Created: 2026-08-10 UTC
- Status: done
- Type: bugfix
- Stability: experimental
- Owner: agent
- Related: #001-implement-overlay-app, #004-reference-rectification-orientation
- Self-reminder: Read meta.md first; plan -> execute -> verify -> update.

## Summary

Make each Photo/Live corner handle control the matching physical corner of the projected canonical overlay while preserving upright background and overlay orientation.

## Acceptance Criteria

- [x] Moving quad index 0 changes physical top-left coverage and does not move bottom-left coverage.
- [x] All four DOM top-down quad corners map to the corresponding rendered corners.
- [x] Background and asymmetric overlay content remain upright.
- [x] Photo manual-corner interaction visually matches the drawn quad.
- [x] Full tests and diagnostics pass.

## Root-Cause Hypothesis

The fragment shader passes bottom-up WebGL `v_uv` directly into a homography built from top-down DOM coordinates, then flips overlay Y after projection. This vertically mirrors quad geometry relative to the handles.

## Plan

- [x] Normalize renderer coordinates — Files: `src/renderer.js` — Functions: projection fragment shader — Verification: isolated top-left/bottom-left coverage probe.
- [x] Verify orientation and all corners — Files: no production edits expected — Verification: asymmetric overlay/browser pixel checks and Photo interaction screenshot.
- [x] Regression checks — Files: existing tests — Verification: `npm test` and diagnostics.

## Execution Log

* 2026-08-10 UTC Start-of-turn Context Recap:

  * Goal: Ensure dragging a Photo/Live corner changes the same projected overlay corner.
  * Current State: With only top-left pulled inward, an isolated renderer probe paints top-left red and bottom-left dark, proving the geometry is vertically mirrored.
  * Blocking Issues: Node tests do not provide WebGL; pixel validation runs in Chromium.
  * Next Subtask: Convert fragment position to top-down before inverse homography and remove post-projection overlay flipping.
  * Known Risks: Background and overlay texture orientation must remain upright after the geometry fix.

* 2026-08-10 UTC Completion:

  * Confirmed the defect in an isolated renderer: pulling only top-left inward left the physical top-left red and made bottom-left dark.
  * Converted WebGL's bottom-up fragment position to a top-down `screenPoint` before background sampling and inverse homography, then sampled the top-down canonical overlay coordinate directly.
  * The identical probe now makes top-left dark, leaves bottom-left red, and retains the red center.
  * A four-color perspective probe mapped red/green/blue/yellow to physical top-left/top-right/bottom-right/bottom-left respectively, proving orientation and all corner associations.
  * Real Photo-mode verification changed only `quad[0]` from `(0.08,0.08)` to approximately `(0.27,0.20)`; the screenshot showed the overlay following the visible top-left handle while bottom-left remained fixed.
  * Restored the smoke project's neutral quad and canonical mode. Verification: 22/22 tests pass and `src/renderer.js` diagnostics are clean.

## Artifacts Changed

* `src/renderer.js` — consistent top-down screen, homography, and overlay texture coordinates.

## Final Summary

Fixed vertically mirrored projection geometry so every Photo/Live corner handle now controls its matching rendered overlay corner without flipping image content.

## Useful Commands and Testing

* `npm test`
* Browser WebGL pixel probes against `http://localhost:8080/`
