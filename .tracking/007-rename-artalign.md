# Task #007: Rename App to ArtAlign

- ID: #007-rename-artalign
- Created: 2026-08-11 UTC
- Status: done
- Type: docs
- Stability: experimental
- Owner: agent
- Related: none
- Self-reminder: Read meta.md first; plan -> execute -> verify -> update.

## Summary

Rename the user-facing application brand and package metadata to ArtAlign while preserving existing local project storage.

## Acceptance Criteria

- [x] Browser title and landing-page brand display `ArtAlign`.
- [x] README identifies the app as `ArtAlign`.
- [x] Package metadata uses an ArtAlign-compatible package name.
- [x] IndexedDB uses the ArtAlign database name.
- [x] Existing tests pass.

## Plan

- [x] Update user-facing and package name references — Files: `index.html`, `README.md`, `package.json` — Verification: targeted search for old brand and full test suite.
- [x] Align the IndexedDB key — File: `src/store.js` — Verification: store module check and full test suite.
- [x] Complete tracking record — Files: `.tracking/007-rename-artalign.md`, `.tracking/meta.md` — Verification: status and task stack are consistent.

## Execution Log

* 2026-08-11 UTC Start-of-turn Context Recap:

  * Goal: Rename the app to ArtAlign.
  * Current State: The public brand is True Plane and package metadata uses `painting-proportion-overlay`.
  * Blocking Issues: None.
  * Next Subtask: Update the three public naming surfaces while retaining the IndexedDB key for migration compatibility.
  * Known Risks: Renaming persistent storage would strand existing local projects, so it is intentionally excluded.

* 2026-08-11 UTC Completion:

  * Renamed the browser title, landing-page heading, README identity, and package name to ArtAlign.
  * Preserved the `painting-proportion-overlay` IndexedDB key so existing local projects remain available.
  * Verification: targeted public-file search found no old brand references; diagnostics are clean; 22/22 tests pass.

## Decisions

* Rename the IndexedDB database because the app has not been deployed and development data was cleared.

* 2026-08-11 UTC Follow-up Completion:

  * Renamed the IndexedDB database key from `painting-proportion-overlay` to `artalign`.
  * Verification: no old brand or database references remain in application and test files; store diagnostics are clean; 22/22 tests pass.
