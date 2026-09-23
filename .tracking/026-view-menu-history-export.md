# Task #026: View Menu, Export, and Global History

- ID: #026-view-menu-history-export
- Created: 2026-09-23 UTC
- Status: done
- Type: feature
- Stability: experimental
- Owner: agent
- Related: #027-two-finger-pan, #028-guide-layers

## Acceptance Criteria

- [x] One header view button opens a compact menu for photo, live camera, and downloading the visible canonical composition.
- [x] Header undo/redo handles project edits across layer types and workflows, replacing drawing/mask-local undo/redo; redo clears on new edits.
- [x] Saved project and asset changes restore coherently; transient UI state does not corrupt restored state.
- [x] Tests, browser workflow, and technical spec cover the new behavior.

## Plan

- [x] Add view menu and export from the canonical compositor — Files: `index.html`, `styles.css`, `src/app.js`; functions: `bindEvents()`, `setView()`, `refresh()`; verify browser export dimensions and pixels.
- [x] Add project-wide history at action boundaries, including asset lifecycle and drag coalescing — Files: `src/app.js`, `src/model.js`, `src/history.js`, tests; functions: `scheduleSave()`, `saveNow()`, `persistMask()`; verify undo/redo and reload workflows.
- [x] Document behavior — Files: `spec.md`, `README.md`; verify `npm test` and browser smoke check.

## Execution Log

- 2026-09-23 UTC Start-of-turn Context Recap: Goal: consolidate view actions, export visible canonical image, and global history. Current State: photo/live are separate buttons, undo/redo live in drawing and mask inspector, autosave is debounced. Blocking Issues: none. Next Subtask: header menu/export then history. Known Risks: asset deletion, asynchronous saves, and in-progress mask sessions require explicit history boundaries.
- 2026-09-23 UTC: Added view menu/export, project-wide bounded history, unique mask assets, and active view persistence. Node suite 26/26; browser menu opened successfully. Pending final browser workflows and documentation before closure.
- 2026-09-23 UTC: Browser undo/redo restored guide division values; export produced an 1800x1800 PNG with correct coloured guide pixels and opaque white background. Documented in spec and README. History is intentionally session-bound and capped at 50 actions.