# Task #004: Reference Rectification Orientation

- ID: #004-reference-rectification-orientation
- Created: 2026-08-10 UTC
- Status: done
- Type: bugfix
- Stability: experimental
- Owner: agent
- Related: #001-implement-overlay-app
- Self-reminder: Read meta.md first; plan -> execute -> verify -> update.

## Summary

Fix vertical inversion when rectifying imported reference images loaded as `ImageBitmap` while preserving orientation for canvas, image, and video sources.

## Acceptance Criteria

- [x] Identity and slightly warped rectification preserve asymmetric top/bottom orientation for `HTMLCanvasElement` and `ImageBitmap` sources.
- [x] Reference rectification through the application produces an upright canonical layer.
- [x] Painting capture rectification remains upright.
- [x] Full tests and diagnostics pass.

## Root-Cause Hypothesis

`UNPACK_FLIP_Y_WEBGL` applies to DOM canvas uploads but is ignored for `ImageBitmap`; the fragment shader then performs another vertical inversion unconditionally, making orientation source-type dependent.

## Plan

- [x] Normalize rectification texture coordinates — Files: `src/cv.js` — Functions: `rectifySource()`, `createRectificationProgram()` — Verification: asymmetric browser probe for canvas and bitmap with a perspective quad.
- [x] Verify application workflows — Files: no production edits expected — Verification: imported reference rectification and canvas-based capture orientation checks.
- [x] Regression checks — Files: existing tests — Verification: `npm test` and diagnostics.

## Execution Log

* 2026-08-10 UTC Start-of-turn Context Recap:

  * Goal: Prevent imported references from turning upside down after small manual rectification.
  * Current State: Browser probe with red top/blue bottom shows canvas rectification upright but the identical `ImageBitmap` rectification inverted.
  * Blocking Issues: Node tests do not expose a browser WebGL implementation; orientation validation must run in Chromium.
  * Next Subtask: Remove source-type-dependent unpack flipping and align shader sampling to top-down source coordinates.
  * Known Risks: `rectifySource()` is shared with photo/live capture, so canvas/video orientation must be rechecked.

* 2026-08-10 UTC Completion:

  * Confirmed the source-type split with the same red-top/blue-bottom perspective warp: canvas output stayed upright while `ImageBitmap` output inverted.
  * Root cause: WebGL ignores `UNPACK_FLIP_Y_WEBGL` for `ImageBitmap`, while the shader also inverted source Y unconditionally.
  * Removed unpack flipping and sampled the homography's top-down source coordinate directly, yielding one convention for canvas, video/image, and bitmap uploads.
  * After the fix, canvas and bitmap probes both returned red `[239,48,40]` at the top and blue `[24,111,232]` at the bottom.
  * Full application verification imported a new asymmetric reference, nudged one corner, applied rectification, and sampled the stored 1800x1800 derivative with the same upright result.
  * The temporary test layer/assets were deleted and the smoke project returned to canonical mode. Verification: 22/22 tests pass and `src/cv.js` diagnostics are clean.

## Artifacts Changed

* `src/cv.js` — source-type-independent rectification texture orientation.

## Final Summary

Fixed upside-down reference rectification by removing the WebGL unpack behavior that browsers ignore for `ImageBitmap` sources and using one top-down shader sampling convention.

## Useful Commands and Testing

* `npm test`
* Browser asymmetric-pixel checks against `http://localhost:8080/`
